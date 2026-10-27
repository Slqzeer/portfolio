import { describe, expect, it } from "vitest";
import vercelConfig from "../../vercel.json";

describe("Vercel security headers", () => {
  it("allows Three.js to decode embedded GLB textures from blob URLs", () => {
    const contentSecurityPolicy = vercelConfig.headers
      .flatMap(({ headers }) => headers)
      .find(({ key }) => key === "Content-Security-Policy")?.value;

    expect(contentSecurityPolicy).toContain("connect-src 'self' blob:");
  });
});
