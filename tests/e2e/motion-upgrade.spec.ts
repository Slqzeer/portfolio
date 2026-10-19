import { expect, test } from "@playwright/test";
import { openSettings } from "./controls";

for (const width of [1440, 390]) {
  test(`controller startup and project screenshots at ${width}px`, async ({
    page,
  }, info) => {
    test.slow();
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem("portfolio-motion", "full");
      localStorage.setItem(
        "portfolio-preferences",
        JSON.stringify({ locale: "en", lighting: "day" }),
      );
    });
    await page.goto("/");
    const canvas = page.locator(".room-canvas canvas");
    await expect(page.locator(".room-canvas")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-controller-glow", "0.0000", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "Explore the room" }).click();
    await page.locator("#room-hotspot-controller").click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-navigation-phase",
      "INTERACT",
      { timeout: 15000 },
    );
    await expect
      .poll(
        async () => Number(await canvas.getAttribute("data-controller-glow")),
        { timeout: 15000 },
      )
      .toBeGreaterThan(1);
    await page.screenshot({ path: info.outputPath("controller-powered.png") });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator("#room-hotspot-monitor")).toBeVisible({
      timeout: 15000,
    });
    await expect(canvas).toHaveAttribute("data-controller-glow", "0.0000", {
      timeout: 15000,
    });
    await page.locator("#room-hotspot-monitor").click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-navigation-phase",
      "INTERACT",
      { timeout: 15000 },
    );
    const preview = page.locator(".project-screenshot");
    await expect(preview).toHaveAttribute(
      "src",
      "/assets/projects/classpulse-homepage.png",
    );
    await expect(canvas).toHaveAttribute(
      "data-project-preview",
      "/assets/projects/classpulse-homepage.png",
      { timeout: 15000 },
    );
    await expect(preview).toHaveJSProperty("naturalWidth", 1876);
    await page.screenshot({ path: info.outputPath("classpulse-preview.png") });
    await page
      .getByRole("button", {
        name: "ClassPulse: agentic support session",
        exact: true,
      })
      .click();
    await expect(canvas).toHaveAttribute(
      "data-project-preview",
      "/assets/projects/classpulse-session.png",
      { timeout: 15000 },
    );
    await page.getByRole("button", { name: "Software", exact: true }).click();
    await expect(preview).toHaveAttribute(
      "src",
      "/assets/projects/portfolio-room.png",
    );
    await expect(canvas).toHaveAttribute(
      "data-project-preview",
      "/assets/projects/portfolio-room.png",
      { timeout: 15000 },
    );
    await page
      .getByRole("button", { name: "The room at night", exact: true })
      .click();
    await expect(preview).toHaveAttribute(
      "src",
      "/assets/projects/portfolio-night.png",
    );
    await openSettings(page);
    await page.getByRole("button", { name: "Toggle day / night" }).click();
    await expect(canvas).toHaveAttribute("data-editor-theme", "night", {
      timeout: 15000,
    });
    await expect(canvas).toHaveAttribute(
      "data-project-preview",
      "/assets/projects/portfolio-night.png",
      { timeout: 15000 },
    );
    await page.getByLabel("Visit settings").click();
    await page.screenshot({
      path: info.outputPath("portfolio-preview-night.png"),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
