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
console.log(`Valid room GLB: ${names.size} named nodes (${path})`);
