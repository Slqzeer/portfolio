import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AnimationClip,
  AnimationMixer,
  Color,
  LoopOnce,
  DataTexture,
  FileLoader,
  EquirectangularReflectionMapping,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  SRGBColorSpace,
  ShaderChunk,
  Texture,
  TextureLoader,
} from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { gardenSunlight } from "./gardenPortal";
import type { Lighting } from "../app/appState";

// The baked lightmaps carry all light and shadow, so there is no ambient light (it
// washed the bake out). Unbaked flags, glass and screens get this flat light.
const FLAT_LIGHT = { day: 2, night: 0.1 };
const WHITE = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;
// Match the authored Blender exposure instead of washing out the day bake.
const EXPOSURE = { day: 1, night: 1 };
const LAMP_LIGHT = 6;
// Mirrors MAT_WindowView: the garden glow drops to 0.05 / 2 before the blind closes.
const WINDOW_VIEW_NIGHT = 0.025;

export type LightmapKey = `LM_${"props" | "shell"}_${Lighting}`;
const LIGHTMAP_KEYS: LightmapKey[] = [
  "LM_props_day",
  "LM_props_night",
  "LM_shell_day",
  "LM_shell_night",
];
const LIGHTMAP_URLS = LIGHTMAP_KEYS.map(
  (key) => `/assets/room/lightmaps/${key}.webp`,
);
// Cycles panoramas of the room (scripts/render-room-env.py), used for reflections only.
const ENV_URLS = [
  "/assets/room/env/env_day.hdr",
  "/assets/room/env/env_night.hdr",
];
type Environments = Record<"day" | "night", Texture>;

export const IBL_DIFFUSE =
  "iblIrradiance += getIBLIrradiance( geometryNormal );";
const LIGHTS_WITHOUT_IBL_DIFFUSE = ShaderChunk.lights_fragment_maps.replace(
  IBL_DIFFUSE,
  "",
);
const blends = new WeakMap<
  Material,
  { map: { value: Texture }; gain: { value: number } }
>();

// The lightmap already holds all diffuse light; three.js would add the
// environment's diffuse on top and wash the bake out. Keep only its reflections.
export function withoutIblDiffuse(material: Material) {
  const blend = { map: { value: WHITE as Texture }, gain: { value: 0 } };
  blends.set(material, blend);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roomNightMap = blend.map;
    shader.uniforms.roomNightGain = blend.gain;
    shader.fragmentShader =
      "uniform sampler2D roomNightMap;\nuniform float roomNightGain;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_maps>",
      LIGHTS_WITHOUT_IBL_DIFFUSE.replace(
        "vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;",
        "vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity + texture2D( roomNightMap, vLightMapUv ).rgb * roomNightGain;",
      ),
    );
  };
}

export function applyLightmaps(
  materials: Material[],
  textures: Record<LightmapKey, Texture>,
  { dayMap, nightMap }: { dayMap: number; nightMap: number },
  scales: Record<LightmapKey, number>,
  environments?: Environments,
  exposure: Record<Lighting, number> = EXPOSURE,
) {
  for (const material of materials) {
    const lit = material as MeshStandardMaterial;
    if (!lit.lightMap || (environments && !lit.envMap)) lit.needsUpdate = true;
    if (environments) {
      lit.envMap = environments[dayMap >= nightMap ? "day" : "night"];
      lit.envMapIntensity = exposure.day * dayMap + exposure.night * nightMap;
    }
    if (
      material.userData.lightmapAtlas === "blind" ||
      material.userData.lightmapAtlas === "exterior"
    ) {
      const exterior = material.userData.lightmapAtlas === "exterior";
      // Keep ambient fill, but retain directional diffuse to reveal the slat faces.
      lit.lightMap = WHITE;
      lit.lightMapIntensity =
        (exterior ? 0.15 : 1) * exposure.day * dayMap +
        FLAT_LIGHT.night * exposure.night * nightMap;
      if (environments) lit.envMap = environments.day;
      lit.envMapIntensity =
        (exterior ? 1.6 : 0.6) * exposure.day * dayMap +
        0.1 * exposure.night * nightMap;
      continue;
    }
    if (!blends.has(material)) withoutIblDiffuse(material);
    const blend = blends.get(material)!;
    if (material.userData.lightmapAtlas === "flat") {
      lit.lightMap = WHITE;
      lit.lightMapIntensity = FLAT_LIGHT.day * exposure.day * dayMap;
      blend.map.value = WHITE;
      blend.gain.value = FLAT_LIGHT.night * exposure.night * nightMap;
      continue;
    }
    const dayKey = `LM_${material.userData.lightmapAtlas}_day` as LightmapKey;
    const nightKey =
      `LM_${material.userData.lightmapAtlas}_night` as LightmapKey;
    lit.lightMap = textures[dayKey];
    blend.map.value = textures[nightKey];
    blend.gain.value = scales[nightKey] * exposure.night * nightMap * Math.PI;
    // Blender bakes the light a surface receives (shade = albedo × bake); three.js
    // treats lightMap as irradiance and divides it by π (Lambert).
    lit.lightMapIntensity = scales[dayKey] * exposure.day * dayMap * Math.PI;
  }
}

export interface RoomLightingProps {
  lighting: Lighting;
  scene: Object3D;
  animations: AnimationClip[];
  reducedMotion?: boolean;
}

export function lightingFrame(lighting: Lighting, progress: number) {
  const value = Math.max(0, Math.min(1, progress));
  const night = lighting === "night" ? value : 1 - value;
  return {
    lamp: LAMP_LIGHT * night,
    curtainProgress: night,
    dayMap: 1 - night,
    nightMap: night,
    windowView: Math.max(1 - night, WINDOW_VIEW_NIGHT),
  };
}

