import { useEffect, useReducer } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
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
        <div className="room-backdrop" aria-hidden="true" />
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
