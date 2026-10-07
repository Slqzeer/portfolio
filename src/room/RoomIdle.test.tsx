import { render } from "@testing-library/react";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { describe, expect, it, vi } from "vitest";
import { RoomIdle } from "./RoomIdle";

const fiber = vi.hoisted(() => ({
  frame: undefined as
    ((state: { clock: { elapsedTime: number } }) => void) | undefined,
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: (state: { clock: { elapsedTime: number } }) => void) => {
    fiber.frame = callback;
  },
}));

function mesh(name: string) {
  const object = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  object.name = name;
  return object;
}

function createScene() {
  const scene = new Group();
  for (const name of [
    "IDLE_Monitor_Cursor",
    "Monitor_Screen",
    "EMIT_Rack_00_00",
    "EMIT_Rack_00_01",
    "EMIT_Smartphone",
    "Curtain_Left",
    "Curtain_Right",
    "INT_Volleyball",
    "INT_Diploma",
    "DeskDecoration",
  ]) {
    scene.add(
      name === "IDLE_Monitor_Cursor"
        ? Object.assign(new Object3D(), { name })
        : mesh(name),
    );
  }
  return scene;
}

describe("RoomIdle", () => {
  it("updates only the bounded named idle targets", () => {
    const scene = createScene();
    const cursor = scene.getObjectByName("IDLE_Monitor_Cursor")!;
    const screen = scene.getObjectByName("Monitor_Screen") as Mesh;
    const rack = scene.getObjectByName("EMIT_Rack_00_00") as Mesh;
    const phone = scene.getObjectByName("EMIT_Smartphone") as Mesh;
    const curtain = scene.getObjectByName("Curtain_Left")!;
    const staticObjects = [
      scene.getObjectByName("INT_Volleyball")!,
      scene.getObjectByName("INT_Diploma")!,
      scene.getObjectByName("DeskDecoration")!,
    ];
    const staticRotations = staticObjects.map((object) =>
      object.rotation.clone(),
    );

    render(<RoomIdle scene={scene} paused={false} reducedMotion={false} />);
    fiber.frame!({ clock: { elapsedTime: 12.25 } });

    expect(cursor.visible).toBe(false);
    expect(
      (screen.material as MeshStandardMaterial).emissiveIntensity,
    ).not.toBe(1);
    expect((rack.material as MeshStandardMaterial).emissiveIntensity).not.toBe(
      1,
    );
    expect(
      (phone.material as MeshStandardMaterial).emissiveIntensity,
    ).toBeGreaterThan(1);
    expect(curtain.rotation.z).not.toBe(0);
    staticObjects.forEach((object, index) =>
      expect(object.rotation.equals(staticRotations[index])).toBe(true),
    );
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    "suppresses updates when paused=%s or reduced=%s",
    (paused, reducedMotion) => {
      const scene = createScene();
      const rack = scene.getObjectByName("EMIT_Rack_00_00") as Mesh;
      render(
        <RoomIdle
          scene={scene}
          paused={paused}
          reducedMotion={reducedMotion}
        />,
      );

      fiber.frame!({ clock: { elapsedTime: 12.25 } });
      expect((rack.material as MeshStandardMaterial).emissiveIntensity).toBe(1);
    },
  );
});
