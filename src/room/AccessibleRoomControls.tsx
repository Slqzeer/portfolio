import { useEffect, useRef, type ReactNode } from "react";
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
  children?: ReactNode;
}

export function AccessibleRoomControls({
  locale,
  activeObject,
  canvasFailed,
  onInteract,
  onClose,
  children,
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
      <details className="room-menu" name="portfolio-menu" ref={menu}>
        <summary
          aria-label={locale === "fr" ? "Toutes les rubriques" : "All sections"}
        >
          <Icon name="grid" />
          <span>{locale === "fr" ? "Explorer" : "Explore"}</span>
          <span className="menu-plus" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="menu-panel">
          {children}
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
          <p className="menu-hint">
            {locale === "fr"
              ? "Vous pouvez aussi cliquer sur les objets de la chambre."
              : "You can also click the objects in the room."}
          </p>
        </div>
      </details>
    </div>
  );
}
