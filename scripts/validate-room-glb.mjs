import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Matrix4, Quaternion, Vector3 } from "three";
import { assertRequiredRoomNodes, readGlbNodeNames } from "./glb-contract.mjs";

const defaultPath = fileURLToPath(
  new URL("../public/assets/room/portfolio-room.glb", import.meta.url),
);
const path = process.argv[2] ?? defaultPath;
const bytes = await readFile(path);
const buffer = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
);
const names = readGlbNodeNames(buffer);
assertRequiredRoomNodes(names);
const gltf = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
);
for (const node of [
  "Wall_Continuous",
  "Exterior_Foliage_00",
  "Blind_Breeze",
  "Blind_Slat_37",
  "Blind_Cord_01",
  "EMIT_Controller_Power",
  "Phone_Notification_0",
  "Editor_monitor_TypingMask",
  "Editor_laptop_TypingMask",
  "Editor_monitor_day",
  "Editor_monitor_night",
  "Editor_laptop_day",
  "Editor_laptop_night",
  "Phone_Display_day",
  "Phone_Display_night",
]) {
  if (!names.has(node)) throw new Error(`Missing living-room node: ${node}`);
}
// A new breeze parent must preserve the approved blind's world placement.
const controllerPower = gltf.nodes.find(
  ({ name }) => name === "EMIT_Controller_Power",
);
if (
  !controllerPower.extras?.status_button_aligned ||
  new Vector3(...(controllerPower.translation ?? [0, 0, 0])).distanceTo(
    new Vector3(0, 0.0414, 0.004),
  ) > 1e-5
)
  throw new Error("Controller status ring misses the centre button");
const parents = new Map();
gltf.nodes.forEach((node, index) =>
  node.children?.forEach((child) => parents.set(child, index)),
);
let index = gltf.nodes.findIndex(({ name }) => name === "Blind_Slat_37");
const world = new Matrix4();
while (index !== undefined) {
  const node = gltf.nodes[index];
  const local = node.matrix
    ? new Matrix4().fromArray(node.matrix)
    : new Matrix4().compose(
        new Vector3(...(node.translation ?? [0, 0, 0])),
        new Quaternion(...(node.rotation ?? [0, 0, 0, 1])),
        new Vector3(...(node.scale ?? [1, 1, 1])),
      );
  world.premultiply(local);
  index = parents.get(index);
}
const blindPosition = new Vector3().setFromMatrixPosition(world);
if (
  Math.abs(blindPosition.x + 2.4) > 1e-4 ||
  Math.abs(blindPosition.z + 4.925) > 1e-4
)
  throw new Error(
    `Blind shifted during Blender export: ${blindPosition.toArray().join(", ")}`,
  );
for (const name of [
  "Ambient_Exterior_Foliage_00",
  "Ambient_Blind_Breeze",
  "Ambient_Phone_Notification_0",
  "Ambient_Editor_monitor_Typing",
  "Ambient_Editor_laptop_Typing",
]) {
  if (!gltf.animations.some((clip) => clip.name === name))
    throw new Error(`Missing Blender ambient clip: ${name}`);
}
if (
  names.has("Exterior_Bird") ||
  names.has("Monitor_Screen_Terminal_Background")
)
  throw new Error(
    "Legacy bird or floating terminal survived the Blender export",
  );
for (const device of ["monitor", "laptop"]) {
  for (const theme of ["day", "night"]) {
    const node = gltf.nodes.find(
      ({ name }) => name === `Editor_${device}_${theme}`,
    );
    if (node.extras?.screen_theme !== theme || !node.extras?.device_surface)
      throw new Error(`Missing authored display metadata: ${device}/${theme}`);
    const primitive = gltf.meshes[node.mesh].primitives[0];
    if (!gltf.materials[primitive.material].emissiveTexture)
      throw new Error(`Missing editor artwork: ${device}/${theme}`);
  }
}
if (
  !gltf.nodes.find(({ name }) => name === "Bookshelf_Carcass")?.extras
    ?.corner_repaired
)
  throw new Error("Bookshelf corner repair missing from Blender export");
