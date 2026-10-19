import { Material, MeshStandardMaterial, type WebGLRenderer } from "three";
import { describe, expect, it } from "vitest";
import { clipGardenMaterial, gardenSunlight } from "./gardenPortal";

describe("garden aperture", () => {
  it("composes with baked lighting and uses the renderer's current camera", () => {
    const material = new MeshStandardMaterial();
    material.onBeforeCompile = (shader) => {
      shader.uniforms.existingLightmap = { value: 2 };
    };
    const previousKey = material.customProgramCacheKey();
    clipGardenMaterial(material);
    const shader = {
      vertexShader: "#include <project_vertex>",
      fragmentShader: "#include <clipping_planes_fragment>",
      uniforms: {},
    } as Parameters<Material["onBeforeCompile"]>[0];
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.uniforms.existingLightmap.value).toBe(2);
    expect(shader.vertexShader).toContain("#include <project_vertex>");
    expect(shader.uniforms.gardenSunlight).toBe(gardenSunlight);
    expect(shader.fragmentShader).toContain("cameraPosition.z <= -5.14");
    expect(shader.fragmentShader).toContain("isOrthographic");
    expect(material.customProgramCacheKey()).not.toBe(previousKey);
  });
});
