import { describe, expect, it } from "vitest";
import { clampPointer, frameLerpFactor, sceneMotion } from "./sceneMotion";

describe("sceneMotion", () => {
  it("keeps the approved amplitudes", () => {
    expect(sceneMotion).toEqual({
      horizontalPixels: 14,
      verticalPixels: 8,
      rotationDegrees: 1.25,
      baseInterpolation: 0.075,
    });
  });

  it("normalizes interpolation across frame rates", () => {
    expect(frameLerpFactor(1 / 60)).toBeCloseTo(0.075, 10);

    const remainingAfter = (fps: number) =>
      Array.from({ length: fps }).reduce<number>(
        (remaining) => remaining * (1 - frameLerpFactor(1 / fps)),
        1,
      );

    expect(remainingAfter(30)).toBeCloseTo(remainingAfter(60), 10);
    expect(remainingAfter(120)).toBeCloseTo(remainingAfter(60), 10);
  });

  it("clamps pointer input and converges without overshoot", () => {
    expect(clampPointer(-4)).toBe(-1);
    expect(clampPointer(4)).toBe(1);
    expect(clampPointer(0.4)).toBe(0.4);

    let current = 1;
    for (let frame = 0; frame < 120; frame += 1) {
      const next = current + (0 - current) * frameLerpFactor(1 / 60);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThanOrEqual(current);
      current = next;
    }
    expect(current).toBeLessThan(0.001);
  });
});
