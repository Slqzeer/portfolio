import { render } from "@testing-library/react";
import { StrictMode } from "react";
import {
  MeshStandardMaterial,
  Mesh,
  AnimationClip,
  Group,
  Object3D,
  VectorKeyframeTrack,
  Texture,
  FileLoader,
} from "three";
import { describe, expect, it, vi } from "vitest";
import {
  RoomLighting,
  lightingFrame,
  createCurtainPlayback,
} from "./RoomLighting";

import { prepareRoomScene, type LightmapKey } from "./preparedRoom";
import { createRoomScene } from "../test/createRoomScene";

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
  it("dims all modeled exterior surfaces with the sky at night", () => {
    const source = createRoomScene();
    const original = new MeshStandardMaterial({
      emissive: "white",
      emissiveIntensity: 0.5,
    });
    const tree = new Mesh(undefined, original);
    tree.name = "Tree";
    tree.userData.exterior_surface = true;
    source.add(tree);
    const room = prepareRoomScene(source);
    const material = (room.scene.getObjectByName("Tree") as Mesh)
      .material as MeshStandardMaterial;
    const { rerender } = render(
      <RoomLighting room={room} animations={[]} lighting="day" reducedMotion />,
    );
    fiber.frame!({}, 0);
    expect(material.emissiveIntensity).toBe(0.5);
    rerender(
      <RoomLighting
        room={room}
        animations={[]}
        lighting="night"
        reducedMotion
      />,
    );
    fiber.frame!({}, 0);
    expect(material.emissiveIntensity).toBeCloseTo(0.0125);
    expect(material.emissive.b).toBeGreaterThan(material.emissive.r);
  });
  it("keeps opening and closing gradual after a slow frame and can reverse mid-transition", () => {
    const source = createRoomScene();
    const sourceSlat = new Object3D();
    sourceSlat.name = "Blind_Slat_37";
    source.add(sourceSlat);
    const room = prepareRoomScene(source);
    const slat = room.scene.getObjectByName(sourceSlat.name)!;
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
          room={room}
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
    // Retain the authored easing while giving the blind a gentler travel time.
    expect(slat.position.y).toBeCloseTo(3.65 + (1.976 - 3.65) * (0.1 / 1.4));
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
    for (let i = 0; i < 15; i++) fiber.frame!({}, 0.1);
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
});
