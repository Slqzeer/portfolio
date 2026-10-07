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

  it("toggles lighting as one synchronized state", () => {
    const night = appReducer(initialAppState, { type: "lighting.toggled" });
    const day = appReducer(night, { type: "lighting.toggled" });

    expect(night.lighting).toBe("night");
    expect(day.lighting).toBe("day");
  });
});
