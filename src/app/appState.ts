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
  | { type: "lighting.changed"; lighting: Lighting }
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

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "locale.changed":
      return { ...state, locale: action.locale };
    case "lighting.changed":
      return { ...state, lighting: action.lighting };
    case "object.selected":
      return { ...state, activeObject: action.objectId };
    case "category.changed":
      return { ...state, projectCategory: action.category };
    case "intro.minimized":
      return { ...state, introExpanded: false };
  }
}
