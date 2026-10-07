import { describe, expect, it } from "vitest";
import { sceneManifest } from "../src/room/sceneManifest";

interface GlbContract {
  REQUIRED_ROOM_NODES: readonly string[];
  readGlbNodeNames(buffer: ArrayBuffer): Set<string>;
  assertRequiredRoomNodes(names: Set<string>): void;
}

async function loadContract(): Promise<GlbContract | null> {
  const modulePath = "./glb-contract.mjs";
  return import(modulePath).catch(() => null);
}

function makeGlb(nodes: string[], chunkType = 0x4e4f534a): ArrayBuffer {
  const encoded = new TextEncoder().encode(
    JSON.stringify({ nodes: nodes.map((name) => ({ name })) }),
  );
  const paddedLength = Math.ceil(encoded.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + paddedLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, chunkType, true);
  bytes.set(encoded, 20);
  bytes.fill(0x20, 20 + encoded.length);

  return buffer;
}

async function requireContract() {
  const contract = await loadContract();
  expect(contract).not.toBeNull();
  return contract!;
}

describe("GLB room contract", () => {
  it("reads node names from a bounded GLB JSON chunk", async () => {
    const { readGlbNodeNames } = await requireContract();

    expect([...readGlbNodeNames(makeGlb(["Room", "INT_Monitor"]))]).toEqual([
      "Room",
      "INT_Monitor",
    ]);
  });

  it("rejects malformed GLB containers", async () => {
    const { readGlbNodeNames } = await requireContract();
    const badMagic = makeGlb([]);
    new DataView(badMagic).setUint32(0, 0, true);

    expect(() => readGlbNodeNames(new ArrayBuffer(8))).toThrow("truncated");
    expect(() => readGlbNodeNames(badMagic)).toThrow("magic");
    expect(() => readGlbNodeNames(makeGlb([], 0x004e4942))).toThrow(
      "JSON chunk",
    );
  });

  it("rejects scenes missing required nodes", async () => {
    const { assertRequiredRoomNodes } = await requireContract();

    expect(() => assertRequiredRoomNodes(new Set(["CAM_Overview"]))).toThrow(
      "Missing required GLB nodes",
    );
  });

  it("matches the runtime scene manifest", async () => {
    const { REQUIRED_ROOM_NODES } = await requireContract();
    const runtimeNames = [
      "CAM_Overview",
      ...Object.values(sceneManifest).flatMap((definition) => [
        definition.nodeName,
        ...(definition.cameraAnchorName ? [definition.cameraAnchorName] : []),
      ]),
    ];

    expect(REQUIRED_ROOM_NODES).toEqual(runtimeNames);
  });
});
