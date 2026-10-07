import { render } from "@testing-library/react";
import { Object3D, PerspectiveCamera } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraRig } from "./CameraRig";

const fiber = vi.hoisted(() => ({
  frame: undefined as
    ((state: { camera: PerspectiveCamera }, delta: number) => void) | undefined,
  camera: undefined as PerspectiveCamera | undefined,
  canvas: undefined as HTMLCanvasElement | undefined,
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (
    callback: (state: { camera: PerspectiveCamera }, delta: number) => void,
  ) => {
    fiber.frame = callback;
  },
  useThree: (
    selector: (state: {
      camera: PerspectiveCamera;
      gl: { domElement: HTMLCanvasElement };
    }) => unknown,
  ) => selector({ camera: fiber.camera!, gl: { domElement: fiber.canvas! } }),
}));

function anchor(name: string, position: [number, number, number]) {
  const object = new Object3D();
  object.name = name;
  object.position.set(...position);
  object.updateMatrixWorld();
  return object;
}

describe("CameraRig", () => {
  beforeEach(() => {
    fiber.camera = new PerspectiveCamera();
    fiber.canvas = document.createElement("canvas");
    vi.spyOn(fiber.canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => undefined,
    });
  });

  it("follows the pointer around overview and settles back on leave", () => {
    const anchors = { CAM_Overview: anchor("CAM_Overview", [0, 0, 10]) };
    render(
      <CameraRig
        activeObject={null}
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
      />,
    );

    fiber.canvas!.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 100, clientY: 0 }),
    );
    fiber.frame!({ camera: fiber.camera! }, 1 / 60);
    const movedX = fiber.camera!.position.x;
    expect(movedX).toBeGreaterThan(0);
    expect(fiber.camera!.position.y).toBeGreaterThan(0);

    fiber.canvas!.dispatchEvent(new MouseEvent("pointerleave"));
    fiber.frame!({ camera: fiber.camera! }, 1 / 60);
    expect(fiber.camera!.position.x).toBeLessThan(movedX);
  });

  it("travels to focus anchors and gives controls no camera target", () => {
    const anchors = {
      CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
      CAM_Anchor_Monitor: anchor("CAM_Anchor_Monitor", [4, 2, 5]),
    };
    const { rerender } = render(
      <CameraRig
        activeObject="monitor"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
      />,
    );

    fiber.canvas!.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 100, clientY: 0 }),
    );
    for (let frame = 0; frame < 120; frame += 1) {
      fiber.frame!({ camera: fiber.camera! }, 1 / 60);
    }
    expect(fiber.camera!.position.x).toBeCloseTo(4, 2);
    expect(fiber.camera!.position.y).toBeCloseTo(2, 2);

    fiber.canvas!.dispatchEvent(new MouseEvent("pointerleave"));
    rerender(
      <CameraRig
        activeObject="window"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
      />,
    );
    for (let frame = 0; frame < 120; frame += 1) {
      fiber.frame!({ camera: fiber.camera! }, 1 / 60);
    }
    expect(fiber.camera!.position.x).toBeCloseTo(0, 2);
    expect(fiber.camera!.position.z).toBeCloseTo(10, 2);
  });
});
