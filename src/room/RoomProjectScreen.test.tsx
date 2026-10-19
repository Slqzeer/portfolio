import { render } from "@testing-library/react";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
  TextureLoader,
} from "three";
import { describe, expect, it, vi } from "vitest";
import { RoomProjectScreen } from "./RoomProjectScreen";

describe("RoomProjectScreen", () => {
  it("ignores a stale image load, updates both themes, and restores and disposes on exit", () => {
    const pending: Array<{
      texture: Texture<HTMLImageElement>;
      loaded: (texture: Texture<HTMLImageElement>) => void;
    }> = [];
    const load = vi
      .spyOn(TextureLoader.prototype, "load")
      .mockImplementation((_url, loaded) => {
        const texture = new Texture<HTMLImageElement>();
        vi.spyOn(texture, "dispose");
        pending.push({ texture, loaded: loaded! });
        return texture;
      });
    const scene = new Group();
    const original = new Texture();
    const materials = ["day", "night"].map((theme) => {
      const material = new MeshStandardMaterial({
        map: original,
        emissiveMap: original,
      });
      const mesh = new Mesh(undefined, material);
      mesh.name = `Editor_monitor_${theme}`;
      scene.add(mesh);
      return material;
    });
    const { rerender } = render(
      <RoomProjectScreen scene={scene} src="/one.png" />,
    );
    rerender(<RoomProjectScreen scene={scene} src="/two.png" />);
    pending[0].loaded(pending[0].texture);
    expect(materials[0].map).toBe(original);
    expect(pending[0].texture.dispose).toHaveBeenCalledOnce();
    pending[1].loaded(pending[1].texture);
    materials.forEach((material) => {
      expect(material.map).toBe(pending[1].texture);
      expect(material.emissiveMap).toBe(pending[1].texture);
    });
    rerender(<RoomProjectScreen scene={scene} />);
    materials.forEach((material) => expect(material.map).toBe(original));
    expect(pending[1].texture.dispose).toHaveBeenCalledOnce();
    load.mockRestore();
  });
});
