import { describe, expect, it } from "vitest";
import type { RoomObjectId } from "../content/types";
import {
  hashForObject,
  isRoomHistoryState,
  parseRoomHash,
  roomHistoryState,
} from "./hashNavigation";

const validIds: RoomObjectId[] = ["monitor", "server", "window"];

describe("room hash navigation", () => {
  it("parses known object hashes", () => {
    expect(parseRoomHash("#room/server", validIds)).toBe("server");
  });

  it("rejects unknown and malformed hashes", () => {
    expect(parseRoomHash("#room/unknown", validIds)).toBeNull();
    expect(parseRoomHash("#server", validIds)).toBeNull();
  });

  it("builds a shareable object hash", () => {
    expect(hashForObject("monitor")).toBe("#room/monitor");
  });
});

describe("room history state", () => {
  it("recognizes only the in-app entry recorded for an object", () => {
    const state = roomHistoryState("monitor", "desk");

    expect(state).toEqual({ roomObjectId: "monitor", parentId: "desk" });
    expect(isRoomHistoryState(state, "monitor", "desk")).toBe(true);
    expect(isRoomHistoryState(state, "monitor", null)).toBe(false);
    expect(isRoomHistoryState(state, "smartphone", "desk")).toBe(false);
  });

  it("treats direct external hashes as unrecorded", () => {
    expect(isRoomHistoryState(null, "monitor", "desk")).toBe(false);
    expect(isRoomHistoryState("monitor", "monitor", "desk")).toBe(false);
  });
});
