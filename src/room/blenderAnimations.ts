import {
  AnimationClip,
  Mesh,
  MeshStandardMaterial,
  NumberKeyframeTrack,
  Object3D,
} from "three";

interface BlenderEmission {
  group: string;
  trigger?: "focus";
  fps: number;
  base: number;
  end: number;
  keys: [number, number][];
}

// Core glTF carries transforms, but not Blender shader socket animations.
// These sampled curves travel as mesh extras and use the same mixer as the GLB.
export function blenderMaterialClips(scene: Object3D): AnimationClip[] {
  const groups = new Map<
    string,
    { duration: number; tracks: NumberKeyframeTrack[] }
  >();
  scene.traverse((object) => {
    if (!(object instanceof Mesh) || !object.userData.blender_emission) return;
    const material = object.material;
    if (!(material instanceof MeshStandardMaterial))
      throw new Error(`Unsupported animated material: ${object.name}`);
    const curve = JSON.parse(
      object.userData.blender_emission,
    ) as BlenderEmission;
    if (
      !(curve.base > 0 && curve.fps > 0) ||
      !curve.keys.length ||
      curve.keys.some(
        ([frame, value]) => !Number.isFinite(frame) || !Number.isFinite(value),
      )
    )
      throw new Error(`Invalid Blender emission curve: ${object.name}`);
    const name = `${curve.trigger === "focus" ? "Focus" : "Ambient"}_Lights_${curve.group}`;
    const group = groups.get(name) ?? {
      duration: (curve.end - 1) / curve.fps,
      tracks: [],
    };
    group.tracks.push(
      new NumberKeyframeTrack(
        `${object.uuid}.material.emissiveIntensity`,
        curve.keys.map(([frame]) => (frame - 1) / curve.fps),
        curve.keys.map(
          ([, value]) => (value / curve.base) * material.emissiveIntensity,
        ),
      ),
    );
    groups.set(name, group);
  });
  return [...groups].map(
    ([name, { duration, tracks }]) => new AnimationClip(name, duration, tracks),
  );
}
