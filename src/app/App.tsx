import { useCallback, useEffect, useReducer } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
import { ObjectDetails } from "../details/ObjectDetails";
import { FocusView } from "../room/FocusView";
import { hashForObject, parseRoomHash } from "../room/hashNavigation";
import { roomObjects } from "../room/roomObjects";
import { RoomScene } from "../room/RoomScene";
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
    const validIds = roomObjects.map(({ id }) => id);
    const syncFromHistory = () =>
      dispatch({
        type: "object.selected",
        objectId: parseRoomHash(window.location.hash, validIds),
      });

    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);

  const activeDefinition =
    roomObjects.find(({ id }) => id === state.activeObject) ?? null;

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
        <FocusView definition={activeDefinition} onClose={closeObject}>
          <RoomScene
            locale={state.locale}
            lighting={state.lighting}
            activeObject={state.activeObject}
            onSelect={(objectId) => {
              window.history.pushState(null, "", hashForObject(objectId));
              dispatch({ type: "object.selected", objectId });
            }}
            onToggleLighting={() => dispatch({ type: "lighting.toggled" })}
          />
        </FocusView>
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
