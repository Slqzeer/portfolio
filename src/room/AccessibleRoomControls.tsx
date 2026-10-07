import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";

interface AccessibleRoomControlsProps {
  locale: Locale;
  activeObject: RoomObjectId | null;
  canvasFailed: boolean;
  onInteract: (id: RoomObjectId) => void;
}

export function AccessibleRoomControls({
  locale,
  activeObject,
  canvasFailed,
  onInteract,
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
      {Object.values(sceneManifest).map(({ id, action }) => (
        <button
          key={id}
          type="button"
          data-room-object={id}
          data-room-action={action}
          aria-pressed={action === "focus" ? activeObject === id : undefined}
          onClick={() => onInteract(id)}
        >
          {localize(portfolioContent.roomObjects[id].label, locale)}
        </button>
      ))}
    </nav>
  );
}
