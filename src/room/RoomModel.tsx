import { useCursor, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Object3D } from "three";
import type { Locale, RoomObjectId } from "../content/types";
import type { Lighting } from "../app/appState";
import { CameraRig } from "./CameraRig";
import { RoomIdle } from "./RoomIdle";
import { RoomHotspots } from "./RoomHotspots";
import { RoomLighting } from "./RoomLighting";
import { sceneManifest } from "./sceneManifest";
import { blenderMaterialClips } from "./blenderAnimations";
import { RoomProjectScreen } from "./RoomProjectScreen";
import { prepareRoomScene } from "./preparedRoom";

const ROOM_GLTF_URL = "/assets/room/portfolio-room.glb";
const idByNodeName = new Map(
  Object.values(sceneManifest).map(({ id, nodeName }) => [nodeName, id]),
);

interface RoomPointerEvent {
  object: Object3D;
  stopPropagation: () => void;
}

export interface RoomModelProps {
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onReady: () => void;
  locale: Locale;
  lighting: Lighting;
  ambientPaused?: boolean;
  reducedMotion?: boolean;
  pointerEnabled?: boolean;
  transitionId?: number;
  onArrive?: (transitionId: number) => void;
  interactionEnabled?: boolean;
  projectPreview?: string;
}

function roomObjectIdForNode(object: Object3D) {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const id = idByNodeName.get(node.name);
    if (id) return id;
  }
}

export function createRoomInteractionHandlers(
  onInteract: (id: RoomObjectId) => void,
  onHover: (hovered: RoomObjectId | null) => void,
) {
  return {
    onClick(event: RoomPointerEvent) {
      const id = roomObjectIdForNode(event.object);
      if (!id) return;
      event.stopPropagation();
      onInteract(id);
    },
    onPointerOver(event: RoomPointerEvent) {
      const id = roomObjectIdForNode(event.object);
      if (!id) return;
      event.stopPropagation();
      onHover(id);
    },
    onPointerOut(event: RoomPointerEvent) {
      if (!roomObjectIdForNode(event.object)) return;
      event.stopPropagation();
      onHover(null);
    },
  };
}

export function RoomModel({
  activeObject,
  onInteract,
  onReady,
  locale,
  lighting,
  ambientPaused = false,
  reducedMotion = false,
  pointerEnabled = true,
  transitionId,
  onArrive,
  interactionEnabled = true,
  projectPreview,
}: RoomModelProps) {
  const { animations, scene: source } = useGLTF(ROOM_GLTF_URL, "/draco/");
  const room = useMemo(() => prepareRoomScene(source), [source]);
  const { scene, anchors } = room;
  const clips = useMemo(
    () => [...animations, ...blenderMaterialClips(scene)],
    [animations, scene],
  );
  const [hovered, setHovered] = useState<RoomObjectId | null>(null);
  const ready = useRef(false);
  const handlers = useMemo(
    () => createRoomInteractionHandlers(onInteract, setHovered),
    [onInteract],
  );
  useCursor(!!hovered && interactionEnabled);

  useEffect(() => {
    setHovered(null);
  }, [activeObject, interactionEnabled]);

  useEffect(() => {
    room.setLocale(locale);
  }, [locale, room]);

  useLayoutEffect(() => {
    room.setTheme(lighting);
  }, [lighting, room]);

  useEffect(() => {
    scene.userData.activeRoomObject = activeObject;
  }, [activeObject, scene]);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    onReady();
  }, [onReady]);

  useEffect(() => () => room.dispose(), [room]);

  return (
    <>
      <primitive
        object={scene}
        {...handlers}
        onClick={interactionEnabled ? handlers.onClick : undefined}
        onPointerOver={interactionEnabled ? handlers.onPointerOver : undefined}
      />
      <CameraRig
        activeObject={activeObject}
        anchors={anchors}
        reducedMotion={reducedMotion}
        pointerEnabled={pointerEnabled}
        transitionId={transitionId}
        onArrive={onArrive}
      />
      {interactionEnabled && (
        <RoomHotspots
          scene={scene}
          locale={locale}
          onInteract={onInteract}
          onHover={setHovered}
          hoveredObject={hovered}
          showMarkers={!activeObject}
        />
      )}
      <RoomLighting
        lighting={lighting}
        room={room}
        animations={animations}
        reducedMotion={reducedMotion}
      />
      <RoomIdle
        scene={scene}
        animations={clips}
        lighting={lighting}
        paused={ambientPaused}
        reducedMotion={reducedMotion}
        activeObject={activeObject}
        hoveredObject={interactionEnabled ? hovered : null}
        focusReady={interactionEnabled}
      />
      <RoomProjectScreen
        scene={scene}
        src={activeObject === "monitor" ? projectPreview : undefined}
      />
    </>
  );
}
