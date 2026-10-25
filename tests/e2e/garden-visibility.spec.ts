import { expect, test } from "@playwright/test";

test("the exported garden meshes cannot render outside the window", async ({
  page,
}) => {
  await page.goto("/");
  await expect(async () => {
    const result = await page.evaluate(async () => {
      const fixture = "/tests/fixtures/renderGarden.ts";
      return (await import(fixture)).renderGarden();
    });
    expect(result.coverage.window).toBeGreaterThan(0);
    expect(result.coverage["beside-window"], JSON.stringify(result)).toBe(0);
    expect(result.coverage["outside-room"], JSON.stringify(result)).toBe(0);
  }).toPass({ timeout: 20_000 });
});

test("garden is visible only through the window for changing cameras", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/garden-aperture-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("/garden-aperture-test");
  const coverage = await page.evaluate(async () => {
    const threeUrl = "/node_modules/three/build/three.module.js";
    const portalUrl = "/src/room/gardenPortal.ts";
    const T = await import(threeUrl);
    const { clipGardenMaterial } = await import(portalUrl);
    const renderer = new T.WebGLRenderer({ alpha: true });
    renderer.setSize(64, 64);
    renderer.setClearColor(0, 0);
    const target = new T.WebGLRenderTarget(64, 64);
    const scene = new T.Scene();
    const material = new T.MeshBasicMaterial({
      color: 0xffffff,
      side: T.DoubleSide,
    });
    clipGardenMaterial(material);
    const plane = new T.Mesh(new T.PlaneGeometry(40, 40), material);
    plane.position.z = -7;
    scene.add(plane);
    const samples: Record<string, number> = {};
    try {
      for (const perspective of [false, true]) {
        const camera = perspective
          ? new T.PerspectiveCamera(8, 1, 0.1, 100)
          : new T.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100);
        for (const [name, x, y, z, aimX, aimY, aimZ] of [
          ["window", -2.4, 3.3, 0, -2.4, 3.3, -7],
          ["beside-window", 2, 3.3, 0, 2, 3.3, -7],
          ["outside-room", -2.4, 3.3, -6, -2.4, 3.3, -7],
          ["angled-window", -6, 5, 1, -2.4, 3.3, -5.14],
          ["window-return", -2.4, 3.3, 0, -2.4, 3.3, -7],
        ] as const) {
          camera.position.set(x, y, z);
          camera.lookAt(aimX, aimY, aimZ);
          renderer.setRenderTarget(target);
          renderer.render(scene, camera);
          const pixels = new Uint8Array(64 * 64 * 4);
          renderer.readRenderTargetPixels(target, 0, 0, 64, 64, pixels);
          samples[`${perspective ? "perspective" : "ortho"}-${name}`] =
            pixels.filter((value, i) => i % 4 === 3 && value > 0).length /
            (64 * 64);
        }
      }
    } finally {
      target.dispose();
      plane.geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
    return samples;
  });
  for (const [view, fraction] of Object.entries(coverage)) {
    expect(fraction, view).toBe(
      view.includes("window") && !view.includes("beside") ? 1 : 0,
    );
  }
  expect(errors).toEqual([]);
});
