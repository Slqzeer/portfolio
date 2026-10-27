import { expect, test } from "@playwright/test";
import { openNavigation, openSettings } from "./controls";

test("reading projects and closing does not reopen Explorer", async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 960, height: 700 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await openSettings(page);
  await page
    .getByRole("button", { name: "Lecture rapide", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fermer", exact: true })
    .click();
  await openNavigation(page);
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets", exact: true })
    .click();
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "INTERACT",
    { timeout: 60000 },
  );
  const panel = page.getByRole("dialog", { name: "Projets", exact: true });
  for (const category of ["Data & IA", "Logiciel"]) {
    await panel
      .getByRole("button", { name: new RegExp(`^${category}`) })
      .click();
    const projects = panel.locator(".project-list button");
    const count = await projects.count();
    if (count) {
      for (let index = 0; index < count; index++) {
        await projects.nth(index).click();
        await panel.getByText("Découvrir le projet", { exact: true }).click();
      }
    } else {
      await panel.getByText("Découvrir le projet", { exact: true }).click();
    }
  }
  await panel.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(page.getByRole("main")).toHaveAttribute(
    "data-navigation-phase",
    "ROOM",
    { timeout: 60000 },
  );
  await expect(page.locator(".room-menu")).not.toHaveAttribute("open");
  await expect(
    page.getByLabel("Toutes les rubriques", { exact: true }),
  ).toBeFocused();
});
