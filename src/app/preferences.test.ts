import { describe, expect, it, vi } from "vitest";
import { readPreferences, writePreferences } from "./preferences";

const defaults = { locale: "fr" as const, lighting: "day" as const };

describe("preferences", () => {
  it("falls back when stored JSON is invalid", () => {
    expect(readPreferences({ getItem: () => "{bad json" })).toEqual(defaults);
  });

  it("falls back when storage is unavailable", () => {
    expect(
      readPreferences({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual(defaults);
  });

  it("ignores unavailable storage when writing", () => {
    expect(() =>
      writePreferences(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        { locale: "en", lighting: "night" },
      ),
    ).not.toThrow();
  });

  it("writes valid preferences", () => {
    const setItem = vi.fn();

    writePreferences({ setItem }, { locale: "en", lighting: "night" });

    expect(setItem).toHaveBeenCalledWith(
      "portfolio-preferences",
      JSON.stringify({ locale: "en", lighting: "night" }),
    );
  });
});
