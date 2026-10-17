import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Box3,
  BufferGeometry,
  DataTexture,
  Float32BufferAttribute,
  Object3D,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import type { Lighting } from "../app/appState";

export function RoomAtmosphere({
  scene,
  lighting,
  paused,
  reducedMotion,
}: {
  scene: Object3D;
  lighting: Lighting;
  paused: boolean;
  reducedMotion: boolean;
}) {
  const time = useRef(0);
  const dust = useMemo(() => {
    const window = scene.getObjectByName("EMIT_WindowView");
    const center = window
      ? new Box3().setFromObject(window).getCenter(new Vector3())
      : new Vector3(-2, 3, -3);
    center.z += 0.85;
    const positions = new Float32Array(28 * 3);
    for (let index = 0; index < 28; index++) {
      positions[index * 3] = center.x + Math.sin(index * 17.13) * 1.3;
      positions[index * 3 + 1] = center.y + Math.sin(index * 6.71) * 1.1;
      positions[index * 3 + 2] = center.z + Math.sin(index * 8.31) * 0.65;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const pixel = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const offset = (y * 16 + x) * 4;
        pixel.set(
          [
            255,
            255,
            255,
            Math.round(
              Math.max(0, 1 - Math.hypot(x - 7.5, y - 7.5) / 7.5) ** 2 * 255,
            ),
          ],
          offset,
        );
      }
    const texture = new DataTexture(pixel, 16, 16);
    texture.needsUpdate = true;
    const material = new PointsMaterial({
      map: texture,
      size: 3.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const points = new Points(geometry, material);
    points.raycast = () => undefined;
    return { points, base: positions.slice(), texture };
  }, [scene]);
  useEffect(
    () => () => {
      dust.points.geometry.dispose();
      dust.points.material.dispose();
      dust.texture.dispose();
    },
    [dust],
  );
  useEffect(() => {
    dust.points.material.color.set(lighting === "day" ? "#fff4d6" : "#f2c99d");
    dust.points.material.opacity = lighting === "day" ? 0.32 : 0.12;
  }, [dust, lighting]);
  useFrame((_, delta) => {
    if (paused || reducedMotion) return;
    time.current += Math.min(delta, 0.1);
    const position = dust.points.geometry.getAttribute("position");
    for (let index = 0; index < position.count; index++) {
      position.setXYZ(
        index,
        dust.base[index * 3] + Math.sin(time.current * 0.12 + index) * 0.045,
        dust.base[index * 3 + 1] +
          Math.sin(time.current * 0.18 + index * 2) * 0.075,
        dust.base[index * 3 + 2],
      );
    }
    position.needsUpdate = true;
  });
  return <primitive object={dust.points} visible={!reducedMotion} />;
}
