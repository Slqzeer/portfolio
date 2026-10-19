import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  Object3D,
} from "three";
import type { RoomObjectId } from "../content/types";
import type { Lighting } from "../app/appState";

export interface RoomIdleProps {
  scene: Object3D;
  animations: AnimationClip[];
  paused: boolean;
  reducedMotion: boolean;
  activeObject?: RoomObjectId | null;
  hoveredObject?: RoomObjectId | null;
  lighting?: Lighting;
}

// Shapes, amplitudes and timing come exclusively from the Blender clips.
export function RoomIdle({
  scene,
  animations,
  paused,
  reducedMotion,
  activeObject,
  hoveredObject,
  lighting = "day",
}: RoomIdleProps) {
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const resumed = useRef(true);
  const editorActions = useRef<AnimationAction[]>([]);

  useEffect(() => {
    if (paused || reducedMotion) resumed.current = true;
  }, [paused, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const actions = animations
      .filter(
        ({ name }) =>
          name.startsWith("Ambient_") &&
          !name.startsWith("Ambient_Editor_") &&
          !name.startsWith("Ambient_Exterior_") &&
          !name.startsWith("Ambient_Blind_"),
      )
      .map((clip) => mixer.clipAction(clip).reset().play());
    return () => {
      actions.forEach((action) => action.stop());
    };
  }, [animations, mixer, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || lighting !== "day") return;
    const actions = animations
      .filter(
        ({ name }) =>
          name.startsWith("Ambient_Exterior_") ||
          name.startsWith("Ambient_Blind_"),
      )
      .map((clip) => mixer.clipAction(clip).reset().play());
    return () => {
      actions.forEach((action) => action.stop());
    };
  }, [animations, mixer, reducedMotion, lighting]);

  useEffect(() => {
    if (reducedMotion) return;
    editorActions.current = animations
      .filter(({ name }) => name.startsWith("Ambient_Editor_"))
      .map((clip) => mixer.clipAction(clip).reset().play());
    return () => {
      editorActions.current.forEach((action) => action.stop());
      editorActions.current = [];
    };
  }, [animations, mixer, reducedMotion]);

  useEffect(() => {
    const focused = activeObject === "monitor";
    editorActions.current.forEach((action) => {
      action.paused = focused;
    });
    // Reveal the complete authored code while reading; retain the clip time for resume.
    scene.traverse((object) => {
      if (object.userData.screen_mask)
        object.visible = !focused && !reducedMotion;
    });
  }, [activeObject, reducedMotion, animations, scene]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    },
    [mixer, scene],
  );

  useEffect(() => {
    if (reducedMotion || !hoveredObject) return;
    const clip = animations.find(
      ({ name }) => name === `Hover_${hoveredObject}`,
    );
    if (!clip) return;
    const action = mixer.clipAction(clip).reset().setLoop(LoopOnce, 1).play();
    return () => {
      action.stop();
    };
  }, [animations, mixer, hoveredObject, reducedMotion]);

  useFrame((_, delta) => {
    if (paused || reducedMotion) return;
    mixer.update(Math.min(delta, resumed.current ? 0.1 : 1));
    resumed.current = false;
  });
  return null;
}
