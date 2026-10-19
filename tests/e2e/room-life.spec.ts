import { openNavigation, openSettings } from "./controls";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 960, height: 640 } });

test("re-enables and remembers curtain animation with saved and system reduced motion", async ({
  page,
}) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    if (!localStorage.getItem("portfolio-motion"))
      localStorage.setItem("portfolio-motion", "reduced");
  });
  const errors: string[] = [];
  const publicImports: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/public/assets/"))
      publicImports.push(request.url());
  });
  const scalesResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/assets/room/lightmaps/scales.json",
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await openSettings(page);
  const toggle = page.getByRole("button", { name: "Animations", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toHaveAttribute("title", "Activer les animations");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect((await scalesResponse).status()).toBe(200);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  const canvas = page.locator(".room-canvas canvas");
  await expect(canvas).toHaveAttribute("data-blind-height", "3.6500", {
    timeout: 15000,
  });
  await canvas.evaluate((element) => {
    const heights: number[] = [];
    const observer = new MutationObserver(() => {
      const height = Number(element.getAttribute("data-blind-height"));
      heights.push(height);
      element.setAttribute("data-blind-trace", JSON.stringify(heights));
      if (height < 1.9761) observer.disconnect();
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-blind-height"],
    });
  });
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-blind-height", "1.9760", {
    timeout: 15000,
  });
  const heights: number[] = JSON.parse(
    (await canvas.getAttribute("data-blind-trace"))!,
  );
  expect(
    new Set(heights.filter((height) => height > 1.9761 && height < 3.6499))
      .size,
  ).toBeGreaterThan(2);
  expect(publicImports).toEqual([]);
  expect(errors).toEqual([]);
});

test("opens and closes the real Blender blind, including under reduced motion", async ({
  page,
}, info) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = page.locator(".room-canvas canvas");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(canvas).toHaveAttribute("data-blind-height", "3.6500", {
    timeout: 15000,
  });
  await canvas.evaluate((element) => {
    const heights: number[] = [];
    const observer = new MutationObserver(() => {
      const height = Number(element.getAttribute("data-blind-height"));
      heights.push(height);
      element.setAttribute("data-blind-trace", JSON.stringify(heights));
      if (height < 1.9761) observer.disconnect();
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-blind-height"],
    });
  });
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-blind-height", "1.9760", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-blind-x", "-2.4000");
  await expect(canvas).toHaveAttribute("data-blind-depth", "-4.9250");
  await expect(canvas).toHaveAttribute("data-blind-tilt", "-1.3963", {
    timeout: 15000,
  });
  const heights: number[] = JSON.parse(
    (await canvas.getAttribute("data-blind-trace"))!,
  );
  expect(
    new Set(heights.filter((height) => height > 1.9761 && height < 3.6499))
      .size,
  ).toBeGreaterThan(2);
  await page.screenshot({ path: info.outputPath("living-night.png") });
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-blind-height", "3.6500", {
    timeout: 15000,
  });
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-blind-height", "1.9760", {
    timeout: 15000,
  });
  await openSettings(page);
  await page.getByRole("button", { name: "Animations" }).click();
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-blind-height", "3.6500", {
    timeout: 15000,
  });
  await page.screenshot({ path: info.outputPath("living-day.png") });
});

test("plays foliage wind, device lights, notifications and typing, and stops them for reduced motion", async ({
  page,
}, info) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "no-preference" });
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
    { timeout: 30000 },
  );
  await expect(canvas).toHaveAttribute("data-controller-glow", /[\d.]+/, {
    timeout: 15000,
  });
  const glow = await canvas.getAttribute("data-controller-glow");
  const rack = await canvas.getAttribute("data-rack-activity");
  await Promise.all([
    expect(canvas).not.toHaveAttribute("data-controller-glow", glow!, {
      timeout: 20000,
    }),
    expect(canvas).not.toHaveAttribute("data-rack-activity", rack!, {
      timeout: 20000,
    }),
    expect
      .poll(
        async () => Number(await canvas.getAttribute("data-foliage-wind")),
        {
          timeout: 45000,
        },
      )
      .not.toBe(0),
    expect(canvas).toHaveAttribute("data-phone-notification", "1.00000", {
      timeout: 45000,
    }),
    expect
      .poll(
        async () => Number(await canvas.getAttribute("data-blind-breeze")),
        { timeout: 45000 },
      )
      .not.toBe(0),
    expect
      .poll(
        async () => Number(await canvas.getAttribute("data-screen-typing")),
        { timeout: 45000 },
      )
      .toBeGreaterThan(0.1),
  ]);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-screen-typing")), {
      timeout: 45000,
    })
    .toBeLessThan(0.001);
  await page.screenshot({ path: info.outputPath("living-ambient.png") });
  await openSettings(page);
  await page.getByRole("button", { name: "Animations" }).click();
  await expect(canvas).toHaveAttribute("data-phone-notification", "1.00000", {
    timeout: 10000,
  });
  await expect(canvas).toHaveAttribute("data-editor-reading", "true");
  await expect(canvas).toHaveAttribute("data-foliage-wind", "0.00000");
  await expect(canvas).toHaveAttribute("data-blind-breeze", "0.00000", {
    timeout: 10000,
  });
  expect(errors).toEqual([]);
});

test("matches editor themes in and out of monitor focus and restores readable reduced motion", async ({
  page,
}, info) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const canvas = page.locator(".room-canvas canvas");
  await expect(page.locator(".room-canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(canvas).toHaveAttribute("data-editor-theme", "day", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-editor-reading", "false");
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-editor-theme", "night", {
    timeout: 15000,
  });
  await openNavigation(page);
  await page.locator('a[href="#room/monitor"]').first().click();
  await expect(canvas).toHaveAttribute("data-editor-reading", "true", {
    timeout: 15000,
  });
  await page.waitForTimeout(1200);
  const paused = await canvas.getAttribute("data-screen-typing");
  await openSettings(page);
  await page.getByRole("button", { name: "Basculer jour / nuit" }).click();
  await expect(canvas).toHaveAttribute("data-editor-theme", "day", {
    timeout: 15000,
  });
  expect(await canvas.getAttribute("data-screen-typing")).toBe(paused);
  await page.locator(".settings-menu summary").click();
  await page.screenshot({ path: info.outputPath("editor-focused-day.png") });
  await page.locator("[data-room-back]").click();
  await expect(canvas).toHaveAttribute("data-editor-reading", "false", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-camera-moving", "false", {
    timeout: 60000,
  });
  await openSettings(page);
  await page.getByRole("button", { name: "Animations", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-editor-reading", "true", {
    timeout: 15000,
  });
  expect(errors).toEqual([]);
});
