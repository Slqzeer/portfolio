import {
  BoxGeometry,
  BufferAttribute,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderChunk,
  Texture,
} from "three";
import { describe, expect, it, vi } from "vitest";
import { prepareRoomScene, type LightmapKey } from "./preparedRoom";
import { createRoomScene as createScene } from "../test/createRoomScene";

describe("prepared room", () => {
  it("owns prepared materials through lighting, theme changes and cleanup without altering source assets", () => {
    const source = createScene();
    const shared = new MeshStandardMaterial({
      emissive: "white",
      emissiveIntensity: 0.5,
    });
    const sourceMap = new Texture();
    shared.map = sourceMap;
    const add = (name: string, atlas?: string) => {
      const geometry = new BoxGeometry();
      if (atlas) geometry.setAttribute("uv1", geometry.attributes.uv.clone());
      const mesh = new Mesh(geometry, shared);
      mesh.name = name;
      if (atlas) mesh.userData.lightmap_atlas = atlas;
      source.add(mesh);
      return mesh;
    };
    add("Shell", "shell");
    add("Props", "props");
    add("SharedProps", "props");
    add("Blind_Slat_01");
    add("Garden").userData.exterior_surface = true;
    const editor = add("Editor");
    editor.userData = { device_surface: true, screen_theme: "day" };
    source.userData.web_exposure_day = 0.8;
    const disposeSource = vi.spyOn(shared, "dispose");
    const disposeTexture = vi.spyOn(sourceMap, "dispose");
    const room = prepareRoomScene(source);
    const material = (name: string) =>
      (room.scene.getObjectByName(name) as Mesh)
        .material as MeshStandardMaterial;
    const shell = material("Shell"),
      props = material("Props"),
      slat = material("Blind_Slat_01"),
      garden = material("Garden");
    const owned = new Set<MeshStandardMaterial>();
    room.scene.traverse((object) => {
      if (object instanceof Mesh)
        for (const mat of [object.material].flat())
          owned.add(mat as MeshStandardMaterial);
    });
    const disposals = [...owned].map((mat) => vi.spyOn(mat, "dispose"));
    const textures = Object.fromEntries(
      ["LM_shell_day", "LM_shell_night", "LM_props_day", "LM_props_night"].map(
        (key) => [key, new Texture()],
      ),
    ) as Record<LightmapKey, Texture>;
    const scales = {
      LM_shell_day: 4,
      LM_shell_night: 5,
      LM_props_day: 2,
      LM_props_night: 3,
    };
    const environments = { day: new Texture(), night: new Texture() };
    room.configureLighting(Object.values(textures), 4);
    room.applyLighting(
      { dayMap: 1, nightMap: 0, windowView: 1 },
      textures,
      scales,
      environments,
    );
    expect(shell.lightMap).toBe(textures.LM_shell_day);
    expect(shell.lightMapIntensity).toBeCloseTo(4 * 0.8 * Math.PI);
    expect(props).toBe(material("SharedProps"));
    expect(slat.lightMapIntensity).toBe(0.8);
    expect(garden.envMap).toBe(environments.day);
    expect(garden.envMapIntensity).toBeCloseTo(1.6 * 0.8);
    expect(garden.lightMapIntensity).toBeCloseTo(0.15 * 0.8);
    expect(textures.LM_shell_day.anisotropy).toBe(4);
    expect(material("Editor").lightMap).toBeNull();
    room.setTheme("night");
    room.applyLighting(
      { dayMap: 0, nightMap: 1, windowView: 0.025 },
      textures,
      scales,
      environments,
    );
    expect(shell.lightMapIntensity).toBe(0);
    expect(slat.lightMapIntensity).toBe(0.1);
    expect(garden.emissiveIntensity).toBeCloseTo(0.0125);
    expect(garden.emissive.b).toBeGreaterThan(garden.emissive.r);
    expect(room.scene.getObjectByName("Editor")!.visible).toBe(false);
    const shader = {
      fragmentShader: "#include <lights_fragment_maps>",
      uniforms: {},
    } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
    props.onBeforeCompile(
      shader,
      {} as Parameters<MeshStandardMaterial["onBeforeCompile"]>[1],
    );
    expect(shader.uniforms.roomNightMap.value).toBe(textures.LM_props_night);
    expect(shader.uniforms.roomNightGain.value).toBeCloseTo(3 * Math.PI);
    expect(shader.fragmentShader).toContain("texture2D( roomNightMap");
    const iblDiffuse = "iblIrradiance += getIBLIrradiance( geometryNormal );";
    expect(ShaderChunk.lights_fragment_maps).toContain(iblDiffuse);
    expect(shader.fragmentShader).not.toContain(iblDiffuse);
    room.dispose();
    disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    expect(disposeSource).not.toHaveBeenCalled();
    expect(disposeTexture).not.toHaveBeenCalled();
    expect(shared.lightMap).toBeNull();
    expect(shared.emissiveIntensity).toBe(0.5);
    expect(editor.visible).toBe(true);
    expect(room.anchors.CAM_Overview).not.toBe(
      source.getObjectByName("CAM_Overview"),
    );
  });

  it("rejects missing camera anchors before creating materials", () => {
    const source = createScene();
    source.remove(source.getObjectByName("CAM_Overview")!);
    expect(() => prepareRoomScene(source)).toThrow(
      "Missing required room node: CAM_Overview",
    );
  });
  it("clips every primitive of an exported multi-material garden group", () => {
    const source = createScene();
    const crown = new Group();
    crown.name = "Exterior_Botanical_Crown_00";
    crown.userData.exterior_surface = true;
    const branch = new Group();
    const shared = new MeshStandardMaterial();
    const leaf = new Mesh(new BoxGeometry(), shared);
    leaf.name = "ExportedLeafPrimitive";
    branch.add(leaf);
    crown.add(branch);
    source.add(crown);
    const decoration = source.getObjectByName("DeskDecoration") as Mesh;
    decoration.material = shared;

    const room = prepareRoomScene(source);
    const scene = room.scene;
    const primitive = scene.getObjectByName(leaf.name) as Mesh;
    const material = primitive.material as MeshStandardMaterial;
    expect(primitive.userData.exterior_surface).toBe(true);
    expect(material.userData.lightmapAtlas).toBe("exterior");
    const shader = {
      vertexShader: "#include <project_vertex>",
      fragmentShader: "#include <clipping_planes_fragment>",
      uniforms: {},
    } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
    material.onBeforeCompile(
      shader,
      {} as Parameters<MeshStandardMaterial["onBeforeCompile"]>[1],
    );
    expect(shader.fragmentShader).toContain("gardenAperture");
    expect((scene.getObjectByName(decoration.name) as Mesh).material).not.toBe(
      material,
    );
    expect(
      scene.getObjectByName(decoration.name)!.userData.exterior_surface,
    ).toBeUndefined();
    expect(leaf.userData.exterior_surface).toBeUndefined();
  });
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
    const room = prepareRoomScene(source);
    const scene = room.scene;
    room.setTheme("night");
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
    room.setTheme("day");
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
    const room = prepareRoomScene(source);
    const scene = room.scene;
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

  it("rejects an export missing a required node", () => {
    const scene = createScene();
    scene.remove(scene.getObjectByName("CTL_Flag")!);

    expect(() => prepareRoomScene(scene)).toThrow(
      "Missing required room node: CTL_Flag",
    );
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
    const room = prepareRoomScene(source);
    const scene = room.scene;
    const fr = scene.getObjectByName("Flag_FR")!;
    const en = scene.getObjectByName("Flag_EN")!;

    room.setLocale("fr");
    expect([fr.visible, en.visible]).toEqual([true, false]);

    room.setLocale("en");
    expect([fr.visible, en.visible]).toEqual([false, true]);
    expect(en.position.toArray()).toEqual(fr.position.toArray());
  });

  it("switches off Blender's lights but keeps them as anchors", () => {
    const source = createScene();
    const sun = new DirectionalLight("#ffffff", 683);
    sun.name = "LIGHT_Daylight_Sun";
    source.getObjectByName("CTL_Curtains")!.add(sun);

    const room = prepareRoomScene(source);
    const scene = room.scene;

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

    const room = prepareRoomScene(source);
    const scene = room.scene;
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
