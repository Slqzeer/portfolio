import scalesJson from "../../public/assets/room/lightmaps/scales.json?raw";
import { MeshStandardMaterial, Texture } from "three";
import { describe, expect, it } from "vitest";
import { LIGHTMAP_SCALES, applyLightmaps, lightingFrame } from "./RoomLighting";

describe("RoomLighting", () => {
  it("finishes day with open curtains, daylight, and no lamp", () => {
    expect(lightingFrame("day", 1)).toMatchObject({
      curtainProgress: 0,
      lamp: 0,
    });
    expect(lightingFrame("day", 1).daylight).toBeGreaterThan(0);
    expect(lightingFrame("day", 1).window).toBeGreaterThan(0);
  });

  it("removes every window light before raising the night lamp", () => {
    expect(lightingFrame("night", 0.49).lamp).toBe(0);
    expect(lightingFrame("night", 0.5)).toMatchObject({
      daylight: 0,
      window: 0,
      lamp: 0,
    });
    expect(lightingFrame("night", 1)).toMatchObject({
      daylight: 0,
      window: 0,
      curtainProgress: 1,
    });
    expect(lightingFrame("night", 1).lamp).toBeGreaterThan(0);
  });

  it("stages the baked day lightmap out before the night lightmap in", () => {
    expect(lightingFrame("day", 1)).toMatchObject({ dayMap: 1, nightMap: 0 });
    expect(lightingFrame("night", 0.5)).toMatchObject({
      dayMap: 0,
      nightMap: 0,
    });
    expect(lightingFrame("night", 1)).toMatchObject({ dayMap: 0, nightMap: 1 });
    expect(lightingFrame("day", 0.25).dayMap).toBe(0);
    expect(lightingFrame("day", 0.75).dayMap).toBeCloseTo(0.5);
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
    expect(shell.lightMapIntensity).toBeCloseTo(
      LIGHTMAP_SCALES.LM_shell_day * 0.5,
    );
    expect(props.lightMap).toBe(textures.LM_props_day);

    applyLightmaps([shell, props], textures, { dayMap: 0, nightMap: 1 });
    expect(props.lightMap).toBe(textures.LM_props_night);
    expect(props.lightMapIntensity).toBeCloseTo(LIGHTMAP_SCALES.LM_props_night);
  });
});
