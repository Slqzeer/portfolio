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
});
