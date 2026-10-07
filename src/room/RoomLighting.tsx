import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AmbientLight,
  AnimationClip,
  AnimationMixer,
  DirectionalLight,
  Object3D,
  PointLight,
  SpotLight,
} from "three";
import type { Lighting } from "../app/appState";

const DAYLIGHT = 2.4;
const WINDOW_LIGHT = 4;
const LAMP_LIGHT = 80;

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
        fill: 0.14 + 0.36 * (1 - value),
        curtainProgress: value,
      }
    : {
        daylight: DAYLIGHT * secondHalf,
        window: WINDOW_LIGHT * secondHalf,
        lamp: LAMP_LIGHT * (1 - firstHalf),
        fill: 0.14 + 0.36 * value,
        curtainProgress: 1 - value,
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
        color="#ffb56b"
        distance={7}
        decay={2}
        intensity={0}
      />
      <ambientLight ref={fill} color="#8498b8" intensity={0} />
    </>
  );
}