for (const material of [
  "MAT_Review_Floor_LightWood",
  "MAT_Review_Desk_Wood",
  "MAT_Sofa_Fabric",
  "MAT_Rug_Wool",
]) {
  if (!gltf.materials.find(({ name }) => name === material)?.normalTexture)
    throw new Error(`Missing Blender normal map: ${material}`);
}
const shaderCurves = gltf.nodes.filter((node) => node.extras?.blender_emission);
if (shaderCurves.length < 80)
  throw new Error("Missing Blender rack/controller shader curves");
for (const node of shaderCurves) {
  const curve = JSON.parse(node.extras.blender_emission);
  if (!(curve.base > 0 && curve.fps > 0 && curve.keys.length > 1))
    throw new Error(`Invalid Blender shader curve: ${node.name}`);
}
for (const clip of gltf.animations.filter(({ name }) =>
  name.startsWith("Curtain_"),
)) {
  for (const sampler of clip.samplers) {
    const duration = gltf.accessors[sampler.input].max[0];
    if (duration > 1.2)
      throw new Error(
        `Day/night clip stretched by ambient timeline: ${clip.name}`,
      );
  }
}
// Reference poses sampled from the original Blender scene at 24 fps.
const binaryOffset = 28 + bytes.readUInt32LE(12);
for (const [nodeName, path, component, frame, expected] of [
  ["Blind_Slat_37", "translation", 1, 6, 3.2617431],
  ["Blind_Slat_37", "translation", 1, 10, 2.6568799],
  ["Blind_Slat_37", "translation", 1, 14, 2.1304853],
  ["Blind_Slat_19", "translation", 1, 6, 3.7117431],
  ["Blind_Cord_01", "scale", 1, 10, 2.0431201],
  ["Blind_Slat_37", "rotation", 0, 24, -Math.sin((40 * Math.PI) / 180)],
]) {
  const clip = gltf.animations.find(
    (clip) =>
      clip.name.startsWith("Curtain_") &&
      clip.channels.some(
        (channel) => gltf.nodes[channel.target.node].name === nodeName,
      ),
  );
  const channel = clip?.channels.find(
    (channel) => channel.target.path === path,
  );
  if (!channel)
    throw new Error(`Missing Blender curtain track: ${nodeName}.${path}`);
  const sampler = clip.samplers[channel.sampler];
  const input = gltf.accessors[sampler.input];
  const output = gltf.accessors[sampler.output];
  const read = (accessor, index) =>
    bytes.readFloatLE(
      binaryOffset +
        (gltf.bufferViews[accessor.bufferView].byteOffset ?? 0) +
        (accessor.byteOffset ?? 0) +
        index * 4,
    );
  if (
    input.count !== 24 ||
    Math.abs(read(input, frame - 1) - (frame - 1) / 24) > 1e-6 ||
    Math.abs(
      read(output, (frame - 1) * (path === "rotation" ? 4 : 3) + component) -
        expected,
    ) > 1e-5
  )
    throw new Error(
      `Curtain differs from Blender at frame ${frame}: ${nodeName}.${path}`,
    );
}
for (const id of [
  "volleyball",
  "controller",
  "bookshelf",
  "monitor",
  "smartphone",
  "education",
  "contact",
  "server",
]) {
  const clip = gltf.animations?.find(({ name }) => name === `Hover_${id}`);
  if (!clip?.channels.length)
    throw new Error(`Missing Blender hover clip: Hover_${id}`);
  for (const channel of clip.channels) {
    if (!gltf.nodes[channel.target.node]?.name)
      throw new Error(`Missing Blender hover target: Hover_${id}`);
  }
}
console.log(`Valid room GLB: ${names.size} named nodes (${path})`);
