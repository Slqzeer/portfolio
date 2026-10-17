import { useEffect, useRef } from "react";
import { Icon } from "../components/Icon";
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
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
    if (body.current) body.current.scrollTop = 0;
  }, [objectId]);
  const details = (() => {
    switch (objectId) {
      case "monitor":
      case "controller":
      case "smartphone":
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
            <div className="homelab-cover">
              <svg viewBox="0 0 480 220" aria-hidden="true">
                <rect width="480" height="220" fill="#dce4d8" />
                <g transform="translate(160 28)">
                  {[0, 1, 2, 3].map((row) => (
                    <g key={row} transform={`translate(0 ${row * 38})`}>
                      <rect width="160" height="30" rx="4" fill="#304a40" />
                      <path d="M12 10h70m-70 5h70m-70 5h70" stroke="#6d8678" />
                      <circle cx="140" cy="15" r="3" fill="#b7d59e" />
                    </g>
                  ))}
                </g>
                <path d="M240 186v18m-90 0h180" stroke="#6d8678" fill="none" />
              </svg>
            </div>
            <h3 className="homelab-intro">
              {locale === "fr"
                ? "Comprendre ce qui se passe derrière l’écran."
                : "Understand what happens behind the screen."}
            </h3>
            <p>{localize(portfolioContent.homelab.description, locale)}</p>
            <div className="service-tags">
              {portfolioContent.homelab.services.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </>
        );
      case "education":
        return portfolioContent.timeline.length ? (
          <ol className="journey-list">
            {portfolioContent.timeline.map((entry) => (
              <li key={entry.id}>
                <span className="journey-period">
                  {localize(entry.period, locale)}
                </span>
                <h3>{localize(entry.title, locale)}</h3>
                <p>{localize(entry.description, locale)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="project-empty">
            <Icon name="book" />
            <h3>
              {locale === "fr"
                ? "Un parcours à raconter."
                : "A journey to share."}
            </h3>
            <p>
              {locale === "fr"
                ? "Les étapes de formation et les expériences seront ajoutées ici."
                : "Education and experience will be added here."}
            </p>
            <a
              href={portfolioContent.social.linkedin.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
          </div>
        );
      case "volleyball":
        return (
          <>
            <blockquote className="personal-quote">
              {localize(portfolioContent.volleyball.title, locale)}
            </blockquote>
            <p>{localize(portfolioContent.volleyball.narrative, locale)}</p>
            <ul className="quality-list">
              {portfolioContent.volleyball.qualities.map((quality) => (
                <li key={quality.fr}>{localize(quality, locale)}</li>
              ))}
            </ul>
          </>
        );
      case "bookshelf":
        return (
          <>
            <p className="section-kicker">
              {locale === "fr"
                ? "DANS LES COULISSES DE CE PORTFOLIO"
                : "BEHIND THIS PORTFOLIO"}
            </p>
            {portfolioContent.skills.map((group, index) => (
              <section className="skill-group" key={group.group.fr}>
                <div className="skill-heading">
                  <span>0{index + 1}</span>
                  <h3>{localize(group.group, locale)}</h3>
                </div>
                <div className="skill-tags">
                  {group.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
            ))}
            <p className="section-kicker">
              {locale === "fr" ? "À EXPLORER" : "TO EXPLORE"}
            </p>
            <ul className="topic-list">
              {portfolioContent.explorationTopics.map((topic) => (
                <li key={topic.fr}>{localize(topic, locale)}</li>
              ))}
            </ul>
          </>
        );
      case "contact":
        return (
          <>
            <h3 className="contact-intro">
              {localize(portfolioContent.contact.invitation, locale)}
            </h3>
            <p className="contact-location">
              {localize(portfolioContent.contact.location, locale)}
            </p>
            <div className="contact-links">
              {Object.entries(portfolioContent.social)
                .filter(([, link]) => link.href)
                .map(([id, link]) => (
                  <a
                    key={id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="contact-link-mark" aria-hidden="true">
                      {id === "linkedin" ? "in" : id === "github" ? "⌘" : "↗"}
                    </span>
                    <span>
                      {localize(link.label, locale)}
                      <small>
                        {id === "github"
                          ? "@Slqzeer"
                          : portfolioContent.identity.name}
                      </small>
                    </span>
                    <Icon name="external" />
                  </a>
                ))}
            </div>
            <p className="contact-note">
              {locale === "fr"
                ? "Merci d’avoir pris le temps de visiter mon univers."
                : "Thank you for taking the time to explore my world."}
            </p>
          </>
        );
      default:
        return null;
    }
  })();
  return (
    <aside className="object-details" role="dialog" aria-labelledby={titleId}>
      <header className="detail-header">
        <p className="detail-eyebrow">
          <span>↗</span>
          {portfolioContent.identity.name} /{" "}
          {locale === "fr" ? "DANS MA CHAMBRE" : "IN MY ROOM"}
        </p>
        <button
          type="button"
          className="detail-close"
          aria-label={locale === "fr" ? "Fermer" : "Close"}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <h2 id={titleId} ref={heading} tabIndex={-1}>
          {localize(detail.title, locale)}
        </h2>
        <p className="detail-summary">{localize(detail.summary, locale)}</p>
        {portfolioContent.isSample && (
          <small className="sample-label">
            {locale === "fr" ? "Données exemples" : "Sample data"}
          </small>
        )}
      </header>
      <div className="detail-body" ref={body}>
        {details}
      </div>
      <footer className="detail-footer">
        <span>MC — PORTFOLIO</span>
        <span>
          {locale === "fr"
            ? "EXPLORER. COMPRENDRE. ÉCHANGER."
            : "EXPLORE. UNDERSTAND. CONNECT."}
        </span>
      </footer>
    </aside>
  );
}
