import type { RoomObjectId } from "../content/types";

export type SceneAction =
  "focus" | "focus-zone" | "toggle-lighting" | "toggle-locale";

export interface SceneObjectDefinition {
  id: RoomObjectId;
  nodeName: string;
  cameraAnchorName?: string;
  action: SceneAction;
  parentId?: RoomObjectId;
}

export const sceneManifest: Record<RoomObjectId, SceneObjectDefinition> = {
  desk: {
    id: "desk",
    nodeName: "INT_Desk",
    cameraAnchorName: "CAM_Anchor_Desk",
    action: "focus-zone",
  },
  monitor: {
    id: "monitor",
    nodeName: "INT_Monitor",
    cameraAnchorName: "CAM_Anchor_Monitor",
    action: "focus",
    parentId: "desk",
  },
  server: {
    id: "server",
    nodeName: "INT_Homelab",
    cameraAnchorName: "CAM_Anchor_Homelab",
    action: "focus",
  },
  education: {
    id: "education",
    nodeName: "INT_Diploma",
    cameraAnchorName: "CAM_Anchor_Diploma",
    action: "focus",
  },
  volleyball: {
    id: "volleyball",
    nodeName: "INT_Volleyball",
    cameraAnchorName: "CAM_Anchor_Volleyball",
    action: "focus",
  },
  controller: {
    id: "controller",
    nodeName: "INT_Controller",
    cameraAnchorName: "CAM_Anchor_Controller",
    action: "focus",
  },
  smartphone: {
    id: "smartphone",
    nodeName: "INT_Smartphone",
    cameraAnchorName: "CAM_Anchor_Smartphone",
    action: "focus",
    parentId: "desk",
  },
  bookshelf: {
    id: "bookshelf",
    nodeName: "INT_Bookshelf",
    cameraAnchorName: "CAM_Anchor_Bookshelf",
    action: "focus",
  },
  contact: {
    id: "contact",
    nodeName: "INT_ContactCard",
    cameraAnchorName: "CAM_Anchor_ContactCard",
    action: "focus",
  },
  window: {
    id: "window",
    nodeName: "CTL_Curtains",
    action: "toggle-lighting",
  },
  flag: {
    id: "flag",
    nodeName: "CTL_Flag",
    action: "toggle-locale",
  },
};

export function parentRoomObjectId(id: RoomObjectId): RoomObjectId | null {
  return sceneManifest[id].parentId ?? null;
}

export function roomObjectIdsForContext(
  activeObject: RoomObjectId | null,
): RoomObjectId[] {
  const context = activeObject
    ? (parentRoomObjectId(activeObject) ?? activeObject)
    : null;
  return Object.values(sceneManifest)
    .filter(({ parentId }) => !parentId || parentId === context)
    .map(({ id }) => id);
}

export function selectionTarget(
  id: RoomObjectId,
  activeObject: RoomObjectId | null,
): RoomObjectId {
  const parentId = parentRoomObjectId(id);
  if (!parentId || !activeObject) return parentId ?? id;
  return activeObject === parentId ||
    parentRoomObjectId(activeObject) === parentId
    ? id
    : parentId;
}
