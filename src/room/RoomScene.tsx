import { lazy, Suspense } from "react";
import type { Lighting, NavigationPhase } from "../app/appState";
import { Icon } from "../components/Icon";
import type { Locale, RoomObjectId } from "../content/types";
import { SceneBoundary } from "./SceneBoundary";
import "./room.css";

const RoomCanvas = lazy(() =>
  import("./RoomCanvas").then((module) => ({ default: module.RoomCanvas })),
);

interface RoomSceneProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  ambientPaused?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  transitionId?: number;
  navigationPhase?: NavigationPhase;
  readingMode?: boolean;
  onArrive?: (transitionId: number) => void;
  onUnavailable?: () => void;
  projectPreview?: string;
}

export function RoomScene({
  locale,
  lighting,
  activeObject,
  onInteract,
  ambientPaused = false,
  reducedMotion = false,
  onReady,
  transitionId,
  navigationPhase,
  readingMode = false,
  onArrive,
  onUnavailable,
  projectPreview,
}: RoomSceneProps) {
  const poster = (
    <img
      className="room-poster"
      src={`/assets/room/room-overview-${lighting}.png`}
      alt=""
    />
  );
  const reportError = () => {
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
      <div className="room-frame" aria-hidden="true" />
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
              projectPreview={projectPreview}
              ambientPaused={ambientPaused}
              reducedMotion={reducedMotion}
              onInteract={onInteract}
              onReady={() => onReady?.()}
              onError={reportError}
              transitionId={transitionId}
              onArrive={onArrive}
              interactionEnabled={navigationPhase !== "FOCUS"}
            />
          </Suspense>
        </SceneBoundary>
      )}
    </section>
  );
}
