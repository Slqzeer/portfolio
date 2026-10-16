import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AnimationClip,
  AnimationMixer,
  DataTexture,
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
import type { Lighting } from "../app/appState";

// The baked lightmaps carry all light and shadow, so there is no ambient light (it
// washed the bake out). Unbaked meshes (blind, flags, glass) get this flat light.
const FLAT_LIGHT = { day: 2, night: 0.1 };
const WHITE = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;
// Brightens the whole day state (bake and flat light) beyond Blender's render.
const EXPOSURE = { day: 1.6, night: 1 };
const LAMP_LIGHT = 6;
// Mirrors MAT_WindowView: the garden glow drops to 0.05 / 2 before the blind closes.
const WINDOW_VIEW_NIGHT = 0.025;

// Mirrors public/assets/room/lightmaps/scales.json (written by encode-room-lightmaps.py).
export const LIGHTMAP_SCALES = {
  LM_props_day: 16.5737,
  LM_props_night: 1.71722,
  LM_shell_day: 7.68879,
  LM_shell_night: 2.32144,
} as const;
type LightmapKey = keyof typeof LIGHTMAP_SCALES;
const LIGHTMAP_KEYS = Object.keys(LIGHTMAP_SCALES) as LightmapKey[];
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

// The lightmap already holds all diffuse light; three.js would add the
// environment's diffuse on top and wash the bake out. Keep only its reflections.
export function withoutIblDiffuse(material: Material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_maps>",
      LIGHTS_WITHOUT_IBL_DIFFUSE,
    );
  };
}

export function applyLightmaps(
  materials: Material[],
  textures: Record<LightmapKey, Texture>,
  { dayMap, nightMap }: { dayMap: number; nightMap: number },
  environments?: Environments,
) {
  const [state, weight] =
    dayMap > 0 ? (["day", dayMap] as const) : (["night", nightMap] as const);
  for (const material of materials) {
    const lit = material as MeshStandardMaterial;
    if (!lit.lightMap || (environments && !lit.envMap)) lit.needsUpdate = true;
    if (environments) {
      lit.envMap = environments[state];
      lit.envMapIntensity = EXPOSURE[state] * weight;
    }
    if (material.userData.lightmapAtlas === "flat") {
      lit.lightMap = WHITE;
      lit.lightMapIntensity = FLAT_LIGHT[state] * EXPOSURE[state] * weight;
      continue;
    }
    const key = `LM_${material.userData.lightmapAtlas}_${state}` as LightmapKey;
    lit.lightMap = textures[key];
    // Blender bakes the light a surface receives (shade = albedo × bake); three.js
    // treats lightMap as irradiance and divides it by π (Lambert).
    lit.lightMapIntensity =
      LIGHTMAP_SCALES[key] * EXPOSURE[state] * weight * Math.PI;
  }
}

export interface RoomLightingProps {
  lighting: Lighting;
  scene: Object3D;
  animations: AnimationClip[];
}

export function lightingFrame(lighting: Lighting, progress: number) {
  const value = Math.max(0, Math.min(1, progress));
  const firstHalf = Math.min(value * 2, 1);
  const secondHalf = Math.max((value - 0.5) * 2, 0);

  return lighting === "night"
    ? {
        lamp: LAMP_LIGHT * secondHalf,
        curtainProgress: value,
        dayMap: 1 - firstHalf,
        nightMap: secondHalf,
        windowView: Math.max(1 - firstHalf, WINDOW_VIEW_NIGHT),
      }
    : {
        lamp: LAMP_LIGHT * (1 - firstHalf),
        curtainProgress: 1 - value,
        dayMap: secondHalf,
        nightMap: 1 - firstHalf,
        windowView: Math.max(secondHalf, WINDOW_VIEW_NIGHT),
      };
}

export function RoomLighting({
  lighting,
  scene,
  animations,
}: RoomLightingProps) {
  const lamp = useRef<PointLight>(null);
  const anisotropy = useThree(({ gl }) => gl.capabilities.getMaxAnisotropy());
  const progress = useRef(1);
  const previousLighting = useRef(lighting);
  const loaded = useLoader(TextureLoader, LIGHTMAP_URLS as string[]);
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
  const windowView = useMemo(() => {
    const mesh = scene.getObjectByName("EMIT_WindowView");
    const material = mesh instanceof Mesh ? mesh.material : undefined;
    return material instanceof MeshStandardMaterial
      ? { material, base: material.emissiveIntensity }
      : undefined;
  }, [scene]);
  const curtainActions = useMemo(() => {
    const mixer = new AnimationMixer(scene);
    const actions = animations
      .filter(({ name }) => name.startsWith("Curtain_"))
      .map((clip) => ({
        action: mixer.clipAction(clip),
        duration: clip.duration,
      }));
    return { actions, mixer };
  }, [animations, scene]);

  useEffect(() => {
    if (previousLighting.current === lighting) return;
    previousLighting.current = lighting;
    progress.current = 0;
  }, [lighting]);

  // Arm the clips here, not in useMemo: StrictMode's dev remount runs the
  // cleanup once, and clips stopped there would never play again.
  useEffect(() => {
    for (const { action } of curtainActions.actions) {
      action.play();
      action.paused = true;
    }
    return () => {
      curtainActions.mixer.stopAllAction();
    };
  }, [curtainActions]);

  useLayoutEffect(() => {
    scene
      .getObjectByName("LIGHT_Lamp")
      ?.getWorldPosition(lamp.current!.position);
  }, [scene]);

  useFrame((_, deltaSeconds) => {
    // In-place and user-triggered, so it plays even under reduced motion.
    progress.current = Math.min(1, progress.current + deltaSeconds);
    const frame = lightingFrame(lighting, progress.current);
    if (lamp.current) lamp.current.intensity = frame.lamp;
    applyLightmaps(bakedMaterials, lightmaps, frame, environments);
    if (windowView) {
      windowView.material.emissiveIntensity =
        windowView.base * frame.windowView;
    }

    for (const { action, duration } of curtainActions.actions) {
      action.time = duration * frame.curtainProgress;
    }
    curtainActions.mixer.update(0);
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
