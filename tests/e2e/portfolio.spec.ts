import { expect, test } from "@playwright/test";

test("loads the GLB behind its poster and enables pointer follow", async ({
  page,
}) => {
  await page.route("**/portfolio-room.glb", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/");

  const roomCanvas = page.locator(".room-canvas");
  await expect(page.getByTestId("room-poster")).toBeVisible();
  await expect(roomCanvas).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("room-poster")).toHaveCount(0);

  const canvas = roomCanvas.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-target", "CAM_Overview");
  await expect(canvas).toHaveAttribute("data-fps", /[1-9]/, {
    timeout: 5000,
  });
  await expect(canvas).toHaveAttribute("data-draw-calls", /[1-9]/);

  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width - 5, bounds!.y + 5);
  await expect(canvas).not.toHaveAttribute("data-pointer-follow", "0,0");
  await page.mouse.move(1, 1);
  await expect(canvas).toHaveAttribute("data-pointer-follow", "0,0");
});

test("routes focus, curtains, and flag without control zoom", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorer la chambre" }).click();
  const canvas = page.locator(".room-canvas canvas");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(canvas).toHaveAttribute("data-fps", /[1-9]/, { timeout: 5000 });
  await page.getByRole("button", { name: "Projets Data et IA" }).click();
  await expect(page).toHaveURL(/#room\/monitor$/);
  await expect(canvas).toHaveAttribute(
    "data-camera-target",
    "CAM_Anchor_Monitor",
  );
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Changer la lumière" }).click();
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-lighting",
    "night",
  );
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-lamps",
    "on",
  );
  await expect(page).not.toHaveURL(/#room\//);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(canvas).toHaveAttribute("data-camera-target", "CAM_Overview");

  await page.getByRole("button", { name: "Changer de langue" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/#room\//);
  await expect(canvas).toHaveAttribute("data-camera-target", "CAM_Overview");
});

test("supports keyboard focus, Back, and Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorer la chambre" }).click();
  const monitor = page.getByRole("button", { name: "Projets Data et IA" });
  await monitor.focus();
  await page.keyboard.press("Enter");
  await page
    .getByTestId("room-scene")
    .getByRole("button", { name: "Homelab" })
    .click();
  await page.goBack();
  await expect(page).toHaveURL(/#room\/monitor$/);
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(monitor).toBeFocused();
});

test("keeps the poster and controls when the GLB fails", async ({ page }) => {
  await page.route("**/portfolio-room.glb", (route) => route.abort());
  await page.goto("/");

  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-failed",
    "true",
  );
  await expect(page.getByTestId("room-poster")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("3D scene unavailable");
  await expect(
    page.getByRole("navigation", {
      name: "Commandes de la chambre interactive",
    }),
  ).toBeVisible();
});

test("supports mobile, reduced motion, and hidden-tab pause", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#room/server");

  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "true",
  );
  await expect(page.getByRole("dialog", { name: "Homelab" })).toHaveCSS(
    "position",
    "fixed",
  );

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "false",
  );
  const mobileCanvas = page.locator(".room-canvas canvas");
  await expect(mobileCanvas).toHaveAttribute("data-fps", /[1-9]/, {
    timeout: 5000,
  });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "true",
  );
});
