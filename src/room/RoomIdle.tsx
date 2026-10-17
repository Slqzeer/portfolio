import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AnimationClip, AnimationMixer, LoopOnce, Object3D } from "three";
import type { RoomObjectId } from "../content/types";

export interface RoomIdleProps {
  scene: Object3D;
  animations: AnimationClip[];
  paused: boolean;
  reducedMotion: boolean;
  activeObject?: RoomObjectId | null;
  hoveredObject?: RoomObjectId | null;
}

// Shapes, amplitudes and timing come exclusively from the Blender clips.
export function RoomIdle({
  scene,
  animations,
  paused,
  reducedMotion,
  activeObject,
  hoveredObject,
}: RoomIdleProps) {
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);

  useEffect(() => () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(scene);
  }, [mixer, scene]);

  useEffect(() => {
    if (reducedMotion || activeObject === "monitor") return;
    const clip = animations.find(({ name }) => name === "IDLE_Monitor_CursorAction");
    if (!clip) return;
    const action = mixer.clipAction(clip).reset().play();
    return () => { action.stop(); };
  }, [animations, mixer, reducedMotion, activeObject]);

  useEffect(() => {
    if (reducedMotion || !hoveredObject) return;
    const clip = animations.find(({ name }) => name === `Hover_${hoveredObject}`);
    if (!clip) return;
    const action = mixer.clipAction(clip).reset().setLoop(LoopOnce, 1).play();
    return () => { action.stop(); };
  }, [animations, mixer, hoveredObject, reducedMotion]);

  useFrame((_, delta) => {
    if (paused || reducedMotion) return;
    mixer.update(Math.min(delta, 0.1));
  });
  return null;
}
