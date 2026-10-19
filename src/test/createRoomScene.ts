import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { sceneManifest } from "../room/sceneManifest";
export function createRoomScene() {
  const scene = new Group();

  for (const { nodeName } of Object.values(sceneManifest)) {
    const root = new Group();
    root.name = nodeName;
    scene.add(root);
  }

  for (const name of [
    "CAM_Overview",
    ...Object.values(sceneManifest).flatMap(({ cameraAnchorName }) =>
      cameraAnchorName ? [cameraAnchorName] : [],
    ),
  ]) {
    const cameraAnchor = new Object3D();
    cameraAnchor.name = name;
    scene.add(cameraAnchor);
  }

  for (const name of ["Flag_FR", "Flag_EN"]) {
    const flag = new Group();
    flag.name = name;
    scene.getObjectByName("CTL_Flag")!.add(flag);
  }

  const monitor = scene.getObjectByName("INT_Monitor") as Group;
  const monitorMesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  monitorMesh.name = "MonitorSurface";
  monitor.add(monitorMesh);

  const decoration = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  decoration.name = "DeskDecoration";
  scene.add(decoration);

  return scene;
}
