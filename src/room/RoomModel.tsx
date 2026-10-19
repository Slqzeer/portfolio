import { useCursor, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Light,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";
import type { Locale, RoomObjectId } from "../content/types";
import type { Lighting } from "../app/appState";
import { CameraRig } from "./CameraRig";
import { RoomIdle } from "./RoomIdle";
import { RoomHotspots } from "./RoomHotspots";
import { RoomLighting, withoutIblDiffuse } from "./RoomLighting";
import { sceneManifest } from "./sceneManifest";
import { blenderMaterialClips } from "./blenderAnimations";
import { RoomProjectScreen } from "./RoomProjectScreen";
import { clipGardenMaterial } from "./gardenPortal";

const ROOM_GLTF_URL = "/assets/room/portfolio-room.glb";
const idByNodeName = new Map(
  Object.values(sceneManifest).map(({ id, nodeName }) => [nodeName, id]),
);
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
  // The GLB exports Flag_EN with a stray transform; both canvases share bounds.
  const [fr, en] = Object.values(localeFlags).map((name) =>
    scene.getObjectByName(name)!,
  );
  en.position.copy(fr.position);
  en.quaternion.copy(fr.quaternion);
  en.scale.copy(fr.scale);
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
    // glTF puts multi-material mesh extras on the parent of its primitives.
    if (object.parent?.userData.exterior_surface)
      object.userData.exterior_surface = true;
    if (object instanceof Light) object.visible = false;
  });

  const baked = new Map<string, Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    // Slats and modeled scenery need normal-dependent shading to retain depth.
    const atlas =
      object.userData.exterior_surface && object.name !== "EMIT_WindowView"
        ? "exterior"
        : object.name.startsWith("Blind_Slat_")
          ? "blind"
          : (object.geometry.attributes.uv1 && lightmapAtlas(object)) || "flat";
    const bake = (material: Material) => {
      const key = `${material.uuid}:${atlas}`;
      if (!baked.has(key)) {
        const clone = material.clone();
        // Hide just the old phone display, keeping its notification children visible.
        if (object.userData.device_hidden_base) clone.visible = false;
        if (object.userData.device_surface) {
          // These are emissive displays authored in Blender, with exact site colours.
          clone.toneMapped = false;
        } else {
          clone.userData.lightmapAtlas = atlas;
        }
        // three.js lays sheen over the flat lightmap irradiance as a grey veil,
        // turning the navy sofa and rug slate; the bake already shades them.
        if (clone instanceof MeshPhysicalMaterial) clone.sheen = 0;
        if (
          atlas !== "blind" &&
          atlas !== "exterior" &&
          !object.userData.device_surface
        )
          withoutIblDiffuse(clone);
        if (object.userData.exterior_surface) clipGardenMaterial(clone);
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

export function showDeviceTheme(scene: Object3D, lighting: Lighting) {
  scene.traverse((object) => {
    if (object.userData.screen_theme) {
      object.visible = object.userData.screen_theme === lighting;
    }
    if (!(object instanceof Mesh)) return;
    for (const material of [object.material].flat()) {
      if (
        !(material instanceof MeshStandardMaterial) ||
        !material.userData.screen_palette
      )
        continue;
      const palette = JSON.parse(material.userData.screen_palette) as Record<
        Lighting,
        [number, number, number]
      >;
      material.emissive.setRGB(...palette[lighting]);
    }
  });
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
  const scene = useMemo(() => prepareRoomScene(source), [source]);
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

  useCursor(!!hovered && interactionEnabled);

  useEffect(() => {
    setHovered(null);
  }, [activeObject, interactionEnabled]);

  useEffect(() => {
    showLocaleFlag(scene, locale);
  }, [locale, scene]);

  useLayoutEffect(() => {
    showDeviceTheme(scene, lighting);
  }, [lighting, scene]);

  useEffect(() => {
    scene.userData.activeRoomObject = activeObject;
  }, [activeObject, scene]);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    onReady();
  }, [onReady]);

  useEffect(
    () => () => {
      const materials = new Set<Material>();
      scene.traverse((object) => {
        if (object instanceof Mesh)
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
      });
      materials.forEach((material) => material.dispose());
    },
    [scene],
  );

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
        scene={scene}
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
