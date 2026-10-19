import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { prepareRoomScene } from "../../src/room/RoomModel";

export async function renderGarden() {
  const decoder = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  const gltf = await loader.loadAsync("/assets/room/portfolio-room.glb");
  const room = prepareRoomScene(gltf.scene);
  const scene = new T.Scene();
  scene.add(room, new T.AmbientLight(0xffffff, 1));
  room.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    let exterior = false;
    for (
      let ancestor: T.Object3D | null = node;
      ancestor;
      ancestor = ancestor.parent
    ) {
      if (ancestor.userData.exterior_surface) exterior = true;
    }
    node.visible = exterior;
  });
  const renderer = new T.WebGLRenderer({ alpha: true });
  renderer.setSize(96, 96);
  renderer.setClearColor(0, 0);
  const target = new T.WebGLRenderTarget(96, 96);
  const camera = new T.OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.1, 100);
  const coverage: Record<string, number> = {};
  try {
    for (const [name, x, z] of [
      ["window", -3.8, 0],
      ["beside-window", 0.8, 0],
      ["outside-room", 0.8, -6],
    ] as const) {
      camera.position.set(x, 2.65, z);
      camera.lookAt(x, 2.65, -9);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const pixels = new Uint8Array(96 * 96 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 96, 96, pixels);
      coverage[name] =
        pixels.filter((v, i) => i % 4 === 3 && v > 0).length / (96 * 96);
    }
    return { coverage };
  } finally {
    target.dispose();
    renderer.dispose();
    decoder.dispose();
    room.traverse((node) => {
      if (!(node instanceof T.Mesh)) return;
      node.geometry.dispose();
      for (const material of [node.material].flat()) material.dispose();
    });
  }
}
