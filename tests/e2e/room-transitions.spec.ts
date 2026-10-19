import { expect, test } from "@playwright/test";
import { openNavigation } from "./controls";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`slides information alongside the camera at ${viewport.width}px`, async ({
    page,
  }, info) => {
    test.slow();
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".room-canvas")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: "Explorer la chambre" }).click();
    await expect
      .poll(() =>
        page
          .locator(".room-scene")
          .evaluate((node) => node.getAnimations().length),
      )
      .toBe(0);
    await page.screenshot({ path: info.outputPath("overview.png") });
    await openNavigation(page);
    await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const observer = new MutationObserver(() => {
        if (main.dataset.navigationPhase !== "FOCUS") return;
        observer.disconnect();
        const panel = document.querySelector<HTMLElement>(".object-details")!;
        main.dataset.panelDuringApproach = panel?.dataset.open ?? "missing";
        const positions: number[] = [];
        const sample = () => {
          const bounds = panel.getBoundingClientRect();
          positions.push(window.innerWidth > 760 ? bounds.x : bounds.y);
          main.dataset.panelPositions = JSON.stringify(positions);
          const cardSlide = panel
            .getAnimations()
            .find(
              (animation) =>
                (animation as CSSTransition).transitionProperty === "transform",
            );
          const layoutSlide = document
            .querySelector(".room-scene")!
            .getAnimations()
            .find(
              (animation) =>
                (animation as CSSTransition).transitionProperty ===
                (window.innerWidth > 760 ? "right" : "bottom"),
            );
          if (cardSlide && layoutSlide) {
            const progress = (animation: Animation) => {
              const timing = animation.effect!.getComputedTiming();
              return Number(animation.currentTime) / Number(timing.endTime);
            };
            const drift = Math.abs(progress(cardSlide) - progress(layoutSlide));
            main.dataset.timelineDrift = String(
              Math.max(Number(main.dataset.timelineDrift ?? 0), drift),
            );
          }
          if (main.dataset.navigationPhase === "FOCUS")
            requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      observer.observe(main, {
        attributes: true,
        attributeFilter: ["data-navigation-phase"],
      });
    });
    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Projets" })
      .click();
    const main = page.getByRole("main");
    await expect(main).toHaveAttribute("data-panel-during-approach", "true");
    await expect(main).toHaveAttribute("data-navigation-phase", "INTERACT", {
      timeout: 20000,
    });
    const panel = page.getByRole("dialog", { name: "Projets" });
    await expect(main).toHaveAttribute("data-timeline-drift", /\d/);
    expect(Number(await main.getAttribute("data-timeline-drift"))).toBeLessThan(
      0.02,
    );
    await expect(panel).toHaveCSS("border-top-left-radius", /^(18|20)px$/);
    await expect(panel).toHaveCSS("opacity", "1");
    await expect(panel).toBeInViewport();
    await expect(
      page.getByRole("heading", { name: "Projets", exact: true }),
    ).toBeFocused();
    await expect
      .poll(() =>
        page
          .locator(".room-scene")
          .evaluate((node) => node.getAnimations().length),
      )
      .toBe(0);
    const positions: number[] = JSON.parse(
      (await main.getAttribute("data-panel-positions"))!,
    );
    expect(new Set(positions.map(Math.round)).size).toBeGreaterThan(1);
    const roomBounds = (await page.locator(".room-scene").boundingBox())!;
    const panelBounds = (await panel.boundingBox())!;
    if (viewport.width > 760) {
      expect(roomBounds.width).toBeGreaterThan(viewport.width * 0.6);
      expect(roomBounds.x + roomBounds.width).toBeLessThanOrEqual(
        panelBounds.x,
      );
    } else {
      expect(roomBounds.y + roomBounds.height).toBeLessThanOrEqual(
        panelBounds.y + 1,
      );
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole("banner")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath("projects.png") });
    await expect(page.getByRole("banner")).toBeInViewport({ ratio: 1 });

    await panel.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".object-details")).toHaveAttribute("inert", "");
    await expect(main).toHaveAttribute("data-navigation-phase", "ROOM", {
      timeout: 20000,
    });
    await expect(page.locator(".object-details")).toHaveCSS(
      "visibility",
      "hidden",
    );
  });
}
