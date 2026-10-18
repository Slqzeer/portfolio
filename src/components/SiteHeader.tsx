import { useEffect, useRef } from "react";
import type { Lighting } from "../app/appState";
import { localize } from "../content/portfolioContent";
import type { Locale, PortfolioContent, RoomObjectId } from "../content/types";
import { AccessibleRoomControls } from "../room/AccessibleRoomControls";
import { Icon } from "./Icon";

interface SiteHeaderProps {
  content: PortfolioContent;
  locale: Locale;
  onLocaleChange(locale: Locale): void;
  activeObject: RoomObjectId | null;
  readingMode: boolean;
  onReadingToggle(): void;
  lighting: Lighting;
  animationsEnabled: boolean;
  onMotionToggle(): void;
  canvasFailed: boolean;
  onInteract(id: RoomObjectId): void;
  onClose(): void;
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
  readingMode,
  onReadingToggle,
  lighting,
  animationsEnabled,
  onMotionToggle,
  canvasFailed,
  onInteract,
  onClose,
}: SiteHeaderProps) {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const closeMenus = (event: PointerEvent | KeyboardEvent) => {
      const escape = event instanceof KeyboardEvent && event.key === "Escape";
      if (
        !escape &&
        (event instanceof KeyboardEvent ||
          header.current?.contains(event.target as Node))
      )
        return;
      const menu =
        header.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (!menu) return;
      if (escape && !menu.contains(document.activeElement)) return;
      menu.open = false;
      if (escape) {
        event.stopPropagation();
        menu.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);

  return (
    <header className="site-header" ref={header}>
      <a
        className="brand"
        href="#home"
        aria-label={locale === "fr" ? "Accueil" : "Home"}
      >
        <span className="brand-mark" aria-hidden="true">
          {content.identity.name
            .split(/\s+/)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span className="brand-caption">{content.identity.name}</span>
      </a>
      <div className="header-actions">
        <AccessibleRoomControls
          locale={locale}
          activeObject={activeObject}
          canvasFailed={canvasFailed}
          onInteract={onInteract}
          onClose={onClose}
        >
          <nav
            className="portfolio-navigation"
            aria-label={
              locale === "fr" ? "Navigation principale" : "Main navigation"
            }
            onClick={(event) => {
              if ((event.target as Element).closest("a")) {
                const menu = event.currentTarget.closest("details");
                if (menu) {
                  menu.open = false;
                  menu.querySelector("summary")?.focus();
                }
              }
            }}
          >
            <p className="menu-heading">
              {locale === "fr" ? "LE PORTFOLIO" : "THE PORTFOLIO"}
            </p>
            {Object.entries(navigationTargets).map(([key, href]) => (
              <a
                href={href}
                key={key}
                aria-current={
                  href === `#room/${activeObject}` ? "page" : undefined
                }
              >
                {localize(
                  content.navigation[key as keyof typeof navigationTargets],
                  locale,
                )}
                <Icon name="external" />
              </a>
            ))}
          </nav>
        </AccessibleRoomControls>
        <details className="settings-menu" name="portfolio-menu">
          <summary
            aria-label={
              locale === "fr" ? "Réglages de la visite" : "Visit settings"
            }
          >
            <Icon name="settings" />
            <span>{locale === "fr" ? "Réglages" : "Settings"}</span>
          </summary>
          <div className="menu-panel room-tools">
            <p className="menu-heading">
              {locale === "fr" ? "VOTRE VISITE" : "YOUR VISIT"}
            </p>
            <button
              type="button"
              className="tool-button theme-toggle"
              onClick={() => onInteract("window")}
              aria-label={
                locale === "fr" ? "Basculer jour / nuit" : "Toggle day / night"
              }
            >
              <Icon name={lighting === "day" ? "sun" : "moon"} />
              <span>{locale === "fr" ? "Ambiance" : "Lighting"}</span>
              <small>
                {lighting === "day"
                  ? locale === "fr"
                    ? "Jour"
                    : "Day"
                  : locale === "fr"
                    ? "Soir"
                    : "Evening"}
              </small>
            </button>
            <button
              type="button"
              className="tool-button motion-toggle"
              aria-pressed={animationsEnabled}
              aria-label="Animations"
              title={
                animationsEnabled
                  ? locale === "fr"
                    ? "Réduire les mouvements"
                    : "Reduce motion"
                  : locale === "fr"
                    ? "Activer les animations"
                    : "Enable animations"
              }
              onClick={onMotionToggle}
            >
              <Icon name="motion" />
              <span>Animations</span>
              <small>
                {animationsEnabled
                  ? locale === "fr"
                    ? "Activées"
                    : "On"
                  : locale === "fr"
                    ? "En pause"
                    : "Paused"}
              </small>
            </button>
            <button
              type="button"
              className="tool-button reading-toggle"
              aria-pressed={readingMode}
              aria-label={
                readingMode
                  ? locale === "fr"
                    ? "Explorer en 3D"
                    : "Explore in 3D"
                  : locale === "fr"
                    ? "Lecture rapide"
                    : "Quick reading"
              }
              onClick={(event) => {
                onReadingToggle();
                const menu = event.currentTarget.closest("details");
                if (menu) {
                  menu.open = false;
                  menu.querySelector("summary")?.focus();
                }
              }}
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
            <button
              type="button"
              className="tool-button language-toggle"
              aria-label={
                locale === "fr"
                  ? "Français, switch to English"
                  : "English, passer en français"
              }
              onClick={() => onLocaleChange(locale === "fr" ? "en" : "fr")}
            >
              <span aria-hidden="true">FR / EN</span>
              <span>{locale === "fr" ? "Langue" : "Language"}</span>
              <small>{locale === "fr" ? "Français" : "English"}</small>
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
