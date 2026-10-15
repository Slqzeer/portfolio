import { render } from "@testing-library/react";
import {
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraRig, frameZoom } from "./CameraRig";

const fiber = vi.hoisted(() => ({
  frame: undefined as
    | ((
        state: { camera: PerspectiveCamera | OrthographicCamera },
        delta: number,
      ) => void)
    | undefined,
  camera: undefined as PerspectiveCamera | OrthographicCamera | undefined,
  canvas: undefined as HTMLCanvasElement | undefined,
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (
    callback: (
      state: { camera: PerspectiveCamera | OrthographicCamera },
      delta: number,
    ) => void,
  ) => {
    fiber.frame = callback;
  },
  useThree: (
    selector: (state: {
      camera: PerspectiveCamera | OrthographicCamera;
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
  const setCanvasSize = (width: number, height: number) =>
    vi.spyOn(fiber.canvas!, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => undefined,
    });

  beforeEach(() => {
    fiber.camera = new PerspectiveCamera();
    fiber.canvas = document.createElement("canvas");
    setCanvasSize(1280, 720);
  });

  it("follows the pointer around overview and settles back on leave", () => {
    const overview = new PerspectiveCamera();
    overview.position.set(0, 0, 10);
    overview.updateMatrixWorld();
    const anchors = { CAM_Overview: overview };
    render(
      <CameraRig
        activeObject={null}
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
      />,
    );

    fiber.canvas!.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 1280, clientY: 0 }),
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

  it("aims along a Blender empty's local -Y axis", () => {
    const desk = anchor("CAM_Anchor_Desk", [1, 2, 3]);
    desk.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    desk.updateMatrixWorld();
    render(
      <CameraRig
        activeObject="desk"
        anchors={{
          CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
          CAM_Anchor_Desk: desk,
        }}
        reducedMotion
        pointerEnabled={false}
      />,
    );

    fiber.frame!({ camera: fiber.camera! }, 1 / 60);

    const looking = fiber.camera!.getWorldDirection(new Vector3());
    const aim = new Vector3(0, -1, 0).applyQuaternion(desk.quaternion);
    expect(looking.dot(aim)).toBeCloseTo(1, 5);
  });

  it("uses an exported camera's orientation unchanged", () => {
    const overview = new OrthographicCamera();
    overview.name = "CAM_Overview";
    overview.position.set(0, 0, 10);
    overview.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -0.4);
    overview.updateMatrixWorld();
    render(
      <CameraRig
        activeObject={null}
        anchors={{ CAM_Overview: overview }}
        reducedMotion
        pointerEnabled={false}
      />,
    );

    fiber.frame!({ camera: fiber.camera! }, 1 / 60);

    expect(
      fiber.camera!.quaternion.angleTo(
        overview.getWorldQuaternion(new Quaternion()),
      ),
    ).toBeCloseTo(0, 5);
  });

  it("frames each anchor's exported width at any viewport", () => {
    expect(frameZoom(7.4, 1480, 1000)).toBeCloseTo(200);
    expect(frameZoom(16, 1600, 450)).toBeCloseTo(50);
    expect(frameZoom(7.4, 390, 844)).toBeCloseTo(390 / 7.4);

    fiber.camera = new OrthographicCamera();
    const desk = anchor("CAM_Anchor_Desk", [1, 2, 3]);
    desk.userData.ortho_scale = 7.4;
    render(
      <CameraRig
        activeObject="desk"
        anchors={{
          CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
          CAM_Anchor_Desk: desk,
        }}
        reducedMotion
        pointerEnabled={false}
      />,
    );

    fiber.frame!({ camera: fiber.camera! }, 1 / 60);

    expect((fiber.camera as OrthographicCamera).zoom).toBeCloseTo(
      frameZoom(7.4, 1280, 720),
    );
  });

  it("disables pointer follow on narrow screens", () => {
    setCanvasSize(390, 844);
    render(
      <CameraRig
        activeObject={null}
        anchors={{ CAM_Overview: anchor("CAM_Overview", [0, 0, 10]) }}
        reducedMotion={false}
        pointerEnabled
      />,
    );

    fiber.canvas!.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 390, clientY: 0 }),
    );
    for (let frame = 0; frame < 30; frame += 1) {
      fiber.frame!({ camera: fiber.camera! }, 1 / 60);
    }

    expect(fiber.camera!.position.x).toBeCloseTo(0, 5);
  });
});
