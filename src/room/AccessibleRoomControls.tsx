import { useEffect, useRef } from "react";
import { Icon } from "../components/Icon";
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
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (canvasFailed && menu.current) menu.current.open = true;
  }, [canvasFailed]);
  return (
    <div className="room-controls">
      {activeObject && (
        <button
          className="room-back"
          type="button"
          data-room-back
          onClick={onClose}
          aria-label={locale === "fr" ? "Retour" : "Back"}
        >
          <Icon name="back" />
          <span>
            {locale === "fr" ? "Retour à la chambre" : "Back to the room"}
          </span>
          <kbd>ESC</kbd>
        </button>
      )}
      <details className="room-menu" ref={menu}>
        <summary
          aria-label={locale === "fr" ? "Toutes les rubriques" : "All sections"}
        >
          <Icon name="grid" />
          <span>
            {locale === "fr" ? "Toutes les rubriques" : "All sections"}
          </span>
          <span className="menu-plus" aria-hidden="true">
            +
          </span>
        </summary>
        <nav
          aria-label={
            locale === "fr"
              ? "Commandes de la chambre interactive"
              : "Interactive room controls"
          }
          data-canvas-failed={canvasFailed}
        >
          <p className="menu-heading">
            {locale === "fr"
              ? "CHOISISSEZ UNE DESTINATION"
              : "CHOOSE A DESTINATION"}
          </p>
          {roomObjectIdsForContext(activeObject).map((id, index) => {
            const { action } = sceneManifest[id];
            return (
              <button
                id={`room-shortcut-${id}`}
                key={id}
                type="button"
                data-room-object={id}
                data-room-action={action}
                aria-pressed={
                  action === "focus" || action === "focus-zone"
                    ? activeObject === id
                    : undefined
                }
                onClick={() => {
                  onInteract(id);
                  if (menu.current) menu.current.open = false;
                }}
              >
                <span className="shortcut-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  {localize(portfolioContent.roomObjects[id].label, locale)}
                </span>
                <Icon name="external" />
              </button>
            );
          })}
        </nav>
      </details>
    </div>
  );
}
