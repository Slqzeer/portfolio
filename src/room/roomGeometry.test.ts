import { describe, expect, it } from "vitest";
import { portfolioContent } from "../content/portfolioContent";
import {
  CANVA_DESIGN_ID,
  CANVA_PAGE_SIZE,
  normalizeCanvaBounds,
  roomGeometry,
} from "./roomGeometry";

describe("roomGeometry", () => {
  it("normalizes Canva pixel bounds to percentages", () => {
    expect(
      normalizeCanvaBounds({
        left: 960,
        top: 540,
        width: 192,
        height: 108,
      }),
    ).toEqual({ x: 50, y: 50, width: 10, height: 10 });
  });

  it("covers every room object with production geometry and existing artwork", () => {
    const assetFiles = Object.keys(
      import.meta.glob("../../public/assets/room/*.png"),
    );
    expect(CANVA_DESIGN_ID).toBe("DAHXRbROrBI");
    expect(CANVA_PAGE_SIZE).toEqual({ width: 1920, height: 1080 });

    const objectIds = Object.keys(portfolioContent.roomObjects);
    expect(Object.keys(roomGeometry)).toEqual(
      expect.arrayContaining(objectIds),
    );

    for (const objectId of objectIds) {
      const entry = roomGeometry[objectId as keyof typeof roomGeometry];

      expect(entry.sourceElementRef).toMatch(/^figma:/);
      expect(entry.layerIndex).toBeGreaterThanOrEqual(0);
      expect(entry.focusTransform.scale).toBeGreaterThan(1);

      for (const value of Object.values(entry.hotspot)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }

      for (const assetPath of Object.values(entry.assets)) {
        expect(assetFiles).toContain(`../../public${assetPath}`);
      }
    }
  });
});
