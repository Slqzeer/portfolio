import { describe, expect, it } from "vitest";
import { appReducer, initialAppState } from "./appState";

describe("appReducer", () => {
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
