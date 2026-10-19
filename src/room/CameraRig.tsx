import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Camera,
  Euler,
  Object3D,
  OrthographicCamera,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import {
  cameraPath,
  cameraRoute,
  cameraTravel,
  HOME_CAMERA,
  overviewFrameScale,
  travelEase,
} from "./cameraPaths";
import {
  MOBILE_CAMERA_BREAKPOINT,
  clampPointer,
  frameLerpFactor,
  sceneMotion,
} from "./sceneMotion";

// Blender exports camera objects already aimed down -Z, but anchor empties
// keep Blender's camera axis, which arrives in glTF as local -Y.
const EMPTY_AIM = new Quaternion().setFromAxisAngle(
  new Vector3(1, 0, 0),
  -Math.PI / 2,
);

// Anchors store their frame width (`ortho_scale`, 16:9) as glTF extras.
export function frameZoom(orthoScale: number, width: number, height: number) {
  return Math.min(width / orthoScale, height / ((orthoScale * 9) / 16));
}

export interface CameraRigProps {
  activeObject: RoomObjectId | null;
  anchors: Record<string, Object3D>;
  reducedMotion: boolean;
  pointerEnabled: boolean;
  transitionId?: number;
  onArrive?: (transitionId: number) => void;
}

interface CameraPose {
  position: Vector3;
  quaternion: Quaternion;
  scale: number;
  overviewScale?: number;
}

function poseScale(pose: CameraPose, width: number, height: number) {
  return pose.overviewScale === undefined
    ? pose.scale
    : pose.overviewScale * overviewFrameScale(width, height);
}

interface CameraLeg {
  name: string;
  from: CameraPose;
  to: CameraPose;
  duration: number;
}

