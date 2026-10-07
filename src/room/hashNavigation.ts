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
