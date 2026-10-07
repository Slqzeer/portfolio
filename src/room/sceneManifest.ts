import type { RoomObjectId } from "../content/types";

export type SceneAction = "focus" | "toggle-lighting" | "toggle-locale";

export interface SceneObjectDefinition {
  id: RoomObjectId;
  nodeName: string;
  cameraAnchorName?: string;
  action: SceneAction;
}

export const sceneManifest: Record<RoomObjectId, SceneObjectDefinition> = {
  monitor: {
    id: "monitor",
    nodeName: "INT_Monitor",
    cameraAnchorName: "CAM_Anchor_Monitor",
    action: "focus",
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
