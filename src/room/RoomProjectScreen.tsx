import { useEffect } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  TextureLoader,
} from "three";

export function RoomProjectScreen({
  scene,
  src,
}: {
  scene: Object3D;
  src?: string;
}) {
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const surfaces = ["Editor_monitor_day", "Editor_monitor_night"].flatMap(
      (name) => {
        const mesh = scene.getObjectByName(name);
        return mesh instanceof Mesh &&
          mesh.material instanceof MeshStandardMaterial
          ? [
              {
                material: mesh.material,
                map: mesh.material.map,
                emissiveMap: mesh.material.emissiveMap,
              },
            ]
          : [];
      },
    );
    const texture = new TextureLoader().load(
      src,
      (loaded) => {
        if (cancelled) return;
        loaded.name = src;
        loaded.colorSpace = SRGBColorSpace;
        loaded.flipY = false;
        surfaces.forEach(({ material }) => {
          material.map = material.emissiveMap = loaded;
          material.needsUpdate = true;
        });
      },
      undefined,
      () => {
        // Keep the authored editor visible if a preview cannot be loaded.
      },
    );
    return () => {
      cancelled = true;
      surfaces.forEach(({ material, map, emissiveMap }) => {
        material.map = map;
        material.emissiveMap = emissiveMap;
        material.needsUpdate = true;
      });
      texture.dispose();
    };
  }, [scene, src]);
  return null;
}
