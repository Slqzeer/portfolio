import { render } from "@testing-library/react";
import { StrictMode } from "react";
import {
  MeshStandardMaterial,
  AnimationClip,
  Group,
  Object3D,
  VectorKeyframeTrack,
  ShaderChunk,
  Texture,
  FileLoader,
  type Material,
  type WebGLRenderer,
} from "three";
import { describe, expect, it, vi } from "vitest";
import {
  RoomLighting,
  IBL_DIFFUSE,
  type LightmapKey,
  applyLightmaps,
  lightingFrame,
  createCurtainPlayback,
} from "./RoomLighting";

const LIGHTMAP_SCALES: Record<LightmapKey, number> = {
  LM_props_day: 2,
  LM_props_night: 3,
  LM_shell_day: 4,
  LM_shell_night: 5,
};

const fiber = vi.hoisted(() => ({
  frame: undefined as ((state: unknown, delta: number) => void) | undefined,
  scaleRequest: undefined as { url: string; responseType: string } | undefined,
}));
vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: typeof fiber.frame) => {
    fiber.frame = callback;
  },
  useLoader: (
    loader: unknown,
    urls: string[] | string,
    configure?: (loader: FileLoader) => void,
  ) => {
    if (loader === FileLoader) {
      const fileLoader = new FileLoader();
      configure?.(fileLoader);
      fiber.scaleRequest = {
        url: urls as string,
        responseType: fileLoader.responseType,
      };
      return LIGHTMAP_SCALES;
    }
    return (urls as string[]).map(() => new Texture());
  },
  useThree: (select: (state: unknown) => unknown) =>
    select({ gl: { capabilities: { getMaxAnisotropy: () => 1 } } }),
}));

