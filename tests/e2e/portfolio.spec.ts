import { expect, test } from "@playwright/test";

test("explores the room, changes lighting, and opens a shareable detail", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText(/Stage de fin d’études/)).toBeVisible();

  await page.getByRole("button", { name: "Explorer la chambre" }).click();
  await page.getByRole("button", { name: "Changer la lumière" }).click();
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-lighting",
    "night",
  );

  await page.getByRole("button", { name: "Projets Data et IA" }).click();
  await expect(page).toHaveURL(/#room\/monitor$/);
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
});

test("supports keyboard close, invalid hashes, and mobile details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#room/server");
  await expect(page.getByRole("dialog", { name: "Homelab" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto("/#room/unknown");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("restores focus, follows Back, persists locale, and filters projects", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorer la chambre" }).click();

  const monitor = page.getByRole("button", { name: "Projets Data et IA" });
  await monitor.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Homelab" }).last().click();
  await expect(page.getByText(/Observabilité homelab/)).toBeVisible();
  await expect(page.getByText(/Assistant documentaire/)).toHaveCount(0);

  const server = page.getByRole("button", { name: "Homelab" }).first();
  await server.focus();
  await page.keyboard.press("Enter");
  await page.goBack();
  await expect(page).toHaveURL(/#room\/monitor$/);

  await page.keyboard.press("Escape");
  await expect(monitor).toBeFocused();
  await page.getByRole("button", { name: "English" }).click();
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Français" })).toBeVisible();
});

test("keeps mobile, reduced-motion, and missing-artwork fallbacks usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#room/server");

  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "true",
  );
  await expect(page.getByRole("dialog", { name: "Homelab" })).toHaveCSS(
    "position",
    "fixed",
  );

  await page.locator("[data-room-asset]").evaluate((image) => {
    image.setAttribute("src", "/missing-room-artwork.png");
    image.dispatchEvent(new Event("error"));
  });
  await expect(page.getByRole("img", { name: /indisponible/ })).toBeVisible();
});

test("cancels and restarts idle discovery after input", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 1000),
  );

  await page.clock.fastForward(8000);
  await expect(page.locator('[data-hinted="true"]')).toHaveCount(1);

  await page.evaluate(() =>
    window.dispatchEvent(new PointerEvent("pointerdown")),
  );
  await expect(page.locator('[data-hinted="true"]')).toHaveCount(0);
  await page.clock.fastForward(7999);
  await expect(page.locator('[data-hinted="true"]')).toHaveCount(0);
});
