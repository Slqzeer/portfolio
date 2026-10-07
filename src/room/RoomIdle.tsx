import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Material, Mesh, Object3D } from "three";

export interface RoomIdleProps {
  scene: Object3D;
  paused: boolean;
  reducedMotion: boolean;
}

function materialsOf(object?: Object3D) {
  if (!(object instanceof Mesh)) return [];
  return (
    Array.isArray(object.material) ? object.material : [object.material]
  ) as Array<Material & { emissiveIntensity?: number }>;
}

function setEmission(object: Object3D | undefined, value: number) {
  for (const material of materialsOf(object)) {
    if (typeof material.emissiveIntensity === "number") {
      material.emissiveIntensity = value;
    }
  }
}

export function RoomIdle({ scene, paused, reducedMotion }: RoomIdleProps) {
  const targets = useMemo(
    () => ({
      cursor: scene.getObjectByName("IDLE_Monitor_Cursor"),
      screen: scene.getObjectByName("Monitor_Screen"),
      rack: scene.children
        .flatMap((child) => {
          const matches: Object3D[] = [];
          child.traverse((object) => {
            if (object.name.startsWith("EMIT_Rack_")) matches.push(object);
          });
          return matches;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
      phone: scene.getObjectByName("EMIT_Smartphone"),
      curtains: [
        scene.getObjectByName("Curtain_Left"),
        scene.getObjectByName("Curtain_Right"),
      ].filter((object): object is Object3D => Boolean(object)),
    }),
    [scene],
  );
  const curtainBase = useMemo(
    () => targets.curtains.map(({ rotation }) => rotation.z),
    [targets.curtains],
  );

  useFrame(({ clock }) => {
    if (paused || reducedMotion) return;
    const time = clock.elapsedTime;
    if (targets.cursor) targets.cursor.visible = Math.floor(time * 2) % 2 === 1;
    setEmission(targets.screen, 1 + Math.sin(time * 0.7) * 0.06);
    targets.rack.forEach((light, index) =>
      setEmission(light, 1 + Math.sin(time * 2 + index * 0.7) * 0.45),
    );
    const notificationPhase = time % 12;
    setEmission(
      targets.phone,
      1 +
        (notificationPhase < 1.2
          ? Math.sin((notificationPhase / 1.2) * Math.PI) * 1.4
          : 0),
    );
    targets.curtains.forEach((curtain, index) => {
      curtain.rotation.z =
        curtainBase[index] + Math.sin(time * 0.35 + index * Math.PI) * 0.006;
    });
  });

  return null;
}
