import type { RoomObjectId } from "../content/types";

export const CANVA_DESIGN_ID = "DAHXRbROrBI";
export const CANVA_PAGE_SIZE = { width: 1920, height: 1080 } as const;

interface PixelBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface NormalizedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomGeometryEntry {
  sourceElementRef: string;
  hotspot: NormalizedBounds;
  focusTransform: { x: number; y: number; scale: number };
  layerIndex: number;
  assets: { day: string; night: string };
}

export type RoomGeometry = Record<RoomObjectId, RoomGeometryEntry>;

export function normalizeCanvaBounds({
  left,
  top,
  width,
  height,
}: PixelBounds): NormalizedBounds {
  return {
    x: (left / CANVA_PAGE_SIZE.width) * 100,
    y: (top / CANVA_PAGE_SIZE.height) * 100,
    width: (width / CANVA_PAGE_SIZE.width) * 100,
    height: (height / CANVA_PAGE_SIZE.height) * 100,
  };
}

const roomAssets = {
  day: "/assets/room/room-day.png",
  night: "/assets/room/room-night.png",
} as const;

export const roomGeometry: RoomGeometry = {
  monitor: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:5",
    hotspot: normalizeCanvaBounds({
      left: 535,
      top: 325,
      width: 385,
      height: 260,
    }),
    focusTransform: { x: 37.9, y: 42.1, scale: 1.65 },
    layerIndex: 20,
    assets: roomAssets,
  },
  server: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:7",
    hotspot: normalizeCanvaBounds({
      left: 890,
      top: 225,
      width: 215,
      height: 355,
    }),
    focusTransform: { x: 52, y: 37.3, scale: 1.7 },
    layerIndex: 21,
    assets: roomAssets,
  },
  volleyball: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:10:2",
    hotspot: normalizeCanvaBounds({
      left: 865,
      top: 690,
      width: 110,
      height: 125,
    }),
    focusTransform: { x: 47.9, y: 69.7, scale: 1.8 },
    layerIndex: 28,
    assets: roomAssets,
  },
  education: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:8",
    hotspot: normalizeCanvaBounds({
      left: 1080,
      top: 160,
      width: 155,
      height: 260,
    }),
    focusTransform: { x: 60.3, y: 26.9, scale: 1.75 },
    layerIndex: 22,
    assets: roomAssets,
  },
  controller: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:11",
    hotspot: normalizeCanvaBounds({
      left: 900,
      top: 570,
      width: 570,
      height: 390,
    }),
    focusTransform: { x: 61.7, y: 70.8, scale: 1.45 },
    layerIndex: 27,
    assets: roomAssets,
  },
  smartphone: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:6",
    hotspot: normalizeCanvaBounds({
      left: 470,
      top: 360,
      width: 500,
      height: 345,
    }),
    focusTransform: { x: 37.5, y: 49.3, scale: 1.5 },
    layerIndex: 19,
    assets: roomAssets,
  },
  bookshelf: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:9",
    hotspot: normalizeCanvaBounds({
      left: 1110,
      top: 335,
      width: 335,
      height: 350,
    }),
    focusTransform: { x: 66.5, y: 47.2, scale: 1.55 },
    layerIndex: 23,
    assets: roomAssets,
  },
  contact: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:10",
    hotspot: normalizeCanvaBounds({
      left: 840,
      top: 610,
      width: 320,
      height: 235,
    }),
    focusTransform: { x: 52.1, y: 67.4, scale: 1.7 },
    layerIndex: 26,
    assets: roomAssets,
  },
  flag: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:10:3",
    hotspot: normalizeCanvaBounds({
      left: 1560,
      top: 88,
      width: 150,
      height: 90,
    }),
    focusTransform: { x: 85.2, y: 12.3, scale: 1.9 },
    layerIndex: 30,
    assets: roomAssets,
  },
  window: {
    sourceElementRef: "figma:mESnsD8GuPIigFtJiQ29Ki:9:4",
    hotspot: normalizeCanvaBounds({
      left: 530,
      top: 145,
      width: 340,
      height: 330,
    }),
    focusTransform: { x: 36.5, y: 28.7, scale: 1.6 },
    layerIndex: 18,
    assets: roomAssets,
  },
};
