import { describe, expect, it } from "vitest";

const expectedEntries = [
  ["desk", "INT_Desk", "CAM_Anchor_Desk", "focus-zone"],
  ["monitor", "INT_Monitor", "CAM_Anchor_Monitor", "focus", "desk"],
  ["server", "INT_Homelab", "CAM_Anchor_Homelab", "focus"],
  ["education", "INT_Diploma", "CAM_Anchor_Diploma", "focus"],
  ["volleyball", "INT_Volleyball", "CAM_Anchor_Volleyball", "focus"],
  ["controller", "INT_Controller", "CAM_Anchor_Controller", "focus"],
  ["smartphone", "INT_Smartphone", "CAM_Anchor_Smartphone", "focus", "desk"],
  ["bookshelf", "INT_Bookshelf", "CAM_Anchor_Bookshelf", "focus"],
  ["contact", "INT_ContactCard", "CAM_Anchor_ContactCard", "focus"],
  ["window", "CTL_Curtains", undefined, "toggle-lighting"],
  ["flag", "CTL_Flag", undefined, "toggle-locale"],
] as const satisfies ReadonlyArray<
  readonly [string, string, string | undefined, string, string?]
>;

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
      expectedEntries.map(
        ([id, nodeName, cameraAnchorName, action, parentId]: readonly [
          string,
          string,
          string | undefined,
          string,
          string?,
        ]) => ({
          id,
          nodeName,
          ...(cameraAnchorName ? { cameraAnchorName } : {}),
          action,
          ...(parentId ? { parentId } : {}),
        }),
      ),
    );
  });

  it("reserves camera anchors for focus and focus-zone actions", async () => {
    const module = await loadManifest();

    expect(module).not.toBeNull();
    if (!module) return;

    for (const definition of Object.values(module.sceneManifest)) {
      if (definition.action === "focus" || definition.action === "focus-zone") {
        expect(definition.cameraAnchorName).toMatch(/^CAM_Anchor_/);
      } else {
        expect(definition.cameraAnchorName).toBeUndefined();
      }
    }
  });
});

describe("scene hierarchy", () => {
  it("resolves the declared parent of a room object", async () => {
    const { parentRoomObjectId } = await import("./sceneManifest");

    expect(parentRoomObjectId("monitor")).toBe("desk");
    expect(parentRoomObjectId("smartphone")).toBe("desk");
    expect(parentRoomObjectId("desk")).toBeNull();
    expect(parentRoomObjectId("controller")).toBeNull();
  });

  it("exposes desk children only inside the desk context", async () => {
    const { roomObjectIdsForContext } = await import("./sceneManifest");
    const topLevel = [
      "desk",
      "server",
      "education",
      "volleyball",
      "controller",
      "bookshelf",
      "contact",
      "window",
      "flag",
    ];

    expect(roomObjectIdsForContext(null)).toEqual(topLevel);
    expect(roomObjectIdsForContext("server")).toEqual(topLevel);
    for (const context of ["desk", "monitor", "smartphone"] as const) {
      expect(roomObjectIdsForContext(context)).toEqual([
        ...topLevel.slice(0, 1),
        "monitor",
        ...topLevel.slice(1, 5),
        "smartphone",
        ...topLevel.slice(5),
      ]);
    }
  });

  it("routes a desk child selected outside the desk to the desk", async () => {
    const { selectionTarget } = await import("./sceneManifest");

    expect(selectionTarget("monitor", null)).toBe("desk");
    expect(selectionTarget("smartphone", "server")).toBe("desk");
    expect(selectionTarget("monitor", "desk")).toBe("monitor");
    expect(selectionTarget("monitor", "smartphone")).toBe("monitor");
    expect(selectionTarget("controller", null)).toBe("controller");
  });
});
