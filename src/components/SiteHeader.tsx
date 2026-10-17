import { localize } from "../content/portfolioContent";
import type { Locale, PortfolioContent } from "../content/types";
import type { RoomObjectId } from "../content/types";
import { Icon } from "./Icon";

interface SiteHeaderProps {
  content: PortfolioContent;
  locale: Locale;
  onLocaleChange(locale: Locale): void;
  activeObject?: RoomObjectId | null;
  readingMode?: boolean;
  onReadingToggle?: () => void;
}

const navigationTargets = {
  home: "#home",
  projects: "#room/monitor",
  skills: "#room/bookshelf",
  homelab: "#room/server",
  experience: "#room/education",
  contact: "#room/contact",
} as const;

export function SiteHeader({
  content,
  locale,
  onLocaleChange,
  activeObject,
  readingMode = false,
  onReadingToggle,
}: SiteHeaderProps) {
  const nextLocale = locale === "fr" ? "en" : "fr";

  return (
    <header className="site-header">
      <a
        className="brand"
        href="#home"
        aria-label={locale === "fr" ? "Accueil" : "Home"}
      >
        <span className="brand-mark">
          {content.identity.name
            .split(/\s+/)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span className="brand-caption">
          {content.identity.name}
          <small>
            {locale === "fr" ? "PORTFOLIO PERSONNEL" : "PERSONAL PORTFOLIO"}
          </small>
        </span>
      </a>
      <nav
        aria-label={
          locale === "fr" ? "Navigation principale" : "Main navigation"
        }
      >
        {Object.entries(navigationTargets).map(([key, href], index) => (
          <a
            href={href}
            key={key}
            aria-current={href === `#room/${activeObject}` ? "page" : undefined}
          >
            <span className="nav-index" aria-hidden="true">
              {String(index).padStart(2, "0")}
            </span>
            {localize(
              content.navigation[key as keyof typeof navigationTargets],
              locale,
            )}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        {onReadingToggle && (
          <button
            className="reading-toggle"
            type="button"
            aria-label={
              readingMode
                ? locale === "fr"
                  ? "Explorer en 3D"
                  : "Explore in 3D"
                : locale === "fr"
                  ? "Lecture rapide"
                  : "Quick reading"
            }
            aria-pressed={readingMode}
            onClick={onReadingToggle}
          >
            <Icon name="book" />
            <span>
              {readingMode
                ? locale === "fr"
                  ? "Explorer en 3D"
                  : "Explore in 3D"
                : locale === "fr"
                  ? "Lecture rapide"
                  : "Quick reading"}
            </span>
          </button>
        )}
        <button
          className="language-toggle"
          type="button"
          aria-label={
            locale === "fr"
              ? "Français, switch to English"
              : "English, passer en français"
          }
          onClick={() => onLocaleChange(nextLocale)}
        >
          <span aria-hidden="true">{locale === "en" ? "EN" : "FR"}</span>
        </button>
      </div>
    </header>
  );
}
