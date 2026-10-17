import scalesJson from "../../public/assets/room/lightmaps/scales.json?raw";
import {
  MeshStandardMaterial,
  ShaderChunk,
  Texture,
  type Material,
  type WebGLRenderer,
} from "three";
import { describe, expect, it } from "vitest";
import {
  IBL_DIFFUSE,
  LIGHTMAP_SCALES,
  applyLightmaps,
  lightingFrame,
} from "./RoomLighting";

describe("RoomLighting", () => {
  it("finishes day baked-lit with open curtains and no lamp", () => {
    expect(lightingFrame("day", 1)).toMatchObject({
      curtainProgress: 0,
      lamp: 0,
      dayMap: 1,
      nightMap: 0,
    });
  });

  it("crossfades both baked ambiences without a blackout", () => {
    expect(lightingFrame("night", 0.49).lamp).toBeGreaterThan(0);
    expect(lightingFrame("night", 0.5)).toMatchObject({
      dayMap: 0.5,
      nightMap: 0.5,
    });
    expect(lightingFrame("night", 1)).toMatchObject({
      nightMap: 1,
      curtainProgress: 1,
    });
    expect(lightingFrame("night", 1).lamp).toBeGreaterThan(0);
  });

  it("darkens the garden behind the window before the blind closes", () => {
    expect(lightingFrame("day", 1).windowView).toBe(1);
    expect(lightingFrame("night", 0.5).windowView).toBeCloseTo(0.5);
    expect(lightingFrame("night", 1).windowView).toBeCloseTo(0.025);
  });

  it("uses the encoded lightmap scales", () => {
    expect(LIGHTMAP_SCALES).toEqual(JSON.parse(scalesJson));
  });

  it("applies the lit atlas lightmap with its scale", () => {
    const shell = new MeshStandardMaterial();
    shell.userData.lightmapAtlas = "shell";
    const props = new MeshStandardMaterial();
    props.userData.lightmapAtlas = "props";
    const textures = Object.fromEntries(
      Object.keys(LIGHTMAP_SCALES).map((key) => [key, new Texture()]),
    ) as Record<keyof typeof LIGHTMAP_SCALES, Texture>;

    applyLightmaps([shell, props], textures, { dayMap: 0.5, nightMap: 0 });
    expect(shell.lightMap).toBe(textures.LM_shell_day);
    // Day is brighter than the bake (EXPOSURE.day).
    expect(shell.lightMapIntensity).toBeGreaterThan(
      LIGHTMAP_SCALES.LM_shell_day * 0.5 * Math.PI,
    );

    applyLightmaps([shell, props], textures, { dayMap: 0, nightMap: 1 });
    expect(props.lightMap).toBe(textures.LM_props_day);
    expect(props.lightMapIntensity).toBe(0);
    const shader = {
      fragmentShader: "#include <lights_fragment_maps>",
      uniforms: {},
    } as Parameters<Material["onBeforeCompile"]>[0];
    props.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.uniforms.roomNightMap.value).toBe(textures.LM_props_night);
    expect(shader.uniforms.roomNightGain.value).toBeCloseTo(
      LIGHTMAP_SCALES.LM_props_night * Math.PI,
    );
    expect(shader.fragmentShader).not.toContain(IBL_DIFFUSE);
    expect(shader.fragmentShader).toContain("texture2D( roomNightMap");
  });

  it("finds the IBL diffuse line it strips from three.js", () => {
    // If a three.js upgrade rewords it, the environment would wash the bake out.
    expect(ShaderChunk.lights_fragment_maps).toContain(IBL_DIFFUSE);
  });
});
