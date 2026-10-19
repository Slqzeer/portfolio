import { useCallback, useEffect, useReducer, useState } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
import type { RoomObjectId } from "../content/types";
import { ObjectDetails } from "../details/ObjectDetails";
import { RoomScene } from "../room/RoomScene";
import { sceneManifest } from "../room/sceneManifest";
import { useRoomMotion } from "../room/useRoomMotion";
import { appReducer, initialAppState } from "./appState";
import { readPreferences, writePreferences } from "./preferences";
import { useRoomNavigation } from "./useRoomNavigation";

export function App() {
  const [state, dispatch] = useReducer(
    appReducer,
    initialAppState,
    (value) => ({
      ...value,
      ...readPreferences(window.localStorage),
    }),
  );
  const { selectObject, closeObject, captureTrigger, toggleReading, explore } =
    useRoomNavigation(state, dispatch);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [screenshotSelection, setScreenshotSelection] = useState<{
    projectId: string;
    src: string;
  } | null>(null);
  const selectedProject =
    portfolioContent.projects.find(
      (project) =>
        project.id === selectedProjectId &&
        project.category === state.projectCategory,
    ) ??
    portfolioContent.projects.find(
      (project) => project.category === state.projectCategory,
    );
  const projectPreview =
    screenshotSelection?.projectId === selectedProject?.id
      ? screenshotSelection?.src
      : selectedProject?.screenshots?.[0]?.src;
  const [lastDetail, setLastDetail] = useState<RoomObjectId | null>(null);
  const activeDetail =
    state.activeObject && sceneManifest[state.activeObject].action === "focus"
      ? state.activeObject
      : null;
  const displayedDetail = activeDetail ?? lastDetail;

  // Retain the outgoing content until its panel has slid out of view.
  useEffect(() => {
    if (activeDetail) setLastDetail(activeDetail);
  }, [activeDetail]);
  const { ambientPaused, reducedMotion, animationsEnabled, toggleMotion } =
    useRoomMotion(state.readingMode);

  useEffect(() => {
    writePreferences(window.localStorage, {
      locale: state.locale,
      lighting: state.lighting,
    });
  }, [state.locale, state.lighting]);

  useEffect(() => {
    document.documentElement.lang = state.locale;
  }, [state.locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.lighting;
  }, [state.lighting]);

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

      selectObject(objectId);
    },
    [selectObject, state.locale],
  );
  const introVisible =
    state.introExpanded || (state.readingMode && !state.activeObject);

  return (
    <div className="app-shell" id="home" onClickCapture={captureTrigger}>
      <SiteHeader
        content={portfolioContent}
        locale={state.locale}
        activeObject={state.activeObject}
        readingMode={state.readingMode}
        lighting={state.lighting}
        animationsEnabled={animationsEnabled}
        onMotionToggle={toggleMotion}
        canvasFailed={canvasFailed}
        onInteract={handleRoomInteract}
        onClose={closeObject}
        onReadingToggle={toggleReading}
        onLocaleChange={(locale) =>
          dispatch({ type: "locale.changed", locale })
        }
      />
      <main
        data-intro-open={introVisible}
        data-navigation-phase={state.navigationPhase}
        data-reading-mode={state.readingMode}
        data-detail-open={
          !!state.activeObject &&
          sceneManifest[state.activeObject].action === "focus"
        }
      >
        <RoomScene
          locale={state.locale}
          lighting={state.lighting}
          activeObject={state.activeObject}
          onInteract={handleRoomInteract}
          projectPreview={projectPreview}
          ambientPaused={ambientPaused}
          reducedMotion={reducedMotion}
          transitionId={state.transitionId}
          navigationPhase={state.navigationPhase}
          readingMode={state.readingMode}
          onArrive={(transitionId) =>
            dispatch({ type: "camera.arrived", transitionId })
          }
          onUnavailable={() => {
            setCanvasFailed(true);
            dispatch({ type: "scene.unavailable" });
          }}
          onReady={() => setCanvasFailed(false)}
        />
        {displayedDetail && (
          <ObjectDetails
            objectId={displayedDetail}
            open={!!activeDetail}
            ready={state.navigationPhase === "INTERACT"}
            locale={state.locale}
            onClose={closeObject}
            activeCategory={state.projectCategory}
            selectedProjectId={selectedProject?.id}
            onProjectSelect={(id) => {
              setSelectedProjectId(id);
              setScreenshotSelection(null);
            }}
            onScreenshotSelect={(src) => {
              if (selectedProject)
                setScreenshotSelection({ projectId: selectedProject.id, src });
            }}
            onCategoryChange={(category) => {
              setScreenshotSelection(null);
              dispatch({ type: "category.changed", category });
            }}
          />
        )}
        {introVisible && (
          <IntroCard
            content={portfolioContent}
            locale={state.locale}
            onExplore={explore}
          />
        )}
      </main>
    </div>
  );
}
