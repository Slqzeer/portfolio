import { describe, expect, it } from "vitest";

const expectedEntries = [
  ["monitor", "INT_Monitor", "CAM_Anchor_Monitor", "focus"],
  ["server", "INT_Homelab", "CAM_Anchor_Homelab", "focus"],
  ["education", "INT_Diploma", "CAM_Anchor_Diploma", "focus"],
  ["volleyball", "INT_Volleyball", "CAM_Anchor_Volleyball", "focus"],
  ["controller", "INT_Controller", "CAM_Anchor_Controller", "focus"],
  ["smartphone", "INT_Smartphone", "CAM_Anchor_Smartphone", "focus"],
  ["bookshelf", "INT_Bookshelf", "CAM_Anchor_Bookshelf", "focus"],
  ["contact", "INT_ContactCard", "CAM_Anchor_ContactCard", "focus"],
  ["window", "CTL_Curtains", undefined, "toggle-lighting"],
  ["flag", "CTL_Flag", undefined, "toggle-locale"],
] as const;

async function loadManifest(): Promise<
  typeof import("./sceneManifest") | null
> {
  const modulePath = "./sceneManifest";
  return import(modulePath).catch(() => null);
}

describe("sceneManifest", () => {
  it("maps every portfolio function to its stable Blender node", async () => {
    const module = await loadManifest();

    expect(module).not.toBeNull();
    if (!module) return;

    expect(Object.values(module.sceneManifest)).toEqual(
      expectedEntries.map(([id, nodeName, cameraAnchorName, action]) => ({
        id,
        nodeName,
        ...(cameraAnchorName ? { cameraAnchorName } : {}),
        action,
      })),
    );
  });

  it("reserves camera anchors for focus actions", async () => {
    const module = await loadManifest();

    expect(module).not.toBeNull();
    if (!module) return;

    for (const definition of Object.values(module.sceneManifest)) {
      if (definition.action === "focus") {
        expect(definition.cameraAnchorName).toMatch(/^CAM_Anchor_/);
      } else {
        expect(definition.cameraAnchorName).toBeUndefined();
      }
    }
  });
});
