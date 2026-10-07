import type { Locale, ProjectCategory, RoomObjectId } from "../content/types";

export type Lighting = "day" | "night";

export interface AppState {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  projectCategory: ProjectCategory;
  introExpanded: boolean;
}

export type AppAction =
  | { type: "locale.changed"; locale: Locale }
  | { type: "lighting.toggled" }
  | { type: "object.selected"; objectId: RoomObjectId | null }
  | { type: "category.changed"; category: ProjectCategory }
  | { type: "intro.minimized" };

export const initialAppState: AppState = {
  locale: "fr",
  lighting: "day",
  activeObject: null,
  projectCategory: "data-ai",
  introExpanded: true,
};

const objectProjectCategories: Partial<Record<RoomObjectId, ProjectCategory>> =
  {
    monitor: "data-ai",
    controller: "game-development",
    smartphone: "experiments",
  };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "locale.changed":
      return { ...state, locale: action.locale };
    case "lighting.toggled":
      return { ...state, lighting: state.lighting === "day" ? "night" : "day" };
    case "object.selected":
      return {
        ...state,
        activeObject: action.objectId,
        projectCategory: action.objectId
          ? (objectProjectCategories[action.objectId] ?? state.projectCategory)
          : state.projectCategory,
      };
    case "category.changed":
      return { ...state, projectCategory: action.category };
    case "intro.minimized":
      return { ...state, introExpanded: false };
  }
}
