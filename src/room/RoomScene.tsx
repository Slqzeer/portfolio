import { useState } from "react";
import type { Lighting } from "../app/appState";
import type { Locale, RoomObjectId } from "../content/types";
import { AccessibleRoomControls } from "./AccessibleRoomControls";
import { RoomCanvas } from "./RoomCanvas";
import { sceneManifest } from "./sceneManifest";
import { useIdleRoom } from "./useIdleRoom";
import "./room.css";

interface RoomSceneProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
}

const roomObjectIds = Object.keys(sceneManifest) as RoomObjectId[];

export function RoomScene({
  locale,
  lighting,
  activeObject,
  onInteract,
}: RoomSceneProps) {
  const [canvasFailed, setCanvasFailed] = useState(false);
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
        onInteract={onInteract}
        onReady={() => setCanvasFailed(false)}
        onError={() => setCanvasFailed(true)}
      />
      <AccessibleRoomControls
        locale={locale}
        activeObject={activeObject}
        canvasFailed={canvasFailed}
        onInteract={onInteract}
      />
    </section>
  );
}
