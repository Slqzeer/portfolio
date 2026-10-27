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
    expect(Object.keys(portfolioContent.roomObjects)).toEqual([
      "desk",
      "monitor",
      "server",
      "volleyball",
      "education",
      "controller",
      "smartphone",
      "bookshelf",
      "contact",
      "flag",
      "window",
    ]);

    Object.values(portfolioContent.roomObjects).forEach(({ detailId }) => {
      expect(portfolioContent.details[detailId]).toBeDefined();
    });
  });

  it("labels the desk zone in French and English", () => {
    const { label } = portfolioContent.roomObjects.desk;

    expect(label.fr.trim()).not.toBe("");
    expect(label.en.trim()).not.toBe("");
  });

  it("keeps the French internship location correctly accented", () => {
    expect(portfolioContent.contact.location.fr).toBe(
      "Basé en Île-de-France, je recherche un stage en tant qu’ingénieur Data & IA à partir du 8 février 2027.",
    );
  });

  it("does not contain text corrupted by a character-encoding mismatch", () => {
    expect(JSON.stringify(portfolioContent)).not.toMatch(/(?:Ã.|Â.|â[€†Œ]|�)/);
  });

  it("uses unique project IDs and the provided identity", () => {
    const projectIds = portfolioContent.projects.map(({ id }) => id);

    expect(new Set(projectIds).size).toBe(projectIds.length);
    expect(portfolioContent.identity.name).toBe("Martin Couturier");
    expect(
      portfolioContent.projects.every((project) =>
        project.github
          ? project.github.startsWith("https://github.com/")
          : true,
      ),
    ).toBe(true);
  });

  it("shows the updated project visuals on the project screen", () => {
    const screenshots = Object.fromEntries(
      portfolioContent.projects.map(({ id, screenshots }) => [
        id,
        screenshots?.map(({ src }) => src),
      ]),
    );

    expect(screenshots["advanced-rag"]).toEqual([
      "/assets/projects/advanced-rag-chat.png",
      "/assets/projects/advanced-rag-overview.png",
    ]);
    expect(screenshots.ping).toEqual(["/assets/projects/ping-overview.png"]);
    expect(screenshots["pass-through"]).toEqual([
      "/assets/projects/pass-through-cover.png",
    ]);
  });

  it("publishes Hermes as the phone experiment without exposing its private repository", () => {
    const hermes = portfolioContent.projects.find(({ id }) => id === "hermes");

    expect(hermes).toMatchObject({
      category: "experiments",
      stack: ["Python", "Hermes Agent", "Telegram", "GitHub"],
    });
    expect(hermes).not.toHaveProperty("github");
  });

  it("localizes a value", () => {
    expect(localize({ fr: "Bonjour", en: "Hello" }, "en")).toBe("Hello");
  });
});
