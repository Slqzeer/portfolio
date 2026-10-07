import { describe, expect, it } from "vitest";
import type { RoomObjectId } from "../content/types";
import { hashForObject, parseRoomHash } from "./hashNavigation";

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
