import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { describe, expect, it, vi } from "vitest";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import { createRoomInteractionHandlers, prepareRoomScene } from "./RoomModel";

function createScene() {
  const scene = new Group();

  for (const { nodeName } of Object.values(sceneManifest)) {
    const root = new Group();
    root.name = nodeName;
    scene.add(root);
  }

  for (const name of [
    "CAM_Overview",
    ...Object.values(sceneManifest).flatMap(({ cameraAnchorName }) =>
      cameraAnchorName ? [cameraAnchorName] : [],
    ),
  ]) {
    const cameraAnchor = new Object3D();
    cameraAnchor.name = name;
    scene.add(cameraAnchor);
  }

  const monitor = scene.getObjectByName("INT_Monitor") as Group;
  const monitorMesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  monitorMesh.name = "MonitorSurface";
  monitor.add(monitorMesh);

  const decoration = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  decoration.name = "DeskDecoration";
  scene.add(decoration);

  return scene;
}

describe("RoomModel bindings", () => {
  it("routes every manifest node and ignores decoration", () => {
    const scene = prepareRoomScene(createScene());
    const onInteract = vi.fn<(id: RoomObjectId) => void>();
    const handlers = createRoomInteractionHandlers(onInteract, vi.fn());

    for (const entry of Object.values(sceneManifest)) {
      const stopPropagation = vi.fn();
      handlers.onClick({
        object: scene.getObjectByName(entry.nodeName)!,
        stopPropagation,
      });
      expect(onInteract).toHaveBeenLastCalledWith(entry.id);
      expect(stopPropagation).toHaveBeenCalledOnce();
    }

    const callCount = onInteract.mock.calls.length;
    const stopPropagation = vi.fn();
    handlers.onClick({
      object: scene.getObjectByName("DeskDecoration")!,
      stopPropagation,
    });
    expect(onInteract).toHaveBeenCalledTimes(callCount);
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("rejects an export missing a required node", () => {
    const scene = createScene();
    scene.remove(scene.getObjectByName("CTL_Flag")!);

    expect(() => prepareRoomScene(scene)).toThrow(
      "Missing required room node: CTL_Flag",
    );
  });

  it("highlights only a cloned functional material", () => {
    const source = createScene();
    const sourceMonitor = source.getObjectByName("MonitorSurface") as Mesh;
    const sourceDecoration = source.getObjectByName("DeskDecoration") as Mesh;
    const scene = prepareRoomScene(source);
    const monitor = scene.getObjectByName("MonitorSurface") as Mesh;
    const decoration = scene.getObjectByName("DeskDecoration") as Mesh;
    const handlers = createRoomInteractionHandlers(vi.fn(), vi.fn());
    const monitorMaterial = monitor.material as MeshStandardMaterial;
    const originalIntensity = monitorMaterial.emissiveIntensity;

    expect(monitor.material).not.toBe(sourceMonitor.material);
    expect(decoration.material).toBe(sourceDecoration.material);

    handlers.onPointerOver({ object: monitor, stopPropagation: vi.fn() });

    expect(monitorMaterial.emissiveIntensity).toBeGreaterThan(
      originalIntensity,
    );
    expect(
      (decoration.material as MeshStandardMaterial).emissiveIntensity,
    ).toBe(1);

    handlers.onPointerOut({ object: monitor, stopPropagation: vi.fn() });
    expect(monitorMaterial.emissiveIntensity).toBe(originalIntensity);
  });
});
