import scalesJson from "../../public/assets/room/lightmaps/scales.json?raw";
import { MeshStandardMaterial, Texture } from "three";
import { describe, expect, it } from "vitest";
import { LIGHTMAP_SCALES, applyLightmaps, lightingFrame } from "./RoomLighting";

describe("RoomLighting", () => {
  it("finishes day flat-lit with open curtains and no lamp", () => {
    expect(lightingFrame("day", 1)).toMatchObject({
      curtainProgress: 0,
      lamp: 0,
      nightMap: 0,
    });
    expect(lightingFrame("day", 1).day).toBeGreaterThan(0);
  });

  it("removes the day light before raising the night lamp", () => {
    expect(lightingFrame("night", 0.49).lamp).toBe(0);
    expect(lightingFrame("night", 0.5)).toMatchObject({
      day: 0,
      lamp: 0,
      nightMap: 0,
    });
    expect(lightingFrame("night", 1)).toMatchObject({
      day: 0,
      nightMap: 1,
      curtainProgress: 1,
    });
    expect(lightingFrame("night", 1).lamp).toBeGreaterThan(0);
    expect(lightingFrame("day", 0.25).day).toBe(0);
  });

  it("darkens the garden behind the window before the blind closes", () => {
    expect(lightingFrame("day", 1).windowView).toBe(1);
    expect(lightingFrame("night", 0.5).windowView).toBeCloseTo(0.025);
    expect(lightingFrame("night", 1).windowView).toBeCloseTo(0.025);
  });

  it("uses the encoded lightmap scales", () => {
    expect(LIGHTMAP_SCALES).toEqual(JSON.parse(scalesJson));
  });

  it("applies only the night lightmap, scaled", () => {
    const props = new MeshStandardMaterial();
    props.userData.lightmapAtlas = "props";
    const textures = { LM_props_night: new Texture() };

    applyLightmaps([props], textures, 0);
    expect(props.lightMapIntensity).toBe(0);

    applyLightmaps([props], textures, 1);
    expect(props.lightMap).toBe(textures.LM_props_night);
    expect(props.lightMapIntensity).toBeCloseTo(LIGHTMAP_SCALES.LM_props_night);
  });
});
