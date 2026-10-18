import type { Page } from "@playwright/test";

export async function openNavigation(page: Page) {
  if (
    !(await page
      .locator(".room-menu")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  ) {
    await page.getByLabel("Toutes les rubriques", { exact: true }).click();
  }
}

export async function openSettings(page: Page) {
  if (
    !(await page
      .locator(".settings-menu")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  ) {
    await page.getByLabel("Réglages de la visite", { exact: true }).click();
  }
}
