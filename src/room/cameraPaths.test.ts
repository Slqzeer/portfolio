import { describe, expect, it } from "vitest";
import {
  cameraPath,
  cameraRoute,
  HOME_CAMERA,
  overviewFrameScale,
  travelEase,
} from "./cameraPaths";

describe("camera paths", () => {
  it("keeps the room generous on phones and framed on wider canvases", () => {
    expect(overviewFrameScale(390, 370)).toBe(0.78);
    expect(overviewFrameScale(1011, 658)).toBe(0.88);
    expect(overviewFrameScale(1800, 600)).toBe(1);
  });
  it("clears the chair through the desk before approaching either screen", () => {
    expect(cameraPath("CAM_Anchor_Smartphone")).toEqual([
      HOME_CAMERA,
      "CAM_Anchor_Desk",
      "CAM_Anchor_Smartphone",
    ]);
    expect(cameraRoute("CAM_Anchor_Monitor", "CAM_Anchor_Smartphone")).toEqual([
      "CAM_Anchor_Monitor",
      "CAM_Anchor_Desk",
      "CAM_Anchor_Smartphone",
    ]);
  });

  it("retraces the reviewed edges when returning or switching zones", () => {
    expect(cameraRoute("CAM_Anchor_Monitor", HOME_CAMERA)).toEqual([
      "CAM_Anchor_Monitor",
      "CAM_Anchor_Desk",
      HOME_CAMERA,
    ]);
    expect(cameraRoute("CAM_Anchor_Monitor", "CAM_Anchor_Homelab")).toEqual([
      "CAM_Anchor_Monitor",
      "CAM_Anchor_Desk",
      HOME_CAMERA,
      "CAM_Anchor_Homelab",
    ]);
  });

  it("has a bounded easing curve with gentle departure and arrival", () => {
    expect(travelEase(-1)).toBe(0);
    expect(travelEase(2)).toBe(1);
    expect(travelEase(0.5)).toBe(0.5);
    expect(travelEase(0.01)).toBeLessThan(0.001);
    expect(travelEase(0.99)).toBeGreaterThan(0.999);
  });
});
