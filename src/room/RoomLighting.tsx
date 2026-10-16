import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AmbientLight,
  AnimationClip,
  AnimationMixer,
  DirectionalLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  SpotLight,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import type { Lighting } from "../app/appState";

// Baked lightmaps carry the direct light; these only light unbaked meshes.
const DAYLIGHT = 0.6;
const WINDOW_LIGHT = 0.5;
const LAMP_LIGHT = 6;
// Mirrors MAT_WindowView: the garden glow drops to 0.05 / 2 before the blind closes.
const WINDOW_VIEW_NIGHT = 0.025;

// Mirrors public/assets/room/lightmaps/scales.json (written by encode-room-lightmaps.py).
export const LIGHTMAP_SCALES = {
  LM_props_day: 16.38911,
  LM_props_night: 1.35276,
  LM_shell_day: 7.25617,
  LM_shell_night: 2.28157,
} as const;
type LightmapKey = keyof typeof LIGHTMAP_SCALES;
const LIGHTMAP_KEYS = Object.keys(LIGHTMAP_SCALES) as LightmapKey[];
const LIGHTMAP_URLS = LIGHTMAP_KEYS.map(
  (key) => `/assets/room/lightmaps/${key}.webp`,
);

export function applyLightmaps(
  materials: Material[],
  textures: Record<LightmapKey, Texture>,
  { dayMap, nightMap }: { dayMap: number; nightMap: number },
) {
  const [state, weight] = dayMap > 0 ? ["day", dayMap] : ["night", nightMap];
  for (const material of materials) {
    const key = `LM_${material.userData.lightmapAtlas}_${state}` as LightmapKey;
    const lit = material as MeshStandardMaterial;
    if (!lit.lightMap) lit.needsUpdate = true;
    lit.lightMap = textures[key];
    lit.lightMapIntensity = LIGHTMAP_SCALES[key] * weight;
  }
}

export interface RoomLightingProps {
  lighting: Lighting;
  scene: Object3D;
  animations: AnimationClip[];
  reducedMotion: boolean;
}

export function lightingFrame(lighting: Lighting, progress: number) {
  const value = Math.max(0, Math.min(1, progress));
  const firstHalf = Math.min(value * 2, 1);
  const secondHalf = Math.max((value - 0.5) * 2, 0);

  return lighting === "night"
    ? {
        daylight: DAYLIGHT * (1 - firstHalf),
        window: WINDOW_LIGHT * (1 - firstHalf),
        lamp: LAMP_LIGHT * secondHalf,
        fill: 0.25 + 0.75 * (1 - value),
        curtainProgress: value,
        dayMap: 1 - firstHalf,
        nightMap: secondHalf,
        windowView: Math.max(1 - firstHalf, WINDOW_VIEW_NIGHT),
      }
    : {
        daylight: DAYLIGHT * secondHalf,
        window: WINDOW_LIGHT * secondHalf,
        lamp: LAMP_LIGHT * (1 - firstHalf),
        fill: 0.25 + 0.75 * value,
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
  reducedMotion,
}: RoomLightingProps) {
  const daylight = useRef<DirectionalLight>(null);
  const windowLight = useRef<SpotLight>(null);
  const lamp = useRef<PointLight>(null);
  const fill = useRef<AmbientLight>(null);
  const progress = useRef(1);
  const previousLighting = useRef(lighting);
  const loaded = useLoader(TextureLoader, LIGHTMAP_URLS);
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
    for (const [light, name] of [
      [daylight.current, "LIGHT_Daylight"],
      [windowLight.current, "LIGHT_Window"],
      [lamp.current, "LIGHT_Lamp"],
    ] as const) {
      const anchor = scene.getObjectByName(name);
      if (!light || !anchor) continue;
      anchor.getWorldPosition(light.position);
      anchor.getWorldQuaternion(light.quaternion);
    }
  }, [scene]);

  useFrame((_, deltaSeconds) => {
    progress.current = reducedMotion
      ? 1
      : Math.min(1, progress.current + deltaSeconds);
    const frame = lightingFrame(lighting, progress.current);
    if (daylight.current) daylight.current.intensity = frame.daylight;
    if (windowLight.current) windowLight.current.intensity = frame.window;
    if (lamp.current) lamp.current.intensity = frame.lamp;
    if (fill.current) fill.current.intensity = frame.fill;
    applyLightmaps(bakedMaterials, lightmaps, frame);
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
      <directionalLight ref={daylight} color="#dceeff" intensity={0} />
      <spotLight
        ref={windowLight}
        color="#b9ddff"
        angle={Math.PI / 3}
        penumbra={0.7}
        intensity={0}
      />
      <pointLight
        ref={lamp}
        color="#e98cff"
        distance={7}
        decay={2}
        intensity={0}
      />
      <ambientLight ref={fill} color="#c8d4e6" intensity={0} />
    </>
  );
}
