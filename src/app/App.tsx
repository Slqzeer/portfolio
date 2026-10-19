import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { IntroCard } from "../components/IntroCard";
import { SiteHeader } from "../components/SiteHeader";
import { portfolioContent } from "../content/portfolioContent";
import type { RoomObjectId } from "../content/types";
import { ObjectDetails } from "../details/ObjectDetails";
import {
  hashForObject,
  isRoomHistoryState,
  parseRoomHash,
  roomHistoryState,
} from "../room/hashNavigation";
import { RoomScene } from "../room/RoomScene";
import { sceneManifest } from "../room/sceneManifest";
import { useRoomMotion } from "../room/useRoomMotion";
import { appReducer, initialAppState } from "./appState";
import { readPreferences, writePreferences } from "./preferences";

export function App() {
  const restoreFocus = useRef<keyof typeof sceneManifest | null>(null);
  const triggers = useRef(new Map<string, HTMLElement>());
  const [state, dispatch] = useReducer(
    appReducer,
    initialAppState,
    (value) => ({
      ...value,
      ...readPreferences(window.localStorage),
    }),
  );
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

  const closeObject = useCallback(() => {
    const objectId = state.activeObject;
    if (!objectId) return;
    const previous = window.history.state?.parentId;
    const parentId =
      typeof previous === "string" &&
      sceneManifest[previous as keyof typeof sceneManifest]?.cameraAnchorName
        ? (previous as keyof typeof sceneManifest)
        : null;
    restoreFocus.current = objectId;
    if (isRoomHistoryState(window.history.state, objectId, parentId)) {
      window.history.back();
    } else {
      window.history.replaceState(
        null,
        "",
        parentId
          ? hashForObject(parentId)
          : window.location.pathname + window.location.search,
      );
    }
    dispatch({ type: "object.selected", objectId: parentId });
  }, [state.activeObject]);

  useEffect(() => {
    if (state.navigationPhase === "FOCUS" || !restoreFocus.current) return;
    const objectId = restoreFocus.current;
    restoreFocus.current = null;
    const saved = triggers.current.get(objectId);
    const focus = (trigger: HTMLElement | null) => {
      const menu = trigger?.closest("details");
      if (menu) menu.open = true;
      trigger?.focus();
    };
    const fallback = () =>
      focus(
        (saved?.isConnected
          ? saved
          : saved?.id
            ? document.getElementById(saved.id)
            : null) ??
          document.querySelector<HTMLElement>(`a[href="#room/${objectId}"]`),
      );
    if (!saved?.id.startsWith("room-hotspot-")) {
      fallback();
      return;
    }
    // Drei mounts its HTML markers in a separate React root after camera arrival.
    const restoreMarker = () => {
      const marker = document.getElementById(saved.id);
      if (!marker) return false;
      focus(marker);
      return true;
    };
    if (restoreMarker()) return;
    const observer = new MutationObserver(() => {
      if (restoreMarker()) {
        observer.disconnect();
        clearTimeout(timeout);
      }
    });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      fallback();
    }, 5000);
    observer.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [state.navigationPhase, state.activeObject]);

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
      .filter(({ action }) => action === "focus" || action === "focus-zone")
      .map(({ id }) => id);
    const syncFromHistory = () => {
      if (window.location.hash === "#home") {
        dispatch({ type: "home.opened" });
        return;
      }
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

      const target = objectId;
      if (target === state.activeObject) return;
      const trigger = document.activeElement;
      if (
        trigger instanceof HTMLElement &&
        trigger.dataset.roomObject === target
      )
        triggers.current.set(target, trigger);
      window.history.pushState(
        roomHistoryState(target, state.activeObject),
        "",
        hashForObject(target),
      );
      dispatch({ type: "object.selected", objectId: target });
      dispatch({ type: "intro.minimized" });
    },
    [state.activeObject, state.locale],
  );
  const introVisible =
    state.introExpanded || (state.readingMode && !state.activeObject);

  return (
    <div
      className="app-shell"
      id="home"
      onClickCapture={(event) => {
        const trigger = (event.target as Element).closest<HTMLElement>(
          "[data-room-object], a[href^='#room/']",
        );
        const id =
          trigger?.dataset.roomObject ??
          trigger?.getAttribute("href")?.slice(6);
        if (trigger && id) triggers.current.set(id, trigger);
      }}
    >
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
        onReadingToggle={() => {
          if (!state.readingMode && !state.activeObject)
            handleRoomInteract("monitor");
          dispatch({ type: "reading.toggled" });
        }}
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
            onExplore={() => {
              if (state.readingMode) dispatch({ type: "reading.toggled" });
              dispatch({ type: "intro.minimized" });
            }}
          />
        )}
      </main>
    </div>
  );
}
