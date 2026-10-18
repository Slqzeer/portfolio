import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { AnimationClip, Group, Object3D, VectorKeyframeTrack } from "three";
import { describe, expect, it, vi } from "vitest";
import { RoomIdle, type RoomIdleProps } from "./RoomIdle";

const fiber = vi.hoisted(() => ({
  frame: undefined as ((state: unknown, delta: number) => void) | undefined,
}));
vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: typeof fiber.frame) => {
    fiber.frame = callback;
  },
}));

function setup() {
  const scene = new Group();
  const ball = new Object3D();
  ball.name = "INT_Volleyball";
  scene.add(ball);
  const decoration = new Object3D();
  decoration.name = "Plant_Large_Leaves";
  scene.add(decoration);
  const clip = new AnimationClip("Hover_volleyball", 0.6, [
    new VectorKeyframeTrack(
      "INT_Volleyball.position",
      [0, 0.2, 0.6],
      [0, 0, 0, 0, 0.07, 0, 0, 0, 0],
    ),
  ]);
  const props: RoomIdleProps = {
    scene,
    animations: [clip],
    paused: false,
    reducedMotion: false,
  };
  return { props, ball, decoration };
}
const advance = (count = 1) => {
  for (let i = 0; i < count; i++) fiber.frame!({}, 0.1);
};

describe("Blender animation playback", () => {
  it("plays the authored ambient clip, suspends exterior wind at night and restores rest for reduced motion", () => {
    const { props, ball } = setup();
    const ambient = new AnimationClip("Ambient_Exterior_Wind", 1, [
      new VectorKeyframeTrack(
        "INT_Volleyball.position",
        [0, 0.5, 1],
        [0, 0, 0, 0, 0.1, 0, 0, 0, 0],
      ),
    ]);
    props.animations = [ambient];
    const { rerender } = render(<RoomIdle {...props} />);
    advance(2);
    expect(ball.position.y).toBeGreaterThan(0);
    rerender(<RoomIdle {...props} lighting="night" />);
    expect(ball.position.y).toBe(0);
    rerender(<RoomIdle {...props} lighting="day" />);
    advance(2);
    expect(ball.position.y).toBeGreaterThan(0);
    rerender(<RoomIdle {...props} reducedMotion />);
    expect(ball.position.y).toBe(0);
  });
  it("plays only the exported hover clip once and returns to rest", () => {
    const { props, ball, decoration } = setup();
    const { rerender } = render(<RoomIdle {...props} />);
    advance(2);
    expect(ball.position.y).toBe(0);
    rerender(<RoomIdle {...props} hoveredObject="volleyball" />);
    advance(2);
    expect(ball.position.y).toBeCloseTo(0.07);
    expect(decoration.rotation.toArray()).toEqual([0, 0, 0, "XYZ"]);
    advance(20);
    expect(ball.position.y).toBe(0);
  });

  it("pauses without a hidden-tab time jump and restores rest on reduced motion", () => {
    const { props, ball } = setup();
    const { rerender } = render(
      <RoomIdle {...props} hoveredObject="volleyball" />,
    );
    advance();
    const before = ball.position.y;
    rerender(<RoomIdle {...props} hoveredObject="volleyball" paused />);
    advance(100);
    expect(ball.position.y).toBe(before);
    rerender(<RoomIdle {...props} hoveredObject="volleyball" />);
    fiber.frame!({}, 100);
    expect(ball.position.y).toBeCloseTo(0.07);
    rerender(<RoomIdle {...props} hoveredObject="volleyball" reducedMotion />);
    expect(ball.position.y).toBe(0);
    advance(10);
    expect(ball.position.y).toBe(0);
  });

  it("restores the authored pose on leave and still works after StrictMode cleanup", () => {
    const { props, ball } = setup();
    const { rerender } = render(
      <StrictMode>
        <RoomIdle {...props} hoveredObject="volleyball" />
      </StrictMode>,
    );
    advance(2);
    expect(ball.position.y).toBeCloseTo(0.07);
    rerender(
      <StrictMode>
        <RoomIdle {...props} />
      </StrictMode>,
    );
    expect(ball.position.y).toBe(0);
  });
});
