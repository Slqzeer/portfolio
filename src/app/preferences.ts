import type { Lighting } from "./appState";
import type { Locale } from "../content/types";

export interface PersistedPreferences {
  locale: Locale;
  lighting: Lighting;
}

interface ReadableStorage {
  getItem(key: string): string | null;
}

interface WritableStorage {
  setItem(key: string, value: string): void;
}

const key = "portfolio-preferences";
const defaults: PersistedPreferences = { locale: "fr", lighting: "day" };

export function readPreferences(
  storage: ReadableStorage,
): PersistedPreferences {
  try {
    const value = JSON.parse(
      storage.getItem(key) ?? "null",
    ) as Partial<PersistedPreferences> | null;

    return value &&
      (value.locale === "fr" || value.locale === "en") &&
      (value.lighting === "day" || value.lighting === "night")
      ? { locale: value.locale, lighting: value.lighting }
      : defaults;
  } catch {
    return defaults;
  }
}

export function writePreferences(
  storage: WritableStorage,
  value: PersistedPreferences,
): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be disabled; the in-memory state remains usable.
  }
}
