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
for (const idle of [
  "Plant_Large_Leaves",
  "DeskPlant_Leaves",
  "TablePlant_Leaves",
  "Blind_Cord_01",
  "Blind_Cord_02",
  "IDLE_Monitor_Cursor",
  "Lamp_Shade",
  "Lamp_Bulb",
]) {
  if (!names.has(idle))
    throw new Error(`Missing idle-animation target: ${idle}`);
}
console.log(`Valid room GLB: ${names.size} named nodes (${path})`);
