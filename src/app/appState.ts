import type { Locale, ProjectCategory, RoomObjectId } from "../content/types";

export type Lighting = "day" | "night";
export type NavigationPhase = "ROOM" | "FOCUS" | "INTERACT";

export interface AppState {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  projectCategory: ProjectCategory;
  introExpanded: boolean;
  navigationPhase: NavigationPhase;
  transitionId: number;
  sceneUnavailable: boolean;
  readingMode: boolean;
}

export type AppAction =
  | { type: "locale.changed"; locale: Locale }
  | { type: "lighting.toggled" }
  | { type: "object.selected"; objectId: RoomObjectId | null }
  | { type: "category.changed"; category: ProjectCategory }
  | { type: "intro.minimized" }
  | { type: "camera.arrived"; transitionId: number }
  | { type: "scene.unavailable" }
  | { type: "reading.toggled" }
  | { type: "home.opened" };

export const initialAppState: AppState = {
  locale: "fr",
  lighting: "day",
  activeObject: null,
  projectCategory: "data-ai",
  introExpanded: true,
  navigationPhase: "ROOM",
  transitionId: 0,
  sceneUnavailable: false,
  readingMode: false,
};

const objectProjectCategories: Partial<Record<RoomObjectId, ProjectCategory>> =
  {
    monitor: "data-ai",
    controller: "game-development",
    smartphone: "experiments",
  };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "home.opened":
      return {
        ...state,
        activeObject: null,
        readingMode: false,
        introExpanded: true,
        navigationPhase: state.sceneUnavailable ? "ROOM" : "FOCUS",
        transitionId: state.transitionId + 1,
      };
    case "locale.changed":
      return { ...state, locale: action.locale };
    case "lighting.toggled":
      return { ...state, lighting: state.lighting === "day" ? "night" : "day" };
    case "object.selected":
      if (action.objectId === state.activeObject) return state;
      return {
        ...state,
        activeObject: action.objectId,
        navigationPhase:
          state.sceneUnavailable || state.readingMode
            ? action.objectId
              ? "INTERACT"
              : "ROOM"
            : "FOCUS",
        transitionId: state.transitionId + 1,
        projectCategory: action.objectId
          ? (objectProjectCategories[action.objectId] ?? state.projectCategory)
          : state.projectCategory,
      };
    case "camera.arrived":
      if (
        action.transitionId !== state.transitionId ||
        state.navigationPhase !== "FOCUS"
      )
        return state;
      return {
        ...state,
        navigationPhase: state.activeObject ? "INTERACT" : "ROOM",
      };
    case "scene.unavailable":
      return {
        ...state,
        sceneUnavailable: true,
        navigationPhase: state.activeObject ? "INTERACT" : "ROOM",
      };
    case "reading.toggled": {
      const readingMode = !state.readingMode;
      return {
        ...state,
        readingMode,
        introExpanded: false,
        transitionId: state.transitionId + 1,
        navigationPhase:
          readingMode || state.sceneUnavailable
            ? state.activeObject
              ? "INTERACT"
              : "ROOM"
            : "FOCUS",
      };
    }
    case "category.changed":
      return { ...state, projectCategory: action.category };
    case "intro.minimized":
      return { ...state, introExpanded: false };
  }
}
