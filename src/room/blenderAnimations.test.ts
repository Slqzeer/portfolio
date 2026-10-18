import { AnimationMixer, Group, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { blenderMaterialClips } from "./blenderAnimations";

describe("Blender emission curves", () => {
  it("plays the exported curve on a cloned material and restores it on stop", () => {
    const scene = new Group();
    const material = new MeshStandardMaterial({ emissiveIntensity: 2 });
    const led = new Mesh(undefined, material);
    led.name = "Rack_LED";
    led.userData.blender_emission = JSON.stringify({
      group: "rack",
      fps: 24,
      base: 4,
      end: 25,
      keys: [
        [1, 4],
        [13, 8],
        [25, 4],
      ],
    });
    scene.add(led);
    const clips = blenderMaterialClips(scene);
    expect(clips).toHaveLength(1);
    const mixer = new AnimationMixer(scene);
    mixer.clipAction(clips[0]).play();
    mixer.update(0.5);
    expect(material.emissiveIntensity).toBeCloseTo(4);
    mixer.stopAllAction();
    expect(material.emissiveIntensity).toBe(2);
  });

  it("rejects malformed shader curves instead of producing NaN brightness", () => {
    const scene = new Group();
    const led = new Mesh(undefined, new MeshStandardMaterial());
    led.userData.blender_emission = JSON.stringify({
      group: "rack",
      fps: 24,
      base: 0,
      end: 25,
      keys: [[1, 4]],
    });
    scene.add(led);
    expect(() => blenderMaterialClips(scene)).toThrow(
      "Invalid Blender emission curve",
    );
  });
});
