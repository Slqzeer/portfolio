import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AmbientLight,
  AnimationClip,
  AnimationMixer,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import type { Lighting } from "../app/appState";

// Day is flat and shadowless: one white ambient shows every material's own colour.
const DAY_AMBIENT = 3;
const NIGHT_AMBIENT = 0.25;
const LAMP_LIGHT = 6;
// Mirrors MAT_WindowView: the garden glow drops to 0.05 / 2 before the blind closes.
const WINDOW_VIEW_NIGHT = 0.025;

// Mirrors public/assets/room/lightmaps/scales.json (written by encode-room-lightmaps.py).
export const LIGHTMAP_SCALES = {
  LM_props_day: 16.52232,
  LM_props_night: 1.35848,
  LM_shell_day: 7.25733,
  LM_shell_night: 2.28204,
} as const;
type LightmapKey = keyof typeof LIGHTMAP_SCALES;
// Only the night bake is used; day has no baked light or shadow.
const LIGHTMAP_KEYS = ["LM_props_night", "LM_shell_night"] as const;
const LIGHTMAP_URLS = LIGHTMAP_KEYS.map(
  (key) => `/assets/room/lightmaps/${key}.webp`,
);

export function applyLightmaps(
  materials: Material[],
  textures: Partial<Record<LightmapKey, Texture>>,
  nightMap: number,
) {
  for (const material of materials) {
    const key = `LM_${material.userData.lightmapAtlas}_night` as LightmapKey;
    const lit = material as MeshStandardMaterial;
    if (!lit.lightMap) lit.needsUpdate = true;
    lit.lightMap = textures[key] ?? null;
    lit.lightMapIntensity = LIGHTMAP_SCALES[key] * nightMap;
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
        day: DAY_AMBIENT * (1 - firstHalf),
        lamp: LAMP_LIGHT * secondHalf,
        curtainProgress: value,
        nightMap: secondHalf,
        windowView: Math.max(1 - firstHalf, WINDOW_VIEW_NIGHT),
      }
    : {
        day: DAY_AMBIENT * secondHalf,
        lamp: LAMP_LIGHT * (1 - firstHalf),
        curtainProgress: 1 - value,
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
  const day = useRef<AmbientLight>(null);
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
    ) as Partial<Record<LightmapKey, Texture>>;
  }, [loaded]);
  const bakedMaterials = useMemo(() => {
    const materials = new Set<Material>();
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      for (const material of [object.material].flat() as Material[]) {
        if (material.userData.lightmapAtlas) materials.add(material);
      }
    });
    return [...materials];
  }, [scene]);
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
      .map((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        action.paused = true;
        return { action, duration: clip.duration };
      });
    return { actions, mixer };
  }, [animations, scene]);

  useEffect(() => {
    if (previousLighting.current === lighting) return;
    previousLighting.current = lighting;
    progress.current = 0;
  }, [lighting]);

  useEffect(
    () => () => {
      curtainActions.mixer.stopAllAction();
    },
    [curtainActions],
  );

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
    if (day.current) day.current.intensity = frame.day;
    applyLightmaps(bakedMaterials, lightmaps, frame.nightMap);
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
      <ambientLight ref={day} color="#ffffff" intensity={0} />
      <ambientLight color="#c8d4e6" intensity={NIGHT_AMBIENT} />
    </>
  );
}
