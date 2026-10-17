import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
