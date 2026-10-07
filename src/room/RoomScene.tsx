import type { CSSProperties } from "react";
import type { Lighting } from "../app/appState";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, RoomObjectId } from "../content/types";
import { RoomArtwork } from "./RoomArtwork";
import { roomObjects } from "./roomObjects";
import "./room.css";

interface RoomSceneProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onSelect: (id: RoomObjectId) => void;
  onToggleLighting: () => void;
}

type RoomSceneStyle = CSSProperties & { "--room-hit-target": string };

export function RoomScene({
  locale,
  lighting,
  activeObject,
  onSelect,
  onToggleLighting,
}: RoomSceneProps) {
  const sceneStyle: RoomSceneStyle = { "--room-hit-target": "44px" };

  return (
    <section
      className="room-scene"
      data-testid="room-scene"
      data-lighting={lighting}
      style={sceneStyle}
      aria-label={locale === "fr" ? "Chambre interactive" : "Interactive room"}
    >
      <RoomArtwork lighting={lighting} />
      <div className="room-hotspots">
        {roomObjects.map(({ id, hotspot, layerIndex }) => (
          <button
            className="room-hotspot"
            key={id}
            type="button"
            aria-label={localize(
              portfolioContent.roomObjects[id].label,
              locale,
            )}
            aria-pressed={activeObject === id}
            data-room-object={id}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
              zIndex: layerIndex,
            }}
            onClick={() => {
              onSelect(id);
              if (id === "window") onToggleLighting();
            }}
          />
        ))}
      </div>
    </section>
  );
}
