import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, RoomObjectId } from "../content/types";
import { roomObjectIdsForContext, sceneManifest } from "./sceneManifest";

interface AccessibleRoomControlsProps {
  locale: Locale;
  activeObject: RoomObjectId | null;
  canvasFailed: boolean;
  onInteract: (id: RoomObjectId) => void;
  onClose: () => void;
}

export function AccessibleRoomControls({
  locale,
  activeObject,
  canvasFailed,
  onInteract,
  onClose,
}: AccessibleRoomControlsProps) {
  return (
    <nav
      className="room-controls"
      aria-label={
        locale === "fr"
          ? "Commandes de la chambre interactive"
          : "Interactive room controls"
      }
      data-canvas-failed={canvasFailed}
    >
      {roomObjectIdsForContext(activeObject).map((id) => {
        const { action } = sceneManifest[id];
        return (
          <button
            key={id}
            type="button"
            data-room-object={id}
            data-room-action={action}
            aria-pressed={
              action === "focus" || action === "focus-zone"
                ? activeObject === id
                : undefined
            }
            onClick={() => onInteract(id)}
          >
            {localize(portfolioContent.roomObjects[id].label, locale)}
          </button>
        );
      })}
      {activeObject && (
        <button type="button" data-room-back onClick={onClose}>
          {locale === "fr" ? "Retour" : "Back"}
        </button>
      )}
    </nav>
  );
}
