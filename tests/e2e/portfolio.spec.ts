import { expect, test, type Page } from "@playwright/test";

async function openRoomMenu(page: Page) {
  const menu = page.locator(".room-menu");
  if (!(await menu.evaluate((node) => (node as HTMLDetailsElement).open))) {
    await page.getByLabel("Toutes les rubriques", { exact: true }).click();
  }
  await expect(menu).toHaveAttribute("open", "");
}

test("animates exported foliage and renders both ambient shaders without errors", async ({
  page,
}, testInfo) => {
  test.slow();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  const canvas = page.locator(".room-canvas canvas");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(canvas).toHaveAttribute("data-plant-sway", /-?0\.\d+/, {
    timeout: 15000,
  });
  const first = await canvas.getAttribute("data-plant-sway");
  await expect(canvas).not.toHaveAttribute("data-plant-sway", first!);
  await page.getByRole("button", { name: "Réduire les mouvements" }).click();
  await expect(canvas).toHaveAttribute("data-plant-sway", "0.00000");
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(
    page.getByRole("button", { name: "Basculer jour / nuit" }),
  ).toContainText("Soir");
  await page.screenshot({ path: testInfo.outputPath("art-night.png") });
  expect(errors).toEqual([]);
});

test("reads real projects while the 3D asset is still loading", async ({
  page,
}, testInfo) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/portfolio-room.glb", async (route) => {
    await held;
    await route.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Lecture rapide" }).click();
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ClassPulse" })).toBeVisible();
  await expect(page.locator(".room-canvas")).toHaveCount(0);
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "ClassPulse" }) })
    .getByText("Découvrir le projet")
    .click();
  await expect(
    page.getByText(/Mon rôle : contribuer à la conception/),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("reading-classpulse.png"),
  });
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Contact" })
    .click();
  await expect(page.getByRole("dialog", { name: "Contact" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /LinkedIn Martin Couturier/ }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/martin-couturier");
  await page.screenshot({ path: testInfo.outputPath("reading-contact.png") });
  release?.();
});

