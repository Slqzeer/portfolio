import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-motion", "reduced");
    localStorage.setItem(
      "portfolio-preferences",
      JSON.stringify({ locale: "en", lighting: "day" }),
    );
  });
  await page.goto(process.argv[2] ?? "http://127.0.0.1:5174");
  await page
    .locator('.room-canvas[data-ready="true"]')
    .waitFor({ timeout: 60000 });
  await page.getByRole("button", { name: "Explore the room" }).click();
  await page.screenshot({ path: "public/assets/projects/portfolio-room.png" });
  await page.getByLabel("Visit settings").click();
  await page.getByRole("button", { name: "Toggle day / night" }).click();
  await page.getByLabel("Visit settings").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "public/assets/projects/portfolio-night.png" });
} finally {
  await browser.close();
}
