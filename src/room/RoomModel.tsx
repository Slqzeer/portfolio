import { useCursor, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { Light, Material, Mesh, Object3D } from "three";
import type { Locale, RoomObjectId } from "../content/types";
import type { Lighting } from "../app/appState";
import { CameraRig } from "./CameraRig";
import { RoomIdle } from "./RoomIdle";
import { RoomLighting } from "./RoomLighting";
import { sceneManifest } from "./sceneManifest";

const ROOM_GLTF_URL = "/assets/room/portfolio-room.glb";
const idByNodeName = new Map(
  Object.values(sceneManifest).map(({ id, nodeName }) => [nodeName, id]),
);
const originalIntensity = new WeakMap<Material, number>();
const localeFlags: Record<Locale, string> = { fr: "Flag_FR", en: "Flag_EN" };

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
  for (const nodeName of [
    ...Object.values(sceneManifest).map(({ nodeName }) => nodeName),
    ...Object.values(localeFlags),
  ]) {
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
  prepareLighting(scene);
  return scene;
}

function lightmapAtlas(object: Object3D): string | undefined {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const atlas = node.userData.lightmap_atlas;
    if (typeof atlas === "string") return atlas;
  }
}

// Blender's lights stay as hidden anchors for RoomLighting, which recreates
// them; baked meshes get one material clone per lightmap atlas.
function prepareLighting(scene: Object3D) {
  scene.traverse((object) => {
    if (object instanceof Light) object.visible = false;
  });

  const baked = new Map<string, Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh) || !object.geometry.attributes.uv1) return;
    const atlas = lightmapAtlas(object);
    if (!atlas) return;
    const bake = (material: Material) => {
      const key = `${material.uuid}:${atlas}`;
      if (!baked.has(key)) {
        const clone = material.clone();
        clone.userData.lightmapAtlas = atlas;
        baked.set(key, clone);
      }
      return baked.get(key)!;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(bake)
      : bake(object.material);
  });
}

export function showLocaleFlag(scene: Object3D, locale: Locale) {
  for (const [flagLocale, nodeName] of Object.entries(localeFlags)) {
    scene.getObjectByName(nodeName)!.visible = flagLocale === locale;
  }
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
  locale,
  lighting,
  ambientPaused = false,
  reducedMotion = false,
  pointerEnabled = true,
}: RoomModelProps) {
  const { animations, scene: source } = useGLTF(ROOM_GLTF_URL, "/draco/");
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
    showLocaleFlag(scene, locale);
  }, [locale, scene]);

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
      <RoomLighting
        lighting={lighting}
        scene={scene}
        animations={animations}
        reducedMotion={reducedMotion}
      />
      <RoomIdle
        scene={scene}
        paused={ambientPaused}
        reducedMotion={reducedMotion}
      />
    </>
  );
}
