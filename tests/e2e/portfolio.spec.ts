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
