import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Object3D, Vector3 } from "three";
import { Icon } from "../components/Icon";
import { portfolioContent } from "../content/portfolioContent";
import type { Locale, RoomObjectId } from "../content/types";
import { sceneManifest } from "./sceneManifest";

const markers = [
  { id: "monitor", fr: "Les projets", en: "The projects" },
  { id: "server", fr: "Le homelab", en: "The homelab" },
  { id: "bookshelf", fr: "Les compétences", en: "The skills" },
  { id: "education", fr: "Le parcours", en: "The journey" },
  { id: "volleyball", fr: "Un peu de moi", en: "A bit about me" },
  {
    id: "contact",
    fr: "Restons en contact",
    en: "Let's connect",
  },
] as const;

export function RoomHotspots({
  scene,
  locale,
  onInteract,
  onHover,
  hoveredObject,
  showMarkers,
}: {
  scene: Object3D;
  locale: Locale;
  onInteract: (id: RoomObjectId) => void;
  onHover: (id: RoomObjectId | null) => void;
  hoveredObject: RoomObjectId | null;
  showMarkers: boolean;
}) {
  const positions = useMemo(
    () =>
      Object.fromEntries(
        Object.values(sceneManifest).map(({ id, nodeName }) => {
          const object = scene.getObjectByName(nodeName);
          if (!object) return [id, null];
          const box = new Box3().setFromObject(object);
          if (box.isEmpty()) return [id, null];
          const point = box.getCenter(new Vector3());
          point.y = box.max.y + 0.16;
          return [id, point];
        }),
      ) as Record<RoomObjectId, Vector3 | null>,
    [scene],
  );

  return (
    <>
      {markers.map(
        (marker, index) =>
          showMarkers &&
          positions[marker.id] && (
            <Html
              key={marker.id}
              position={positions[marker.id]!}
              center
              zIndexRange={[8, 2]}
              wrapperClass="hotspot-anchor"
            >
              <button
                id={`room-hotspot-${marker.id}`}
                className="room-hotspot"
                type="button"
                data-room-object={marker.id}
                data-hovered={hoveredObject === marker.id}
                data-label-side={
                  marker.id === "server" || marker.id === "bookshelf"
                    ? "left"
                    : "right"
                }
                data-secondary={index > 3}
                aria-label={marker[locale]}
                onPointerEnter={() => onHover(marker.id)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(marker.id)}
                onBlur={() => onHover(null)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onInteract(marker.id);
                }}
              >
                <span className="hotspot-dot" aria-hidden="true" />
                <span className="hotspot-label" aria-hidden="true">
                  {marker[locale]}
                  <Icon name="external" />
                </span>
              </button>
            </Html>
          ),
      )}
      {hoveredObject &&
        positions[hoveredObject] &&
        (!showMarkers || !markers.some(({ id }) => id === hoveredObject)) && (
          <Html
            position={positions[hoveredObject]!}
            center
            zIndexRange={[8, 2]}
            style={{ pointerEvents: "none" }}
          >
            <span className="hotspot-label object-hover-label">
              {portfolioContent.roomObjects[hoveredObject].label[locale]}
            </span>
          </Html>
        )}
    </>
  );
}
