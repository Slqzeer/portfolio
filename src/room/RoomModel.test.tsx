import {
  BoxGeometry,
  BufferAttribute,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { describe, expect, it, vi } from "vitest";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import {
  createRoomInteractionHandlers,
  prepareRoomScene,
  showLocaleFlag,
} from "./RoomModel";

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

  for (const name of ["Flag_FR", "Flag_EN"]) {
    const flag = new Group();
    flag.name = name;
    scene.getObjectByName("CTL_Flag")!.add(flag);
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

  it("rejects an export missing a locale flag variant", () => {
    const scene = createScene();
    const flag = scene.getObjectByName("Flag_EN")!;
    flag.parent!.remove(flag);

    expect(() => prepareRoomScene(scene)).toThrow(
      "Missing required room node: Flag_EN",
    );
  });

  it("shows only the flag of the current language", () => {
    const scene = prepareRoomScene(createScene());
    const fr = scene.getObjectByName("Flag_FR")!;
    const en = scene.getObjectByName("Flag_EN")!;

    showLocaleFlag(scene, "fr");
    expect([fr.visible, en.visible]).toEqual([true, false]);

    showLocaleFlag(scene, "en");
    expect([fr.visible, en.visible]).toEqual([false, true]);
  });

  it("switches off Blender's lights but keeps them as anchors", () => {
    const source = createScene();
    const sun = new DirectionalLight("#ffffff", 683);
    sun.name = "LIGHT_Daylight_Sun";
    source.getObjectByName("CTL_Curtains")!.add(sun);

    const scene = prepareRoomScene(source);

    expect(scene.getObjectByName("LIGHT_Daylight_Sun")?.visible).toBe(false);
    expect(sun.visible).toBe(true);
  });

  it("tags baked meshes with their lightmap atlas, one material per atlas", () => {
    const source = createScene();
    const shared = new MeshStandardMaterial();
    const baked = (atlas: string) => {
      const geometry = new BoxGeometry();
      geometry.setAttribute(
        "uv1",
        new BufferAttribute(geometry.attributes.uv.array, 2),
      );
      const holder = new Group();
      holder.userData.lightmap_atlas = atlas;
      holder.add(new Mesh(geometry, shared));
      source.add(holder);
      return holder.children[0] as Mesh;
    };
    baked("shell").name = "Floor";
    baked("props").name = "Desk";
    const unbaked = new Mesh(new BoxGeometry(), shared);
    unbaked.name = "Screen";
    source.add(unbaked);

    const scene = prepareRoomScene(source);
    const floor = scene.getObjectByName("Floor") as Mesh;
    const desk = scene.getObjectByName("Desk") as Mesh;
    const screen = scene.getObjectByName("Screen") as Mesh;

    expect(
      (floor.material as MeshStandardMaterial).userData.lightmapAtlas,
    ).toBe("shell");
    expect((desk.material as MeshStandardMaterial).userData.lightmapAtlas).toBe(
      "props",
    );
    expect(floor.material).not.toBe(desk.material);
    expect(screen.material).toBe(shared);
    expect(shared.userData.lightmapAtlas).toBeUndefined();
  });
});