describe("RoomLighting", () => {
  it("shades the blind from the environment instead of flattening its slat faces", () => {
    const material = new MeshStandardMaterial();
    material.userData.lightmapAtlas = "blind";
    const environments = { day: new Texture(), night: new Texture() };
    const textures = Object.fromEntries(
      Object.keys(LIGHTMAP_SCALES).map((key) => [key, new Texture()]),
    ) as Record<keyof typeof LIGHTMAP_SCALES, Texture>;
    applyLightmaps(
      [material],
      textures,
      { dayMap: 1, nightMap: 0 },
      LIGHTMAP_SCALES,
      environments,
    );
    const version = material.version;
    expect(material.lightMap).not.toBeNull();
    expect(material.lightMapIntensity).toBe(1);
    expect(material.envMap).toBe(environments.day);
    const shader = {
      fragmentShader: "#include <lights_fragment_maps>",
      uniforms: {},
    } as Parameters<Material["onBeforeCompile"]>[0];
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.fragmentShader).toContain("#include <lights_fragment_maps>");
    applyLightmaps(
      [material],
      textures,
      { dayMap: 0.5, nightMap: 0.5 },
      LIGHTMAP_SCALES,
      environments,
    );
    expect(material.envMapIntensity).toBeCloseTo(0.35);
    expect(material.lightMapIntensity).toBeCloseTo(0.55);
    expect(material.version).toBe(version);
  });
  it("keeps opening and closing gradual after a slow frame and can reverse mid-transition", () => {
    const scene = new Group();
    const slat = new Object3D();
    slat.name = "Blind_Slat_37";
    scene.add(slat);
    const animations = [
      new AnimationClip("Curtain_Blind_Slat_37", 1, [
        new VectorKeyframeTrack(
          "Blind_Slat_37.position",
          [0, 1],
          [0, 3.65, 0, 0, 1.976, 0],
        ),
      ]),
    ];
    const view = (lighting: "day" | "night", reducedMotion = false) => (
      <StrictMode>
        <RoomLighting
          scene={scene}
          animations={animations}
          lighting={lighting}
          reducedMotion={reducedMotion}
        />
      </StrictMode>
    );
    const { rerender } = render(view("day"));
    expect(fiber.scaleRequest).toEqual({
      url: "/assets/room/lightmaps/scales.json",
      responseType: "json",
    });
    fiber.frame!({}, 0);
    rerender(view("night"));
    fiber.frame!({}, 2);
    expect(slat.position.y).toBeGreaterThan(1.9761);
    expect(slat.position.y).toBeLessThan(3.65);
    // The clip owns easing; runtime time must advance at the authored speed.
    expect(slat.position.y).toBeCloseTo(3.65 + (1.976 - 3.65) * 0.1);
    const closingHeight = slat.position.y;
    rerender(view("day"));
    fiber.frame!({}, 0.05);
    expect(slat.position.y).toBeGreaterThan(closingHeight);
    expect(slat.position.y).toBeLessThan(3.65);
    rerender(view("night", true));
    fiber.frame!({}, 0);
    expect(slat.position.y).toBeCloseTo(1.976);
    rerender(view("day"));
    fiber.frame!({}, 2);
    expect(slat.position.y).toBeGreaterThan(1.9761);
    expect(slat.position.y).toBeLessThan(3.65);
    for (let i = 0; i < 10; i++) fiber.frame!({}, 0.1);
    expect(slat.position.y).toBeCloseTo(3.65);
  });
  it("moves the actual blind pose through open/closed and back after cleanup", () => {
    const scene = new Group();
    const slat = new Object3D();
    slat.name = "Blind_Slat_37";
    scene.add(slat);
    const clip = new AnimationClip("Curtain_Blind_Slat_37", 1, [
      new VectorKeyframeTrack(
        "Blind_Slat_37.position",
        [0, 1],
        [0, 3.65, 0, 0, 1.976, 0],
      ),
    ]);
    const curtains = createCurtainPlayback(scene, [clip]);
    curtains.start();
    curtains.sample(0);
    expect(slat.position.y).toBeCloseTo(3.65);
    curtains.sample(0.5);
    expect(slat.position.y).toBeCloseTo((3.65 + 1.976) / 2);
    curtains.sample(1);
    expect(slat.position.y).toBeCloseTo(1.976);
    curtains.stop();
    curtains.start();
    curtains.sample(0);
    expect(slat.position.y).toBeCloseTo(3.65);
    curtains.stop();
  });
  it("finishes day baked-lit with open curtains and no lamp", () => {
    expect(lightingFrame("day", 1)).toMatchObject({
      curtainProgress: 0,
      lamp: 0,
      dayMap: 1,
      nightMap: 0,
    });
  });

  it("crossfades both baked ambiences without a blackout", () => {
    expect(lightingFrame("night", 0.49).lamp).toBeGreaterThan(0);
    expect(lightingFrame("night", 0.5)).toMatchObject({
      dayMap: 0.5,
      nightMap: 0.5,
    });
    expect(lightingFrame("night", 1)).toMatchObject({
      nightMap: 1,
      curtainProgress: 1,
    });
    expect(lightingFrame("night", 1).lamp).toBeGreaterThan(0);
  });

  it("darkens the garden behind the window before the blind closes", () => {
    expect(lightingFrame("day", 1).windowView).toBe(1);
    expect(lightingFrame("night", 0.5).windowView).toBeCloseTo(0.5);
    expect(lightingFrame("night", 1).windowView).toBeCloseTo(0.025);
  });

  it("applies the lit atlas lightmap with its scale", () => {
    const shell = new MeshStandardMaterial();
    shell.userData.lightmapAtlas = "shell";
    const props = new MeshStandardMaterial();
    props.userData.lightmapAtlas = "props";
    const textures = Object.fromEntries(
      Object.keys(LIGHTMAP_SCALES).map((key) => [key, new Texture()]),
    ) as Record<keyof typeof LIGHTMAP_SCALES, Texture>;

    applyLightmaps(
      [shell, props],
      textures,
      { dayMap: 0.5, nightMap: 0 },
      LIGHTMAP_SCALES,
    );
    expect(shell.lightMap).toBe(textures.LM_shell_day);
    // Preserve Blender's calibrated irradiance, including the Lambert π factor.
    expect(shell.lightMapIntensity).toBeCloseTo(
      LIGHTMAP_SCALES.LM_shell_day * 0.5 * Math.PI,
    );

    applyLightmaps(
      [shell, props],
      textures,
      { dayMap: 0, nightMap: 1 },
      LIGHTMAP_SCALES,
    );
    expect(props.lightMap).toBe(textures.LM_props_day);
    expect(props.lightMapIntensity).toBe(0);
    const shader = {
      fragmentShader: "#include <lights_fragment_maps>",
      uniforms: {},
    } as Parameters<Material["onBeforeCompile"]>[0];
    props.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.uniforms.roomNightMap.value).toBe(textures.LM_props_night);
    expect(shader.uniforms.roomNightGain.value).toBeCloseTo(
      LIGHTMAP_SCALES.LM_props_night * Math.PI,
    );
    expect(shader.fragmentShader).not.toContain(IBL_DIFFUSE);
    expect(shader.fragmentShader).toContain("texture2D( roomNightMap");
    applyLightmaps(
      [shell],
      textures,
      { dayMap: 1, nightMap: 0 },
      LIGHTMAP_SCALES,
      undefined,
      {
        day: 0.8,
        night: 1.2,
      },
    );
    expect(shell.lightMapIntensity).toBeCloseTo(
      LIGHTMAP_SCALES.LM_shell_day * 0.8 * Math.PI,
    );
  });

  it("finds the IBL diffuse line it strips from three.js", () => {
    // If a three.js upgrade rewords it, the environment would wash the bake out.
    expect(ShaderChunk.lights_fragment_maps).toContain(IBL_DIFFUSE);
  });
});
