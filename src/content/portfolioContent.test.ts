import { describe, expect, it } from "vitest";
import { localize, portfolioContent } from "./portfolioContent";

describe("portfolioContent", () => {
  it("contains complete French and English copy", () => {
    const localizedValues: Array<{ fr: string; en: string }> = [];

    const visit = (value: unknown) => {
      if (!value || typeof value !== "object") return;

      if ("fr" in value && "en" in value) {
        localizedValues.push(value as { fr: string; en: string });
        return;
      }

      Object.values(value).forEach(visit);
    };

    visit(portfolioContent);

    expect(localizedValues.length).toBeGreaterThan(0);
    localizedValues.forEach(({ fr, en }) => {
      expect(fr.trim()).not.toBe("");
      expect(en.trim()).not.toBe("");
    });
  });

  it("links every room object to an existing detail section", () => {
    Object.values(portfolioContent.roomObjects).forEach(({ detailId }) => {
      expect(portfolioContent.details[detailId]).toBeDefined();
    });
  });

  it("uses unique project IDs and clearly marks placeholder content", () => {
    const projectIds = portfolioContent.projects.map(({ id }) => id);

    expect(new Set(projectIds).size).toBe(projectIds.length);
    expect(portfolioContent.isSample).toBe(true);
  });

  it("localizes a value", () => {
    expect(localize({ fr: "Bonjour", en: "Hello" }, "en")).toBe("Hello");
  });
});
