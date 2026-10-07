import { localize } from "../content/portfolioContent";
import type { Locale, PortfolioContent } from "../content/types";

interface SiteHeaderProps {
  content: PortfolioContent;
  locale: Locale;
  onLocaleChange(locale: Locale): void;
}

const navigationTargets = {
  home: "#home",
  about: "#room/volleyball",
  projects: "#room/monitor",
  homelab: "#room/server",
  experience: "#room/education",
  contact: "#room/contact",
} as const;

export function SiteHeader({
  content,
  locale,
  onLocaleChange,
}: SiteHeaderProps) {
  const nextLocale = locale === "fr" ? "en" : "fr";

  return (
    <header className="site-header">
      <a
        className="brand"
        href="#home"
        aria-label={locale === "fr" ? "Accueil" : "Home"}
      >
        PN
      </a>
      <nav
        aria-label={
          locale === "fr" ? "Navigation principale" : "Main navigation"
        }
      >
        {Object.entries(navigationTargets).map(([key, href]) => (
          <a href={href} key={key}>
            {localize(
              content.navigation[key as keyof typeof navigationTargets],
              locale,
            )}
          </a>
        ))}
      </nav>
      <button
        className="language-toggle"
        type="button"
        onClick={() => onLocaleChange(nextLocale)}
      >
        {nextLocale === "en" ? "English" : "Français"}
      </button>
    </header>
  );
}
