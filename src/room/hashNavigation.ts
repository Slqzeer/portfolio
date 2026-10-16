import type { RoomObjectId } from "../content/types";

export function parseRoomHash(
  hash: string,
  validIds: readonly RoomObjectId[],
): RoomObjectId | null {
  const match = /^#room\/([^/]+)$/.exec(hash);
  if (!match) return null;

  return validIds.includes(match[1] as RoomObjectId)
    ? (match[1] as RoomObjectId)
    : null;
}

export function hashForObject(id: RoomObjectId): string {
  return `#room/${id}`;
}

export interface RoomHistoryState {
  roomObjectId: RoomObjectId;
  parentId: RoomObjectId | null;
}

export function roomHistoryState(
  roomObjectId: RoomObjectId,
  parentId: RoomObjectId | null,
): RoomHistoryState {
  return { roomObjectId, parentId };
}

export function isRoomHistoryState(
  state: unknown,
  roomObjectId: RoomObjectId,
  parentId: RoomObjectId | null,
): boolean {
  if (!state || typeof state !== "object") return false;
  const entry = state as Partial<RoomHistoryState>;
  return entry.roomObjectId === roomObjectId && entry.parentId === parentId;
}
