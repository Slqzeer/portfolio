import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  FileLoader,
  EquirectangularReflectionMapping,
  Object3D,
  PointLight,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { gardenSunlight } from "./gardenPortal";
import type { Lighting } from "../app/appState";

import type { LightmapKey, PreparedRoom } from "./preparedRoom";

const LAMP_LIGHT = 6;
const WINDOW_VIEW_NIGHT = 0.025;

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
export interface RoomLightingProps {
  lighting: Lighting;
  room: PreparedRoom;
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
  room,
  animations,
  reducedMotion = false,
}: RoomLightingProps) {
  const { scene } = room;
  const lamp = useRef<PointLight>(null);
  const anisotropy = useThree(({ gl }) => gl.capabilities.getMaxAnisotropy());
  const nightMix = useRef(lighting === "night" ? 1 : 0);
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
  useLayoutEffect(() => {
    room.configureLighting(loaded, anisotropy);
  }, [room, loaded, anisotropy]);
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
    room.applyLighting(frame, lightmaps, scales, environments);

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
