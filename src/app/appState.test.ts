import { describe, expect, it } from "vitest";
import { appReducer, initialAppState } from "./appState";

describe("appReducer", () => {
  it("opens reading content immediately and ignores an old camera arrival", () => {
    const selected = appReducer(initialAppState, {
      type: "object.selected",
      objectId: "monitor",
    });
    const reading = appReducer(selected, { type: "reading.toggled" });
    expect(reading.navigationPhase).toBe("INTERACT");
    expect(
      appReducer(reading, {
        type: "camera.arrived",
        transitionId: selected.transitionId,
      }),
    ).toBe(reading);
    const changed = appReducer(reading, {
      type: "object.selected",
      objectId: "contact",
    });
    expect(changed.navigationPhase).toBe("INTERACT");
    const restored = appReducer(changed, { type: "reading.toggled" });
    expect(restored.navigationPhase).toBe("FOCUS");
    const home = appReducer(restored, { type: "home.opened" });
    expect(home.activeObject).toBeNull();
    expect(home.readingMode).toBe(false);
    expect(home.introExpanded).toBe(true);
  });
  it("reveals content only after the current camera journey arrives", () => {
    const monitor = appReducer(initialAppState, {
      type: "object.selected",
      objectId: "monitor",
    });
    expect(monitor.navigationPhase).toBe("FOCUS");
    const server = appReducer(monitor, {
      type: "object.selected",
      objectId: "server",
    });
    expect(
      appReducer(server, {
        type: "camera.arrived",
        transitionId: monitor.transitionId,
      }),
    ).toBe(server);
    const arrived = appReducer(server, {
      type: "camera.arrived",
      transitionId: server.transitionId,
    });
    expect(arrived.navigationPhase).toBe("INTERACT");
    const returning = appReducer(arrived, {
      type: "object.selected",
      objectId: null,
    });
    expect(returning.navigationPhase).toBe("FOCUS");
    expect(
      appReducer(returning, {
        type: "camera.arrived",
        transitionId: returning.transitionId,
      }).navigationPhase,
    ).toBe("ROOM");
  });

  it("keeps HTML content immediately available after a scene failure", () => {
    const selected = appReducer(initialAppState, {
      type: "object.selected",
      objectId: "monitor",
    });
    const failed = appReducer(selected, { type: "scene.unavailable" });
    expect(failed.navigationPhase).toBe("INTERACT");
    expect(
      appReducer(failed, { type: "object.selected", objectId: "server" })
        .navigationPhase,
    ).toBe("INTERACT");
    expect(
      appReducer(failed, { type: "object.selected", objectId: null })
        .navigationPhase,
    ).toBe("ROOM");
  });

  it("changes locale", () => {
    expect(
      appReducer(initialAppState, { type: "locale.changed", locale: "en" })
        .locale,
    ).toBe("en");
  });

  it("minimizes the introduction", () => {
    expect(
      appReducer(initialAppState, { type: "intro.minimized" }).introExpanded,
    ).toBe(false);
  });

  it("changes project category", () => {
    expect(
      appReducer(initialAppState, {
        type: "category.changed",
        category: "game-development",
      }).projectCategory,
    ).toBe("game-development");
  });

  it.each([
    ["monitor", "data-ai"],
    ["controller", "game-development"],
    ["smartphone", "experiments"],
  ] as const)("opens %s on its project category", (objectId, category) => {
    const state = { ...initialAppState, projectCategory: "software" as const };

    expect(
      appReducer(state, { type: "object.selected", objectId }).projectCategory,
    ).toBe(category);
  });

  it("toggles lighting as one synchronized state", () => {
    const night = appReducer(initialAppState, { type: "lighting.toggled" });
    const day = appReducer(night, { type: "lighting.toggled" });

    expect(night.lighting).toBe("night");
    expect(day.lighting).toBe("day");
  });
});