export function CameraRig({
  activeObject,
  anchors,
  reducedMotion,
  pointerEnabled,
  transitionId = 0,
  onArrive,
}: CameraRigProps) {
  const { camera, gl } = useThree((state) => ({
    camera: state.camera,
    gl: state.gl,
  }));
  const frame = useMemo(
    () =>
      gl.domElement
        .closest(".room-scene")
        ?.querySelector<HTMLElement>(".room-frame"),
    [gl.domElement],
  );
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
  const arrival = useRef(onArrive);
  const lastAnchor = useRef(HOME_CAMERA);
  const travel = useRef<{
    legs: CameraLeg[];
    index: number;
    elapsed: number;
    seconds: number;
    duration: number;
    animations: Animation[];
    id: number;
  } | null>(null);
  const destination = activeObject
    ? (sceneManifest[activeObject].cameraAnchorName ?? HOME_CAMERA)
    : HOME_CAMERA;

  useLayoutEffect(() => {
    arrival.current = onArrive;
  }, [onArrive]);

  useLayoutEffect(() => {
    if (!overview) return;
    overview.getWorldPosition(camera.position);
    overview.getWorldQuaternion(camera.quaternion);
    const orthoScale = overview.userData.ortho_scale;
    if (
      camera instanceof OrthographicCamera &&
      typeof orthoScale === "number"
    ) {
      const { width, height } = (
        frame ?? gl.domElement
      ).getBoundingClientRect();
      camera.zoom = frameZoom(
        orthoScale * overviewFrameScale(width, height),
        width,
        height,
      );
      camera.updateProjectionMatrix();
    }
  }, [camera, gl.domElement, overview, frame]);

  useLayoutEffect(() => {
    if (!overview) return;
    const { width, height } = (frame ?? gl.domElement).getBoundingClientRect();
    const readPose = (name: string): CameraPose => {
      const anchor = anchors[name] ?? overview;
      const quaternion = anchor.getWorldQuaternion(new Quaternion());
      if (!(anchor instanceof Camera)) quaternion.multiply(EMPTY_AIM);
      return {
        position: anchor.getWorldPosition(new Vector3()),
        quaternion,
        scale:
          typeof anchor.userData.ortho_scale === "number"
            ? anchor.userData.ortho_scale *
              (name === HOME_CAMERA ? overviewFrameScale(width, height) : 1)
            : 1,
        overviewScale:
          name === HOME_CAMERA &&
          typeof anchor.userData.ortho_scale === "number"
            ? anchor.userData.ortho_scale
            : undefined,
      };
    };
    let from: CameraPose = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      scale:
        camera instanceof OrthographicCamera && camera.zoom > 0
          ? frameZoom(1, width, height) / camera.zoom
          : 1,
    };
    const nextAnchor = travel.current?.legs[travel.current.index]?.name;
    // Continue the current edge if it belongs to the new path; otherwise retrace it.
    const first =
      nextAnchor && cameraPath(destination).includes(nextAnchor)
        ? nextAnchor
        : lastAnchor.current;
    const names = cameraRoute(first, destination).filter(
      (name) => anchors[name],
    );
    const legs: CameraLeg[] = [];
    for (const name of names) {
      const to = readPose(name);
      const distance = from.position.distanceTo(to.position);
      if (
        distance > 0.0001 ||
        from.quaternion.angleTo(to.quaternion) > 0.0001 ||
        Math.abs(from.scale - to.scale) > 0.0001
      ) {
        legs.push({
          name,
          from,
          to,
          // Budget for visible zoom and rotation as well as world-space travel.
          duration: Math.max(
            0.5,
            distance / Math.min(from.scale, to.scale),
            from.quaternion.angleTo(to.quaternion),
            Math.abs(Math.log(to.scale / from.scale)) * 2,
          ),
        });
      } else {
        lastAnchor.current = name;
      }
      from = to;
    }
    const weight = legs.reduce((sum, leg) => sum + leg.duration, 0);
    const duration =
      destination === HOME_CAMERA
        ? cameraTravel.returnSeconds
        : legs.length > 2
          ? cameraTravel.crossZoneSeconds
          : cameraTravel.focusSeconds;
    const minimum = Math.min(
      cameraTravel.minimumLegSeconds,
      duration / legs.length,
    );
    legs.forEach((leg) => {
      leg.duration =
        minimum + ((duration - minimum * legs.length) * leg.duration) / weight;
    });
    // CSS layout and the entire card share the rendered camera clock, even on
    // slow frames; independent compositor timelines would finish ahead of it.
    const animations = Array.from(
      gl.domElement
        .closest("main")
        ?.querySelectorAll<HTMLElement>(
          ".room-scene, .room-frame, .object-details",
        ) ?? [],
    ).flatMap((element) => element.getAnimations());
    if (legs.length) {
      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      });
    }
    travel.current = legs.length
      ? {
          legs,
          index: 0,
          elapsed: 0,
          seconds: 0,
          duration,
          animations,
          id: transitionId,
        }
      : null;
    pointer.current.set(0, 0);
    gl.domElement.dataset.cameraTarget = destination;
    gl.domElement.dataset.cameraMoving = legs.length ? "true" : "false";
    if (!legs.length) arrival.current?.(transitionId);
    return () =>
      animations.forEach((animation) => {
        if (animation.playState !== "finished") animation.play();
      });
  }, [
    activeObject,
    transitionId,
    anchors,
    camera,
    destination,
    gl.domElement,
    overview,
    frame,
  ]);

  useEffect(() => {
    const canvas = gl.domElement;
    const reset = () => {
      pointer.current.set(0, 0);
      canvas.dataset.pointerFollow = "0,0";
    };
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
      canvas.dataset.pointerFollow = `${pointer.current.x.toFixed(2)},${pointer.current.y.toFixed(2)}`;
    };

    canvas.addEventListener("pointermove", update);
    canvas.addEventListener("pointerleave", reset);
    return () => {
      canvas.removeEventListener("pointermove", update);
      canvas.removeEventListener("pointerleave", reset);
    };
  }, [gl.domElement, pointerEnabled, reducedMotion]);

  useFrame(({ size }, deltaSeconds) => {
    const { width, height } = frame?.getBoundingClientRect() ?? size;
    const updateProjection = () => {
      if (!(camera instanceof OrthographicCamera)) return;
      // Render behind the transparent panel, keeping focus in its clear area.
      camera.setViewOffset(
        size.width,
        size.height,
        (size.width - width) / 2,
        (size.height - height) / 2,
        size.width,
        size.height,
      );
    };
    const journey = travel.current;
    if (journey) {
      // Do not jump across waypoints after a stalled render or a tab resume.
      const step = Math.min(deltaSeconds, 0.05);
      journey.elapsed += step;
      journey.seconds += step;
      const progress = reducedMotion
        ? 1
        : Math.min(1, journey.seconds / journey.duration);
      journey.animations.forEach((animation) => {
        const timing = animation.effect?.getTiming();
        if (timing && typeof timing.duration === "number")
          animation.currentTime =
            progress * ((timing.delay ?? 0) + timing.duration);
      });
      let leg = journey.legs[journey.index];
      while (leg && (reducedMotion || journey.elapsed >= leg.duration)) {
        camera.position.copy(leg.to.position);
        camera.quaternion.copy(leg.to.quaternion);
        lastAnchor.current = leg.name;
        journey.elapsed -= leg.duration;
        journey.index++;
        leg = journey.legs[journey.index];
      }
      const pose = leg
        ? {
            position: scratch.position.lerpVectors(
              leg.from.position,
              leg.to.position,
              travelEase(journey.elapsed / leg.duration),
            ),
            quaternion: scratch.quaternion.slerpQuaternions(
              leg.from.quaternion,
              leg.to.quaternion,
              travelEase(journey.elapsed / leg.duration),
            ),
            scale:
              poseScale(leg.from, width, height) +
              (poseScale(leg.to, width, height) -
                poseScale(leg.from, width, height)) *
                travelEase(journey.elapsed / leg.duration),
          }
        : journey.legs[journey.legs.length - 1]?.to;
      if (pose) {
        camera.position.copy(pose.position);
        camera.quaternion.copy(pose.quaternion);
        if (camera instanceof OrthographicCamera) {
          // Fit the clear area while the full canvas stays visible.
          camera.zoom = frameZoom(
            poseScale(pose, width, height),
            width,
            height,
          );
          updateProjection();
        }
      }
      if (!leg) {
        travel.current = null;
        gl.domElement.dataset.cameraMoving = "false";
        journey.animations.forEach((animation) => animation.finish());
        arrival.current?.(journey.id);
      }
      return;
    }
    const anchorName = activeObject
      ? sceneManifest[activeObject].cameraAnchorName
      : undefined;
    const target = (anchorName && anchors[anchorName]) || overview;
    if (!target) return;

    target.getWorldPosition(scratch.position);
    target.getWorldQuaternion(scratch.quaternion);
    if (!(target instanceof Camera)) scratch.quaternion.multiply(EMPTY_AIM);

    if (
      !anchorName &&
      pointerEnabled &&
      !reducedMotion &&
      width > MOBILE_CAMERA_BREAKPOINT
    ) {
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
    const orthoScale = target.userData.ortho_scale;
    if (
      camera instanceof OrthographicCamera &&
      typeof orthoScale === "number"
    ) {
      const zoom = frameZoom(
        orthoScale *
          (target === overview ? overviewFrameScale(width, height) : 1),
        width,
        height,
      );
      camera.zoom += (zoom - camera.zoom) * factor;
      updateProjection();
    }
    camera.position.lerp(scratch.position, factor);
    camera.quaternion.slerp(scratch.quaternion, factor);
  });

  return null;
}
