import { lazy, Suspense, useEffect, useState } from "react";
import type { Lighting, NavigationPhase } from "../app/appState";
import { Icon } from "../components/Icon";
import type { Locale, RoomObjectId } from "../content/types";
import { AccessibleRoomControls } from "./AccessibleRoomControls";
import { SceneBoundary } from "./SceneBoundary";
import { sceneManifest } from "./sceneManifest";
import { useIdleRoom } from "./useIdleRoom";
import "./room.css";

const RoomCanvas = lazy(() =>
  import("./RoomCanvas").then((module) => ({ default: module.RoomCanvas })),
);
const roomObjectIds = Object.keys(sceneManifest) as RoomObjectId[];

interface RoomSceneProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onClose: () => void;
  transitionId?: number;
  navigationPhase?: NavigationPhase;
  readingMode?: boolean;
  onArrive?: (transitionId: number) => void;
  onUnavailable?: () => void;
}

export function RoomScene({
  locale,
  lighting,
  activeObject,
  onInteract,
  onClose,
  transitionId,
  navigationPhase,
  readingMode = false,
  onArrive,
  onUnavailable,
}: RoomSceneProps) {
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [manualReduced, setManualReduced] = useState(() => {
    try {
      return localStorage.getItem("portfolio-motion") === "reduced";
    } catch {
      return false;
    }
  });
  const { ambientPaused, reducedMotion } = useIdleRoom({
    objectIds: roomObjectIds,
    forceReducedMotion: manualReduced || readingMode,
  });
  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion
      ? "reduced"
      : "full";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reducedMotion]);

  const poster = (
    <img
      className="room-poster"
      src={`/assets/room/room-overview-${lighting}.png`}
      alt=""
    />
  );
  const reportError = () => {
    setCanvasFailed(true);
    onUnavailable?.();
  };

  return (
    <section
      className="room-scene"
      data-testid="room-scene"
      data-lighting={lighting}
      data-curtains={lighting === "day" ? "open" : "closed"}
      data-window={lighting === "day" ? "daylight" : "dark"}
      data-lamps={lighting === "day" ? "off" : "on"}
      data-ambient-paused={ambientPaused}
      data-focused={!!activeObject}
      data-reading={readingMode}
      aria-label={locale === "fr" ? "Chambre interactive" : "Interactive room"}
    >
      {readingMode ? (
        <div className="reading-stage">
          {poster}
          <p>
            <Icon name="book" />
            {locale === "fr"
              ? "Un autre regard sur mon univers."
              : "Another way to discover my world."}
          </p>
        </div>
      ) : (
        <SceneBoundary
          onError={reportError}
          fallback={
            <div className="room-canvas" data-failed="true">
              {poster}
              <p role="status">
                {locale === "fr"
                  ? "La chambre est indisponible. Les rubriques restent accessibles."
                  : "The room is unavailable. All sections remain accessible."}
              </p>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="room-canvas room-module-loading">
                {poster}
                <span className="loading-caption">
                  {locale === "fr"
                    ? "Votre visite se prépare…"
                    : "Getting your visit ready…"}
                </span>
              </div>
            }
          >
            <RoomCanvas
              locale={locale}
              lighting={lighting}
              activeObject={activeObject}
              ambientPaused={ambientPaused}
              reducedMotion={reducedMotion}
              onInteract={onInteract}
              onReady={() => setCanvasFailed(false)}
              onError={reportError}
              transitionId={transitionId}
              onArrive={onArrive}
              interactionEnabled={navigationPhase !== "FOCUS"}
            />
          </Suspense>
        </SceneBoundary>
      )}
      <div className="room-caption" aria-hidden="true">
        <span className="status-dot" />
        {locale === "fr" ? "LA CHAMBRE" : "THE ROOM"}
        <span className="caption-rule" />
        {readingMode
          ? locale === "fr"
            ? "MODE LECTURE"
            : "READING MODE"
          : lighting === "day"
            ? locale === "fr"
              ? "ATELIER · LUMIÈRE DU JOUR"
              : "STUDIO · DAYLIGHT"
            : locale === "fr"
              ? "SOIR · LUMIÈRE DOUCE"
              : "EVENING · SOFT LIGHT"}
      </div>
      {!activeObject && !readingMode && (
        <div className="room-guide">
          <span className="guide-mouse" aria-hidden="true" />
          <p>
            {locale === "fr"
              ? "Chaque objet a quelque chose à raconter."
              : "Every object has a story to tell."}
            <small>
              {locale === "fr"
                ? "Cliquez sur un repère pour commencer"
                : "Choose a marker to start exploring"}
            </small>
          </p>
        </div>
      )}
      <AccessibleRoomControls
        locale={locale}
        activeObject={activeObject}
        canvasFailed={canvasFailed}
        onInteract={onInteract}
        onClose={onClose}
      />
      <div
        className="room-tools"
        aria-label={
          locale === "fr" ? "Réglages de la visite" : "Visit settings"
        }
      >
        <button
          type="button"
          className="tool-button theme-toggle"
          onClick={() => onInteract("window")}
          aria-label={
            locale === "fr" ? "Basculer jour / nuit" : "Toggle day / night"
          }
          title={
            lighting === "day"
              ? locale === "fr"
                ? "Passer à la nuit"
                : "Switch to night"
              : locale === "fr"
                ? "Retrouver le jour"
                : "Back to daylight"
          }
        >
          <Icon name={lighting === "day" ? "sun" : "moon"} />
          <span>
            {lighting === "day"
              ? locale === "fr"
                ? "Atelier"
                : "Studio"
              : locale === "fr"
                ? "Soir"
                : "Evening"}
          </span>
        </button>
        <span className="tool-separator" />
        <button
          type="button"
          className="tool-button"
          aria-pressed={manualReduced}
          aria-label={
            locale === "fr" ? "Réduire les mouvements" : "Reduce motion"
          }
          title={locale === "fr" ? "Réduire les mouvements" : "Reduce motion"}
          onClick={() => {
            const next = !manualReduced;
            setManualReduced(next);
            try {
              localStorage.setItem(
                "portfolio-motion",
                next ? "reduced" : "system",
              );
            } catch {
              /* Preference still applies for this visit. */
            }
          }}
        >
          <Icon name="motion" />
        </button>
      </div>
    </section>
  );
}
