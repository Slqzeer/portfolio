import type { RoomObjectId } from "../content/types";
import { roomGeometry, type RoomGeometryEntry } from "./roomGeometry";

export interface RoomObjectDefinition extends RoomGeometryEntry {
  id: RoomObjectId;
  tabOrder: number;
}

const objectOrder: RoomObjectId[] = [
  "window",
  "monitor",
  "smartphone",
  "server",
  "education",
  "bookshelf",
  "contact",
  "controller",
  "volleyball",
  "flag",
];

export const roomObjects: RoomObjectDefinition[] = objectOrder.map(
  (id, tabOrder) => ({
    id,
    tabOrder,
    ...roomGeometry[id],
  }),
);
