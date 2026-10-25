import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { useLightweightRoomLighting } from "./controls";

test.beforeAll(async () => {
  await mkdir("assets/reviews", { recursive: true });
});

test.beforeEach(async ({ page }) => useLightweightRoomLighting(page));

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  for (const theme of ["day", "night"]) {
    test(`controller marker and rounded detail card at ${viewport.width}px in ${theme}`, async ({
      page,
    }) => {
      test.slow();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.addInitScript((theme) => {
        localStorage.setItem("portfolio-motion", "reduced");
        localStorage.setItem(
          "portfolio-preferences",
          JSON.stringify({ locale: "fr", lighting: theme }),
        );
      }, theme);
      await page.goto("/");
      await expect(page.locator(".room-canvas")).toHaveAttribute(
        "data-ready",
        "true",
        { timeout: 30000 },
      );
      await page.getByRole("button", { name: "Explorer la chambre" }).click();
      const marker = page.locator("#room-hotspot-controller");
      await expect(marker).toBeInViewport({ ratio: 1 });
      await expect(marker.locator(".hotspot-dot")).toHaveCSS("width", "7px");
      await marker.click();
      await expect(page.locator("main")).toHaveAttribute(
        "data-navigation-phase",
        "INTERACT",
        { timeout: 20000 },
      );
      await expect(page.locator(".room-canvas")).toHaveAttribute(
        "data-active-object",
        "controller",
      );
      const panel = page.getByRole("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveCSS(
        "background-color",
        theme === "day" ? "rgb(253, 251, 246)" : "rgb(28, 44, 38)",
      );
      await expect(panel).toHaveCSS(
        "border-top-left-radius",
        viewport.width > 760 ? "18px" : "20px",
      );
      await expect(panel).not.toHaveCSS("box-shadow", "none");
      await expect(panel).toHaveCSS("border-top-width", "1px");
      await expect(panel).toHaveCSS("text-shadow", "none");
      await expect(page.locator(".room-scene")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      await expect(page.locator(".room-frame")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `assets/reviews/room-controller-panel-${viewport.width}-${theme}.png`,
      });
      await panel.getByRole("button", { name: "Fermer" }).click();
      await expect(page.locator("main")).toHaveAttribute(
        "data-navigation-phase",
        "ROOM",
        { timeout: 20000 },
      );
      await expect(marker).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}