test("opens an object marker and remembers the motion setting", async ({
  page,
}, testInfo) => {
  test.slow();
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Réduire les mouvements" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.getByRole("button", { name: "Les projets", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Les projets", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await page.screenshot({ path: testInfo.outputPath("overview-night.png") });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Réduire les mouvements" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("loads the GLB behind a loading screen and enables pointer follow", async ({
  page,
}) => {
  await page.route("**/portfolio-room.glb", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/");

  const roomCanvas = page.locator(".room-canvas");
  const loading = page.getByRole("progressbar", {
    name: "Chargement de la chambre",
  });
  await expect(loading).toBeVisible();
  // Ready waits for the GLB and its lightmaps; CI renders in software.
  await expect(roomCanvas).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  await expect(loading).toHaveCount(0);
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
  // Zoomed views fill the canvas; CI's software renderer draws them at ~1 fps
  // (60 fps on a GPU), so clicks wait seconds for animation frames.
  test.slow();
  await page.setViewportSize({ width: 960, height: 640 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explorer la chambre" }).click();
  const canvas = page.locator(".room-canvas canvas");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(canvas).toHaveAttribute("data-fps", /[1-9]/, { timeout: 5000 });
  await openRoomMenu(page);
  await page.getByRole("button", { name: "Bureau et projets" }).click();
  await expect(page).toHaveURL(/#room\/desk$/);
  await expect(canvas).toHaveAttribute("data-camera-target", "CAM_Anchor_Desk");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openRoomMenu(page);
  await page.getByRole("button", { name: "Mes projets" }).click();
  await expect(page).toHaveURL(/#room\/monitor$/);
  await expect(canvas).toHaveAttribute(
    "data-camera-target",
    "CAM_Anchor_Monitor",
  );
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#room\/desk$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/#room\//);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
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

  await openRoomMenu(page);
  await page.getByRole("button", { name: "Changer de langue" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/#room\//);
  await expect(canvas).toHaveAttribute("data-camera-target", "CAM_Overview");
});

test("supports keyboard focus, Back, and Escape", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 960, height: 640 });
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Explorer la chambre" }).click();
  await openRoomMenu(page);
  await page.getByRole("button", { name: "Bureau et projets" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#room\/desk$/);
  await openRoomMenu(page);
  const monitor = page.getByRole("button", { name: "Mes projets" });
  await monitor.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Homelab" })
    .click();
  await page.goBack();
  await expect(page).toHaveURL(/#room\/monitor$/);
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#room\/desk$/);
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );
  await expect(monitor).toBeFocused();

  await monitor.press("Enter");
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#room\/desk$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goBack();
  await expect(page).not.toHaveURL(/#room\//);
  await expect(monitor).toHaveCount(0);
});

test("keeps the poster and controls when the GLB fails", async ({ page }) => {
  await page.route("**/portfolio-room.glb", (route) => route.abort());
  await page.goto("/");

  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-failed",
    "true",
  );
  await expect(page.getByTestId("room-poster")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Les rubriques restent accessibles",
  );
  await expect(
    page.getByRole("navigation", {
      name: "Commandes de la chambre interactive",
    }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(page.getByRole("dialog", { name: "Projets" })).toBeVisible();
});

test("reviews direct projects navigation and separate desktop/mobile reading space", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.screenshot({ path: testInfo.outputPath("overview-desktop.png") });
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );
  const panel = page.getByRole("dialog", { name: "Projets" });
  await expect(panel).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Projets", exact: true }),
  ).toBeFocused();
  const desktopCanvas = await page.locator(".room-canvas").boundingBox();
  const desktopPanel = await panel.boundingBox();
  await page.screenshot({ path: testInfo.outputPath("projects-desktop.png") });
  expect(desktopCanvas!.x + desktopCanvas!.width).toBeLessThanOrEqual(
    desktopPanel!.x + 1,
  );
  await page.screenshot({ path: testInfo.outputPath("projects-desktop.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "ROOM",
    { timeout: 15000 },
  );
  await expect(page).not.toHaveURL(/#room\//);
  await expect(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Projets" }),
  ).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.screenshot({ path: testInfo.outputPath("overview-mobile.png") });
  const mobileIntro = await page.locator(".intro-card").boundingBox();
  const mobileOverview = await page.locator(".room-canvas").boundingBox();
  expect(mobileIntro!.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(mobileOverview!.y + mobileOverview!.height).toBeLessThanOrEqual(
    mobileIntro!.y + 1,
  );
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );
  await expect(panel).toBeVisible();
  const mobileCanvas = await page.locator(".room-canvas").boundingBox();
  const mobilePanel = await panel.boundingBox();
  expect(mobileCanvas!.y + mobileCanvas!.height).toBeLessThanOrEqual(
    mobilePanel!.y + 1,
  );
  await page.screenshot({ path: testInfo.outputPath("projects-mobile.png") });

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  const smallRoom = await page.locator(".room-canvas").boundingBox();
  const smallIntro = await page.locator(".intro-card").boundingBox();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(smallRoom!.height).toBeGreaterThanOrEqual(192);
  expect(smallRoom!.y + smallRoom!.height).toBeLessThanOrEqual(
    smallIntro!.y + 1,
  );
  await page.screenshot({
    path: testInfo.outputPath("overview-small-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(panel).toBeVisible();
  const smallControls = await page.locator(".room-controls").boundingBox();
  const smallTools = await page.locator(".room-tools").boundingBox();
  expect(smallControls!.x + smallControls!.width).toBeLessThanOrEqual(
    smallTools!.x,
  );
  const navigation = page.getByRole("navigation", {
    name: "Navigation principale",
  });
  expect(
    await navigation.evaluate((nav) => nav.scrollWidth <= nav.clientWidth),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Français, switch to English" })
    .click();
  expect(
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .evaluate((nav) => nav.scrollWidth <= nav.clientWidth),
  ).toBe(true);
});

test("supports mobile, reduced motion, and hidden-tab pause", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#room/server");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 15000 },
  );

  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "true",
  );
  await expect(page.getByRole("dialog", { name: "Homelab" })).toHaveCSS(
    "position",
    "fixed",
  );
  await openRoomMenu(page);
  const gameShortcut = page.getByRole("button", {
    name: "Développement de jeux",
  });
  await expect(gameShortcut).toBeInViewport();
  await gameShortcut.click();
  await expect(
    page.getByRole("dialog", { name: "Création de jeux" }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucun projet publié dans cette catégorie pour le moment."),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.getByTestId("room-scene")).toHaveAttribute(
    "data-ambient-paused",
    "false",
  );
  const mobileCanvas = page.locator(".room-canvas canvas");
  await expect(mobileCanvas).toHaveAttribute("data-fps", /[1-9]/, {
    timeout: 20000,
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
