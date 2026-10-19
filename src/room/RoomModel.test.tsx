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
  showDeviceTheme,
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
  it("selects the authored theme and updates masks without hiding notification children", () => {
    const source = createScene();
    const day = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    day.name = "Editor_monitor_day";
    day.userData = { screen_theme: "day", device_surface: true };
    const night = day.clone();
    night.name = "Editor_monitor_night";
    night.userData.screen_theme = "night";
    source.add(day, night);
    const phone = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    phone.name = "PhoneBase";
    phone.userData.device_hidden_base = true;
    phone.add(new Object3D());
    source.add(phone);
    const mask = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    mask.name = "Mask";
    mask.userData.device_surface = true;
    mask.material.userData.screen_palette = JSON.stringify({
      day: [0.8, 0.7, 0.6],
      night: [0.1, 0.2, 0.3],
    });
    source.add(mask);
    const scene = prepareRoomScene(source);
    showDeviceTheme(scene, "night");
    expect(scene.getObjectByName(day.name)!.visible).toBe(false);
    expect(scene.getObjectByName(night.name)!.visible).toBe(true);
    const material = (scene.getObjectByName(mask.name) as Mesh)
      .material as MeshStandardMaterial;
    expect(material.emissive.toArray()).toEqual([0.1, 0.2, 0.3]);
    expect(material.toneMapped).toBe(false);
    expect(material.userData.lightmapAtlas).toBeUndefined();
    const base = scene.getObjectByName(phone.name) as Mesh;
    expect(base.visible && base.children[0].visible).toBe(true);
    expect((base.material as MeshStandardMaterial).visible).toBe(false);
    showDeviceTheme(scene, "day");
    expect(scene.getObjectByName(day.name)!.visible).toBe(true);
    expect(scene.getObjectByName(night.name)!.visible).toBe(false);
    expect(material.emissive.toArray()).toEqual([0.8, 0.7, 0.6]);
    expect(day.material.toneMapped).toBe(true);
  });
  it("keeps directional environment shading on the animated blind slats", () => {
    const source = createScene();
    const slat = new Mesh(
      new BoxGeometry(4, 0.008, 0.08),
      new MeshStandardMaterial(),
    );
    slat.name = "Blind_Slat_01";
    source.getObjectByName("CTL_Curtains")!.add(slat);
    const scene = prepareRoomScene(source);
    const material = (scene.getObjectByName(slat.name) as Mesh)
      .material as MeshStandardMaterial;
    expect(material.userData.lightmapAtlas).toBe("blind");
    const shader = {
      fragmentShader: "#include <lights_fragment_maps>",
      uniforms: {},
    } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
    material.onBeforeCompile(
      shader,
      {} as Parameters<MeshStandardMaterial["onBeforeCompile"]>[1],
    );
    expect(shader.fragmentShader).toContain("#include <lights_fragment_maps>");
  });
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

  it("reports object hover without repainting the Blender materials", () => {
    const source = createScene();
    const sourceMonitor = source.getObjectByName("MonitorSurface") as Mesh;
    const sourceDecoration = source.getObjectByName("DeskDecoration") as Mesh;
    const scene = prepareRoomScene(source);
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

  it("rejects an export missing a locale flag variant", () => {
    const scene = createScene();
    const flag = scene.getObjectByName("Flag_EN")!;
    flag.parent!.remove(flag);

    expect(() => prepareRoomScene(scene)).toThrow(
      "Missing required room node: Flag_EN",
    );
  });

  it("shows only the flag of the current language", () => {
    const source = createScene();
    source.getObjectByName("Flag_EN")!.position.set(-0.4, -1.2, 1.4);
    const scene = prepareRoomScene(source);
    const fr = scene.getObjectByName("Flag_FR")!;
    const en = scene.getObjectByName("Flag_EN")!;

    showLocaleFlag(scene, "fr");
    expect([fr.visible, en.visible]).toEqual([true, false]);

    showLocaleFlag(scene, "en");
    expect([fr.visible, en.visible]).toEqual([false, true]);
    expect(en.position.toArray()).toEqual(fr.position.toArray());
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

  it("tags meshes with their lightmap atlas (flat when unbaked), one material per atlas", () => {
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
    expect(
      (screen.material as MeshStandardMaterial).userData.lightmapAtlas,
    ).toBe("flat");
    expect(shared.userData.lightmapAtlas).toBeUndefined();
  });
});
