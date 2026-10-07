import { describe, expect, it } from "vitest";
import { lightingFrame } from "./RoomLighting";

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
});
