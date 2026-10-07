import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, ProjectCategory, RoomObjectId } from "../content/types";
import { ProjectGallery } from "./ProjectGallery";
import "./details.css";

interface ObjectDetailsProps {
  objectId: RoomObjectId;
  locale: Locale;
  onClose: () => void;
  activeCategory?: ProjectCategory;
  onCategoryChange?: (category: ProjectCategory) => void;
}

export function ObjectDetails({
  objectId,
  locale,
  onClose,
  activeCategory = "data-ai",
  onCategoryChange = () => undefined,
}: ObjectDetailsProps) {
  const detail =
    portfolioContent.details[portfolioContent.roomObjects[objectId].detailId];
  const titleId = `room-detail-${objectId}`;
  const details = (() => {
    switch (objectId) {
      case "monitor":
      case "controller":
      case "notebook":
        return (
          <ProjectGallery
            projects={portfolioContent.projects}
            locale={locale}
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
          />
        );
      case "server":
        return (
          <>
            <p>{localize(portfolioContent.homelab.description, locale)}</p>
            <ul>
              {portfolioContent.homelab.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </>
        );
      case "education":
        return portfolioContent.timeline.map((entry) => (
          <article key={entry.id}>
            <p>{entry.period}</p>
            <h3>{localize(entry.title, locale)}</h3>
            <p>{localize(entry.description, locale)}</p>
          </article>
        ));
      case "volleyball":
        return (
          <>
            <p>{localize(portfolioContent.volleyball.narrative, locale)}</p>
            <ul>
              {portfolioContent.volleyball.qualities.map((quality) => (
                <li key={quality.fr}>{localize(quality, locale)}</li>
              ))}
            </ul>
          </>
        );
      case "bookshelf":
        return (
          <ul>
            {portfolioContent.explorationTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        );
      case "contact":
        return (
          <>
            <p>{localize(portfolioContent.contact.invitation, locale)}</p>
            <p>{localize(portfolioContent.contact.location, locale)}</p>
            <div className="detail-links">
              {Object.values(portfolioContent.social).map((link) =>
                link.href ? (
                  <a key={link.label.fr} href={link.href}>
                    {localize(link.label, locale)}
                  </a>
                ) : (
                  <button key={link.label.fr} type="button" disabled>
                    {localize(link.label, locale)}
                  </button>
                ),
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <aside className="object-details" role="dialog" aria-labelledby={titleId}>
      <button type="button" className="detail-close" onClick={onClose}>
        {locale === "fr" ? "Fermer" : "Close"}
      </button>
      <h2 id={titleId}>{localize(detail.title, locale)}</h2>
      <p>{localize(detail.summary, locale)}</p>
      {portfolioContent.isSample && (
        <small>{locale === "fr" ? "Données exemples" : "Sample data"}</small>
      )}
      {details}
    </aside>
  );
}
