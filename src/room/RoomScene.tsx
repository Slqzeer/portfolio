import type { Lighting } from "../app/appState";
import type { Locale, RoomObjectId } from "../content/types";
import { RoomCanvas } from "./RoomCanvas";
import { sceneManifest } from "./sceneManifest";
import { useIdleRoom } from "./useIdleRoom";
import "./room.css";

interface RoomSceneProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onSelect: (id: RoomObjectId) => void;
  onToggleLighting: () => void;
}

const roomObjectIds = Object.keys(sceneManifest) as RoomObjectId[];

export function RoomScene({
  locale,
  lighting,
  activeObject,
  onSelect,
  onToggleLighting,
}: RoomSceneProps) {
  const { ambientPaused, reducedMotion } = useIdleRoom({
    objectIds: roomObjectIds,
  });

  return (
    <section
      className="room-scene"
      data-testid="room-scene"
      data-lighting={lighting}
      data-curtains={lighting === "day" ? "open" : "closed"}
      data-window={lighting === "day" ? "daylight" : "dark"}
      data-lamps={lighting === "day" ? "off" : "on"}
      data-ambient-paused={ambientPaused}
      aria-label={locale === "fr" ? "Chambre interactive" : "Interactive room"}
    >
      <RoomCanvas
        lighting={lighting}
        activeObject={activeObject}
        ambientPaused={ambientPaused}
        reducedMotion={reducedMotion}
        onInteract={(id) => {
          onSelect(id);
          if (id === "window") onToggleLighting();
        }}
        onReady={() => undefined}
        onError={() => undefined}
      />
    </section>
  );
}
