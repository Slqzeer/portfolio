import { localize } from "../content/portfolioContent";
import type { Locale, PortfolioContent } from "../content/types";
import { Icon } from "./Icon";

interface IntroCardProps {
  content: PortfolioContent;
  locale: Locale;
  onExplore(): void;
}

export function IntroCard({ content, locale, onExplore }: IntroCardProps) {
  return (
    <section className="intro-card" aria-labelledby="portfolio-title">
      <p className="hero-kicker">
        <span />{" "}
        {locale === "fr"
          ? "UN ESPACE PERSONNEL, UN PARCOURS À DÉCOUVRIR"
          : "A PERSONAL SPACE, A STORY TO DISCOVER"}
      </p>
      <p className="eyebrow">{content.identity.name}</p>
      <h1 id="portfolio-title">
        {locale === "fr" ? "Mon univers." : "My world."}
        <br />
        <em>{locale === "fr" ? "À explorer." : "Yours to explore."}</em>
      </h1>
      <p className="hero-role">{localize(content.identity.role, locale)}</p>
      <p className="introduction">
        {localize(content.identity.introduction, locale)}
      </p>
      <div className="intro-actions">
        <button className="primary-action" type="button" onClick={onExplore}>
          {localize(content.actions.explore, locale)}
          <span className="action-icon">
            <Icon name="arrow" />
          </span>
        </button>
        <a href="#room/monitor">
          {localize(content.navigation.projects, locale)}
          <Icon name="external" />
        </a>
      </div>
      <p className="availability">
        <span className="status-dot" />
        {localize(content.availability, locale)}
      </p>
      <div className="social-actions">
        {Object.entries(content.social).map(([id, link]) =>
          link.href ? (
            <a
              href={link.href}
              key={id}
              target="_blank"
              rel="noopener noreferrer"
            >
              {localize(link.label, locale)}
            </a>
          ) : (
            <button
              type="button"
              key={id}
              disabled
              title={localize(content.actions.replaceLink, locale)}
            >
              {localize(link.label, locale)}
            </button>
          ),
        )}
      </div>
      {content.isSample && (
        <span className="sample-note">
          {locale === "fr"
            ? "Contenu de démonstration · à personnaliser"
            : "Demo content · ready to personalize"}
        </span>
      )}
    </section>
  );
}
