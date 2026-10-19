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
        state: {
          camera: PerspectiveCamera | OrthographicCamera;
          size: { width: number; height: number };
        },
        delta: number,
      ) => void)
    | undefined,
  camera: undefined as PerspectiveCamera | OrthographicCamera | undefined,
  canvas: undefined as HTMLCanvasElement | undefined,
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (
    callback: (
      state: {
        camera: PerspectiveCamera | OrthographicCamera;
        size: { width: number; height: number };
      },
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

function advance(delta: number) {
  fiber.frame!(
    { camera: fiber.camera!, size: fiber.canvas!.getBoundingClientRect() },
    delta,
  );
}

function anchor(name: string, position: [number, number, number]) {
  const object =
    name === "CAM_Overview" ? new PerspectiveCamera() : new Object3D();
  object.name = name;
  object.position.set(...position);
  object.updateMatrixWorld();
  return object;
}

describe("CameraRig", () => {
  it("does not skip the approach after a slow frame", () => {
    const onArrive = vi.fn();
    const anchors = {
      CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
      CAM_Anchor_Desk: anchor("CAM_Anchor_Desk", [2, 2, 8]),
      CAM_Anchor_Monitor: anchor("CAM_Anchor_Monitor", [4, 2, 5]),
    };
    render(
      <CameraRig
        activeObject="monitor"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled={false}
        onArrive={onArrive}
      />,
    );
    const start = fiber.camera!.position.clone();
    advance(0.8);
    expect(fiber.camera!.position.distanceTo(start)).toBeLessThan(0.1);
    expect(onArrive).not.toHaveBeenCalled();
  });

  it("advances the whole card and scene layout on the camera clock", () => {
    const main = document.createElement("main");
    const scene = document.createElement("section");
    scene.className = "room-scene";
    scene.append(fiber.canvas!);
    const panel = document.createElement("aside");
    panel.className = "object-details";
    main.append(scene, panel);
    document.body.append(main);
    const layoutAnimation = {
      pause: vi.fn(),
      play: vi.fn(),
      finish: vi.fn(),
      currentTime: 0,
      effect: { getTiming: () => ({ delay: 0, duration: 1100 }) },
    };
    const cardAnimation = {
      pause: vi.fn(),
      play: vi.fn(),
      finish: vi.fn(),
      currentTime: 0,
      effect: { getTiming: () => ({ delay: 0, duration: 800 }) },
    };
    scene.getAnimations = () => [layoutAnimation as unknown as Animation];
    panel.getAnimations = () => [cardAnimation as unknown as Animation];
    const { unmount } = render(
      <CameraRig
        activeObject="monitor"
        anchors={{
          CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
          CAM_Anchor_Desk: anchor("CAM_Anchor_Desk", [2, 2, 8]),
          CAM_Anchor_Monitor: anchor("CAM_Anchor_Monitor", [4, 2, 5]),
        }}
        reducedMotion={false}
        pointerEnabled={false}
      />,
    );
    expect(layoutAnimation.pause).toHaveBeenCalled();
    expect(cardAnimation.pause).toHaveBeenCalled();
    for (let frame = 0; frame < 24; frame++) advance(1 / 60);
    expect(layoutAnimation.currentTime / 1100).toBeCloseTo(0.4 / 1.1);
    expect(cardAnimation.currentTime / 800).toBeCloseTo(0.4 / 1.1);
    advance(0.8);
    expect(layoutAnimation.currentTime / 1100).toBeCloseTo(0.45 / 1.1);
    expect(cardAnimation.currentTime / 800).toBeCloseTo(0.45 / 1.1);
    for (let frame = 0; frame < 45; frame++) advance(1 / 60);
    expect(layoutAnimation.finish).toHaveBeenCalledOnce();
    expect(cardAnimation.finish).toHaveBeenCalledOnce();
    unmount();
    expect(cardAnimation.play).toHaveBeenCalled();
    main.remove();
  });

  it("arrives once after finite travel and cancels an interrupted arrival", () => {
    const onArrive = vi.fn();
    const anchors = {
      CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
      CAM_Anchor_Desk: anchor("CAM_Anchor_Desk", [2, 2, 8]),
      CAM_Anchor_Monitor: anchor("CAM_Anchor_Monitor", [4, 2, 5]),
      CAM_Anchor_Homelab: anchor("CAM_Anchor_Homelab", [-3, 2, 6]),
    };
    const { rerender } = render(
      <CameraRig
        activeObject="monitor"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
        transitionId={1}
        onArrive={onArrive}
      />,
    );
    for (let frame = 0; frame < 24; frame++) advance(1 / 60);
    expect(onArrive).not.toHaveBeenCalled();
    rerender(
      <CameraRig
        activeObject="server"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled
        transitionId={2}
        onArrive={onArrive}
      />,
    );
    for (let frame = 0; frame < 90; frame++) advance(1 / 60);
    expect(onArrive.mock.calls).toEqual([[2]]);
    expect(fiber.camera!.position.toArray()).toEqual([-3, 2, 6]);
    advance(1);
    expect(onArrive).toHaveBeenCalledOnce();
  });

  it("jumps to the final pose on reduced motion without visiting waypoints", () => {
    const onArrive = vi.fn();
    const anchors = {
      CAM_Overview: anchor("CAM_Overview", [0, 0, 10]),
      CAM_Anchor_Desk: anchor("CAM_Anchor_Desk", [2, 2, 8]),
      CAM_Anchor_Monitor: anchor("CAM_Anchor_Monitor", [4, 2, 5]),
    };
    render(
      <CameraRig
        activeObject="monitor"
        anchors={anchors}
        reducedMotion
        pointerEnabled={false}
        transitionId={1}
        onArrive={onArrive}
      />,
    );
    advance(1 / 60);
    expect(fiber.camera!.position.toArray()).toEqual([4, 2, 5]);
    expect(onArrive).toHaveBeenCalledWith(1);
  });

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

  it("finishes a resizing return at the final overview framing", () => {
    fiber.camera = new OrthographicCamera();
    setCanvasSize(800, 900);
    const overview = anchor("CAM_Overview", [0, 0, 10]);
    overview.userData.ortho_scale = 20;
    const desk = anchor("CAM_Anchor_Desk", [2, 2, 8]);
    desk.userData.ortho_scale = 7.4;
    const anchors = { CAM_Overview: overview, CAM_Anchor_Desk: desk };
    const { rerender } = render(
      <CameraRig
        activeObject="desk"
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled={false}
      />,
    );
    for (let frame = 0; frame < 70; frame++) advance(1 / 60);
    rerender(
      <CameraRig
        activeObject={null}
        anchors={anchors}
        reducedMotion={false}
        pointerEnabled={false}
      />,
    );
    setCanvasSize(1800, 700);
    for (let frame = 0; frame < 55; frame++) advance(1 / 60);
    expect(fiber.camera.zoom).toBeCloseTo(frameZoom(20, 1800, 700));
    const arrivedZoom = fiber.camera.zoom;
    advance(1 / 60);
    expect(fiber.camera.zoom).toBeCloseTo(arrivedZoom);
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
    advance(1 / 60);
    const movedX = fiber.camera!.position.x;
    expect(movedX).toBeGreaterThan(0);
    expect(fiber.camera!.position.y).toBeGreaterThan(0);

    fiber.canvas!.dispatchEvent(new MouseEvent("pointerleave"));
    advance(1 / 60);
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
      advance(1 / 60);
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
      advance(1 / 60);
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

    advance(1 / 60);

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

    advance(1 / 60);

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

    advance(1 / 60);

    expect((fiber.camera as OrthographicCamera).zoom).toBeCloseTo(
      frameZoom(7.4, 1280, 720),
    );
  });

  it.each([
    [1280, 720, 850, 720],
    [390, 844, 390, 388],
  ])(
    "keeps focus in the clear %dx%d frame while rendering behind details",
    (width, height, clearWidth, clearHeight) => {
      setCanvasSize(width, height);
      const camera = new OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
      );
      fiber.camera = camera;
      const scene = document.createElement("section");
      scene.className = "room-scene";
      const frame = document.createElement("div");
      frame.className = "room-frame";
      vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
        ...fiber.canvas!.getBoundingClientRect(),
        width: clearWidth,
        height: clearHeight,
      });
      scene.append(frame, fiber.canvas!);
      document.body.append(scene);
      const desk = anchor("CAM_Anchor_Desk", [1, 2, 3]);
      desk.userData.ortho_scale = 7.4;
      const { unmount } = render(
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
      advance(1 / 60);
      camera.updateMatrixWorld();
      const focus = new Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
        .project(camera);
      expect(focus.x).toBeCloseTo(-(width - clearWidth) / width);
      expect(focus.y).toBeCloseTo((height - clearHeight) / height);
      expect(camera.zoom).toBeCloseTo(frameZoom(7.4, clearWidth, clearHeight));
      unmount();
      scene.remove();
    },
  );

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
      advance(1 / 60);
    }

    expect(fiber.camera!.position.x).toBeCloseTo(0, 5);
  });
});
