import { Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it, vi } from "vitest";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import { createRoomInteractionHandlers } from "./RoomModel";
import { prepareRoomScene } from "./preparedRoom";
import { createRoomScene as createScene } from "../test/createRoomScene";
describe("RoomModel interactions", () => {
  it("routes every manifest node and ignores decoration", () => {
    const scene = prepareRoomScene(createScene()).scene;
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

  it("reports object hover without repainting the Blender materials", () => {
    const source = createScene();
    const sourceMonitor = source.getObjectByName("MonitorSurface") as Mesh;
    const sourceDecoration = source.getObjectByName("DeskDecoration") as Mesh;
    const room = prepareRoomScene(source);
    const scene = room.scene;
    const monitor = scene.getObjectByName("MonitorSurface") as Mesh;
    const decoration = scene.getObjectByName("DeskDecoration") as Mesh;
    const onHover = vi.fn();
    const handlers = createRoomInteractionHandlers(vi.fn(), onHover);
    const monitorMaterial = monitor.material as MeshStandardMaterial;
    const originalIntensity = monitorMaterial.emissiveIntensity;

    expect(monitor.material).not.toBe(sourceMonitor.material);
    expect(
      (sourceDecoration.material as MeshStandardMaterial).emissiveIntensity,
    ).toBe(1);

    handlers.onPointerOver({ object: monitor, stopPropagation: vi.fn() });

    expect(onHover).toHaveBeenLastCalledWith("monitor");
    expect(monitorMaterial.emissiveIntensity).toBe(originalIntensity);
    expect(
      (decoration.material as MeshStandardMaterial).emissiveIntensity,
    ).toBe(1);

    handlers.onPointerOut({ object: monitor, stopPropagation: vi.fn() });
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(monitorMaterial.emissiveIntensity).toBe(originalIntensity);
  });
});
