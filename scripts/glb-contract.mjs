const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK = 0x4e4f534a;

export const REQUIRED_ROOM_NODES = [
  "CAM_Overview",
  "INT_Monitor",
  "CAM_Anchor_Monitor",
  "INT_Homelab",
  "CAM_Anchor_Homelab",
  "INT_Diploma",
  "CAM_Anchor_Diploma",
  "INT_Volleyball",
  "CAM_Anchor_Volleyball",
  "INT_Controller",
  "CAM_Anchor_Controller",
  "INT_Smartphone",
  "CAM_Anchor_Smartphone",
  "INT_Bookshelf",
  "CAM_Anchor_Bookshelf",
  "INT_ContactCard",
  "CAM_Anchor_ContactCard",
  "CTL_Curtains",
  "CTL_Flag",
];

export function readGlbNodeNames(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 20) {
    throw new Error("GLB is truncated");
  }

  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error("Invalid GLB magic value");
  }
  if (view.getUint32(4, true) !== GLB_VERSION) {
    throw new Error("Unsupported GLB version");
  }

  const declaredLength = view.getUint32(8, true);
  if (declaredLength !== buffer.byteLength) {
    throw new Error("GLB length does not match its buffer");
  }

  let offset = 12;
  while (offset + 8 <= declaredLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkEnd = offset + 8 + chunkLength;
    if (chunkEnd > declaredLength) {
      throw new Error("GLB chunk extends outside its buffer");
    }

    if (chunkType === JSON_CHUNK) {
      const bytes = new Uint8Array(buffer, offset + 8, chunkLength);
      const json = JSON.parse(new TextDecoder().decode(bytes).trim());
      return new Set(
        Array.isArray(json.nodes)
          ? json.nodes
              .map((node) => node?.name)
              .filter((name) => typeof name === "string")
          : [],
      );
    }
    offset = chunkEnd;
  }

  throw new Error("GLB JSON chunk is missing");
}

export function assertRequiredRoomNodes(names) {
  const missing = REQUIRED_ROOM_NODES.filter((name) => !names.has(name));
  if (missing.length) {
    throw new Error(`Missing required GLB nodes: ${missing.join(", ")}`);
  }
}
