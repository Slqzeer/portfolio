import { expect, test } from "@playwright/test";
import { openNavigation, openSettings } from "./controls";

test("groups controls, starts animations, and remembers an explicit pause", async ({
  page,
}) => {
  await page.route("**/portfolio-room.glb", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-failed",
    "true",
  );
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(page.locator(".room-caption, .room-guide")).toHaveCount(0);
  await expect(page.locator(".site-header .room-controls")).toHaveCount(1);
  await openSettings(page);
  await expect(page.locator(".room-menu")).not.toHaveAttribute("open");
  const motion = page.getByRole("button", { name: "Animations", exact: true });
  await expect(motion).toHaveAttribute("aria-pressed", "true");
  await motion.click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Réglages de la visite", { exact: true }),
  ).toBeFocused();
  await expect(page.locator(".settings-menu")).not.toHaveAttribute("open");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await openNavigation(page);
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await openSettings(page);
    const header = await page.locator(".site-header").boundingBox();
    const settings = await page
      .locator(".settings-menu .menu-panel")
      .boundingBox();
    expect(header!.height).toBeLessThanOrEqual(54);
    expect(settings!.x).toBeGreaterThanOrEqual(0);
    expect(settings!.x + settings!.width).toBeLessThanOrEqual(width);
    await page
      .getByRole("button", { name: "Français, switch to English" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page
      .getByRole("button", { name: "English, passer en français" })
      .click();
  }
});
