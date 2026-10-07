import { useEffect, useReducer } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
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
          onSelect={(objectId) =>
            dispatch({ type: "object.selected", objectId })
          }
          onToggleLighting={() =>
            dispatch({
              type: "lighting.changed",
              lighting: state.lighting === "day" ? "night" : "day",
            })
          }
        />
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
