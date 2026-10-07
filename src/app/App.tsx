import { useCallback, useEffect, useReducer } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
import { ObjectDetails } from "../details/ObjectDetails";
import { hashForObject, parseRoomHash } from "../room/hashNavigation";
import { RoomScene } from "../room/RoomScene";
import { sceneManifest } from "../room/sceneManifest";
import { appReducer, initialAppState } from "./appState";
import { readPreferences, writePreferences } from "./preferences";

export function App() {
  const [state, dispatch] = useReducer(
    appReducer,
    initialAppState,
    (value) => ({
      ...value,
      ...readPreferences(window.localStorage),
    }),
  );

  useEffect(() => {
    writePreferences(window.localStorage, {
      locale: state.locale,
      lighting: state.lighting,
    });
  }, [state.locale, state.lighting]);

  useEffect(() => {
    document.documentElement.lang = state.locale;
  }, [state.locale]);

  const closeObject = useCallback(() => {
    const objectId = state.activeObject;
    window.history.pushState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    dispatch({ type: "object.selected", objectId: null });
    if (objectId) {
      document
        .querySelector<HTMLElement>(`[data-room-object="${objectId}"]`)
        ?.focus();
    }
  }, [state.activeObject]);

  useEffect(() => {
    if (!state.activeObject) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeObject();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeObject, state.activeObject]);

  useEffect(() => {
    const validIds = Object.values(sceneManifest)
      .filter(({ action }) => action === "focus")
      .map(({ id }) => id);
    const syncFromHistory = () => {
      const objectId = parseRoomHash(window.location.hash, validIds);
      dispatch({
        type: "object.selected",
        objectId,
      });
      if (objectId) dispatch({ type: "intro.minimized" });
    };

    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    window.addEventListener("hashchange", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      window.removeEventListener("hashchange", syncFromHistory);
    };
  }, []);

  const handleRoomInteract = useCallback(
    (objectId: keyof typeof sceneManifest) => {
      const { action } = sceneManifest[objectId];
      if (action === "toggle-lighting") {
        dispatch({ type: "lighting.toggled" });
        return;
      }
      if (action === "toggle-locale") {
        dispatch({
          type: "locale.changed",
          locale: state.locale === "fr" ? "en" : "fr",
        });
        return;
      }

      window.history.pushState(null, "", hashForObject(objectId));
      dispatch({ type: "object.selected", objectId });
      dispatch({ type: "intro.minimized" });
    },
    [state.locale],
  );

  return (
    <div className="app-shell" id="home">
      <SiteHeader
        content={portfolioContent}
        locale={state.locale}
        onLocaleChange={(locale) =>
          dispatch({ type: "locale.changed", locale })
        }
      />
      <main>
        <RoomScene
          locale={state.locale}
          lighting={state.lighting}
          activeObject={state.activeObject}
          onInteract={handleRoomInteract}
        />
        {state.activeObject && (
          <ObjectDetails
            objectId={state.activeObject}
            locale={state.locale}
            onClose={closeObject}
            activeCategory={state.projectCategory}
            onCategoryChange={(category) =>
              dispatch({ type: "category.changed", category })
            }
          />
        )}
        {state.introExpanded && (
          <IntroCard
            content={portfolioContent}
            locale={state.locale}
            onExplore={() => dispatch({ type: "intro.minimized" })}
          />
        )}
      </main>
    </div>
  );
}
