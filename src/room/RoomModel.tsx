import { useCursor, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { Material, Mesh, Object3D } from "three";
import type { RoomObjectId } from "../content/types";
import { CameraRig } from "./CameraRig";
import { sceneManifest } from "./sceneManifest";

const ROOM_GLTF_URL = "/assets/room/portfolio-room.glb";
const idByNodeName = new Map(
  Object.values(sceneManifest).map(({ id, nodeName }) => [nodeName, id]),
);
const originalIntensity = new WeakMap<Material, number>();

interface RoomPointerEvent {
  object: Object3D;
  stopPropagation: () => void;
}

export interface RoomModelProps {
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onReady: () => void;
  reducedMotion?: boolean;
  pointerEnabled?: boolean;
}

function roomObjectIdForNode(object: Object3D) {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const id = idByNodeName.get(node.name);
    if (id) return id;
  }
}

function setHighlighted(object: Object3D, highlighted: boolean) {
  if (!(object instanceof Mesh)) return;
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];

  for (const material of materials) {
    if (!("emissiveIntensity" in material)) continue;
    const emissive = material as Material & { emissiveIntensity: number };
    if (!originalIntensity.has(material)) {
      originalIntensity.set(material, emissive.emissiveIntensity);
    }
    const base = originalIntensity.get(material)!;
    emissive.emissiveIntensity = highlighted ? base + 0.35 : base;
  }
}

export function prepareRoomScene(source: Object3D) {
  for (const { nodeName } of Object.values(sceneManifest)) {
    if (!source.getObjectByName(nodeName)) {
      throw new Error(`Missing required room node: ${nodeName}`);
    }
  }

  const scene = source.clone(true);
  for (const { nodeName } of Object.values(sceneManifest)) {
    scene.getObjectByName(nodeName)!.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    });
  }
  return scene;
}

export function createRoomInteractionHandlers(
  onInteract: (id: RoomObjectId) => void,
  onHover: (hovered: boolean) => void,
) {
  return {
    onClick(event: RoomPointerEvent) {
      const id = roomObjectIdForNode(event.object);
      if (!id) return;
      event.stopPropagation();
      onInteract(id);
    },
    onPointerOver(event: RoomPointerEvent) {
      if (!roomObjectIdForNode(event.object)) return;
      event.stopPropagation();
      setHighlighted(event.object, true);
      onHover(true);
    },
    onPointerOut(event: RoomPointerEvent) {
      if (!roomObjectIdForNode(event.object)) return;
      event.stopPropagation();
      setHighlighted(event.object, false);
      onHover(false);
    },
  };
}

export function RoomModel({
  activeObject,
  onInteract,
  onReady,
  reducedMotion = false,
  pointerEnabled = true,
}: RoomModelProps) {
  const { scene: source } = useGLTF(ROOM_GLTF_URL, false);
  const scene = useMemo(() => prepareRoomScene(source), [source]);
  const [hovered, setHovered] = useState(false);
  const ready = useRef(false);
  const handlers = useMemo(
    () => createRoomInteractionHandlers(onInteract, setHovered),
    [onInteract],
  );
  const anchors = useMemo(() => {
    const names = [
      "CAM_Overview",
      ...Object.values(sceneManifest).flatMap(({ cameraAnchorName }) =>
        cameraAnchorName ? [cameraAnchorName] : [],
      ),
    ];
    return Object.fromEntries(
      names.map((name) => {
        const anchor = scene.getObjectByName(name);
        if (!anchor) throw new Error(`Missing camera anchor: ${name}`);
        return [name, anchor];
      }),
    );
  }, [scene]);

  useCursor(hovered);

  useEffect(() => {
    scene.userData.activeRoomObject = activeObject;
  }, [activeObject, scene]);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    onReady();
  }, [onReady]);

  return (
    <>
      <primitive object={scene} {...handlers} />
      <CameraRig
        activeObject={activeObject}
        anchors={anchors}
        reducedMotion={reducedMotion}
        pointerEnabled={pointerEnabled}
      />
    </>
  );
}
