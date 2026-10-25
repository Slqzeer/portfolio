import type { Page } from "@playwright/test";

const LIGHTMAP_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const ENV_PIXEL = Buffer.concat([
  Buffer.from("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 8 +X 8\n"),
  ...Array.from({ length: 8 }, () =>
    Buffer.from([2, 2, 0, 8, 136, 128, 136, 128, 136, 128, 136, 129]),
  ),
]);

export async function useLightweightRoomLighting(page: Page) {
  await page.route("**/assets/room/lightmaps/*.webp", (route) =>
    route.fulfill({ body: LIGHTMAP_PIXEL, contentType: "image/png" }),
  );
  await page.route("**/assets/room/env/*.hdr", (route) =>
    route.fulfill({ body: ENV_PIXEL, contentType: "application/octet-stream" }),
  );
}

export async function openNavigation(page: Page) {
  if (
    !(await page
      .locator(".room-menu")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  ) {
    await page.getByLabel(/^(Toutes les rubriques|All sections)$/).click();
  }
}

export async function openSettings(page: Page) {
  if (
    !(await page
      .locator(".settings-menu")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  ) {
    await page.getByLabel(/^(Réglages de la visite|Visit settings)$/).click();
  }
}
