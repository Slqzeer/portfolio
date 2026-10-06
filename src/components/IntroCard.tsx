import { localize } from "../content/portfolioContent";
import type { Locale, PortfolioContent } from "../content/types";

interface IntroCardProps {
  content: PortfolioContent;
  locale: Locale;
  onExplore(): void;
}

export function IntroCard({ content, locale, onExplore }: IntroCardProps) {
  return (
    <section className="intro-card" aria-labelledby="portfolio-title">
      <span className="availability">
        {localize(content.availability, locale)}
      </span>
      <p className="eyebrow">{content.identity.name}</p>
      <h1 id="portfolio-title">{localize(content.identity.role, locale)}</h1>
      <p className="introduction">
        {localize(content.identity.introduction, locale)}
      </p>
      <div className="intro-actions">
        <button className="primary-action" type="button" onClick={onExplore}>
          {localize(content.actions.explore, locale)}
        </button>
        <a href="#projects">{localize(content.navigation.projects, locale)}</a>
        <a href="#contact">{localize(content.navigation.contact, locale)}</a>
      </div>
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
    </section>
  );
}
