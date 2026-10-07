import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, RoomObjectId } from "../content/types";
import "./details.css";

interface ObjectDetailsProps {
  objectId: RoomObjectId;
  locale: Locale;
  onClose: () => void;
}

export function ObjectDetails({
  objectId,
  locale,
  onClose,
}: ObjectDetailsProps) {
  const detail =
    portfolioContent.details[portfolioContent.roomObjects[objectId].detailId];
  const titleId = `room-detail-${objectId}`;

  return (
    <aside className="object-details" role="dialog" aria-labelledby={titleId}>
      <button type="button" className="detail-close" onClick={onClose}>
        {locale === "fr" ? "Fermer" : "Close"}
      </button>
      <h2 id={titleId}>{localize(detail.title, locale)}</h2>
      <p>{localize(detail.summary, locale)}</p>
    </aside>
  );
}
