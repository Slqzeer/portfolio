import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Euler, Object3D, Quaternion, Vector2, Vector3 } from "three";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import { clampPointer, frameLerpFactor, sceneMotion } from "./sceneMotion";

export interface CameraRigProps {
  activeObject: RoomObjectId | null;
  anchors: Record<string, Object3D>;
  reducedMotion: boolean;
  pointerEnabled: boolean;
}

export function CameraRig({
  activeObject,
  anchors,
  reducedMotion,
  pointerEnabled,
}: CameraRigProps) {
  const { camera, gl } = useThree((state) => ({
    camera: state.camera,
    gl: state.gl,
  }));
  const pointer = useRef(new Vector2());
  const scratch = useMemo(
    () => ({
      position: new Vector3(),
      quaternion: new Quaternion(),
      rotation: new Quaternion(),
      euler: new Euler(),
      right: new Vector3(),
      up: new Vector3(),
    }),
    [],
  );
  const overview = anchors.CAM_Overview;

  useLayoutEffect(() => {
    if (!overview) return;
    overview.getWorldPosition(camera.position);
    overview.getWorldQuaternion(camera.quaternion);
  }, [camera, overview]);

  useEffect(() => {
    const canvas = gl.domElement;
    const reset = () => pointer.current.set(0, 0);
    if (!pointerEnabled || reducedMotion) {
      reset();
      return;
    }

    const update = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.current.set(
        clampPointer(((event.clientX - bounds.left) / bounds.width) * 2 - 1),
        clampPointer(1 - ((event.clientY - bounds.top) / bounds.height) * 2),
      );
    };

    canvas.addEventListener("pointermove", update);
    canvas.addEventListener("pointerleave", reset);
    return () => {
      canvas.removeEventListener("pointermove", update);
      canvas.removeEventListener("pointerleave", reset);
    };
  }, [gl.domElement, pointerEnabled, reducedMotion]);

  useFrame((_, deltaSeconds) => {
    const anchorName = activeObject
      ? sceneManifest[activeObject].cameraAnchorName
      : undefined;
    const target = (anchorName && anchors[anchorName]) || overview;
    if (!target) return;

    target.getWorldPosition(scratch.position);
    target.getWorldQuaternion(scratch.quaternion);

    if (!anchorName && pointerEnabled && !reducedMotion) {
      scratch.right
        .set(1, 0, 0)
        .applyQuaternion(scratch.quaternion)
        .multiplyScalar(
          (pointer.current.x * sceneMotion.horizontalPixels) / 100,
        );
      scratch.up
        .set(0, 1, 0)
        .applyQuaternion(scratch.quaternion)
        .multiplyScalar((pointer.current.y * sceneMotion.verticalPixels) / 100);
      scratch.position.add(scratch.right).add(scratch.up);
      scratch.rotation.setFromEuler(
        scratch.euler.set(
          (pointer.current.y * sceneMotion.rotationDegrees * Math.PI) / 180,
          (-pointer.current.x * sceneMotion.rotationDegrees * Math.PI) / 180,
          0,
          "YXZ",
        ),
      );
      scratch.quaternion.multiply(scratch.rotation);
    }

    const factor = reducedMotion ? 1 : frameLerpFactor(deltaSeconds);
    camera.position.lerp(scratch.position, factor);
    camera.quaternion.slerp(scratch.quaternion, factor);
  });

  return null;
}