export function createCurtainPlayback(
  scene: Object3D,
  animations: AnimationClip[],
) {
  const mixer = new AnimationMixer(scene);
  const clips = animations.filter(({ name }) => name.startsWith("Curtain_"));
  const duration = Math.max(0.001, ...clips.map((clip) => clip.duration));
  let actions: NonNullable<ReturnType<AnimationMixer["clipAction"]>>[] = [];
  return {
    duration,
    start() {
      actions = clips.map((clip) => {
        const action = mixer
          .clipAction(clip)
          .reset()
          .setLoop(LoopOnce, 1)
          .play();
        action.clampWhenFinished = true;
        action.paused = true;
        return action;
      });
    },
    sample(progress: number) {
      const value = Math.max(0, Math.min(1, progress));
      actions.forEach((action) => {
        action.time = duration * value;
      });
      mixer.update(0);
    },
    stop() {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      actions = [];
    },
  };
}

export function RoomLighting({
  lighting,
  scene,
  animations,
  reducedMotion = false,
}: RoomLightingProps) {
  const lamp = useRef<PointLight>(null);
  const anisotropy = useThree(({ gl }) => gl.capabilities.getMaxAnisotropy());
  const nightMix = useRef(lighting === "night" ? 1 : 0);
  const exposure = useMemo(
    () => ({
      day:
        typeof scene.userData.web_exposure_day === "number"
          ? scene.userData.web_exposure_day
          : EXPOSURE.day,
      night:
        typeof scene.userData.web_exposure_night === "number"
          ? scene.userData.web_exposure_night
          : EXPOSURE.night,
    }),
    [scene],
  );
  const loaded = useLoader(TextureLoader, LIGHTMAP_URLS as string[]);
  const scales = useLoader(
    FileLoader,
    "/assets/room/lightmaps/scales.json",
    (loader) => {
      loader.setResponseType("json");
    },
  ) as unknown as Record<LightmapKey, number>;
  const lightmaps = useMemo(() => {
    for (const texture of loaded) {
      texture.flipY = false;
      texture.channel = 1;
      texture.colorSpace = SRGBColorSpace;
    }
    return Object.fromEntries(
      LIGHTMAP_KEYS.map((key, index) => [key, loaded[index]]),
    ) as Record<LightmapKey, Texture>;
  }, [loaded]);
  const [envDay, envNight] = useLoader(HDRLoader, ENV_URLS);
  const environments = useMemo(() => {
    envDay.mapping = envNight.mapping = EquirectangularReflectionMapping;
    return { day: envDay, night: envNight };
  }, [envDay, envNight]);
  const bakedMaterials = useMemo(() => {
    const materials = new Set<Material>();
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      for (const material of [object.material].flat() as Material[]) {
        if (material.userData.lightmapAtlas) materials.add(material);
      }
    });
    // The isometric view sees the floor, rug and desk at grazing angles.
    for (const texture of [
      ...loaded,
      ...[...materials].flatMap((material) =>
        Object.values(material).filter((value) => value instanceof Texture),
      ),
    ]) {
      texture.anisotropy = anisotropy;
    }
    return [...materials];
  }, [scene, loaded, anisotropy]);
  const exterior = useMemo(() => {
    const materials = new Set<MeshStandardMaterial>();
    scene.traverse((object) => {
      if (
        object instanceof Mesh &&
        (object.name === "EMIT_WindowView" || object.userData.exterior_surface)
      ) {
        for (const material of [object.material].flat()) {
          if (material instanceof MeshStandardMaterial) materials.add(material);
        }
      }
    });
    return [...materials].map((material) => ({
      material,
      base: material.emissiveIntensity,
      day: material.emissive.clone(),
      night: material.emissive.clone().multiply(new Color("#718bb2")),
    }));
  }, [scene]);
  const curtains = useMemo(
    () => createCurtainPlayback(scene, animations),
    [animations, scene],
  );

  // Arm the clips here, not in useMemo: StrictMode's dev remount runs the
  // cleanup once, and clips stopped there would never play again.
  useEffect(() => {
    curtains.start();
    return () => curtains.stop();
  }, [curtains]);

  useLayoutEffect(() => {
    scene
      .getObjectByName("LIGHT_Lamp")
      ?.getWorldPosition(lamp.current!.position);
  }, [scene]);

  useFrame((_, deltaSeconds) => {
    const target = lighting === "night" ? 1 : 0;
    // A slow render or tab resume must not skip the entire curtain movement.
    nightMix.current = reducedMotion
      ? target
      : Math.max(
          0,
          Math.min(
            1,
            nightMix.current +
              ((target ? 1 : -1) * Math.min(deltaSeconds, 0.1)) /
                (curtains.duration * 1.4),
          ),
        );
    const mix = nightMix.current;
    const frame = lightingFrame("night", mix * mix * (3 - 2 * mix));
    if (lamp.current) lamp.current.intensity = frame.lamp;
    gardenSunlight.value = 1.5 * frame.dayMap + 0.015 * frame.nightMap;
    applyLightmaps(
      bakedMaterials,
      lightmaps,
      frame,
      scales,
      environments,
      exposure,
    );
    exterior.forEach(({ material, base, day, night }) => {
      material.emissiveIntensity = base * frame.windowView;
      material.emissive.lerpColors(day, night, frame.nightMap);
    });

    // Blender already authors the easing and the sequence of slat movements.
    curtains.sample(mix);
  });

  return (
    <>
      <pointLight
        ref={lamp}
        color="#e98cff"
        distance={7}
        decay={2}
        intensity={0}
      />
    </>
  );
}
