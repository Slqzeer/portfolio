import { Icon } from "../components/Icon";
import { useState } from "react";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, Project, ProjectCategory } from "../content/types";
import { ProjectCover } from "./ProjectCover";

interface ProjectGalleryProps {
  projects: Project[];
  locale: Locale;
  activeCategory: ProjectCategory;
  onCategoryChange: (category: ProjectCategory) => void;
  selectedProjectId?: string;
  onProjectSelect?: (id: string) => void;
  onScreenshotSelect?: (src: string) => void;
}

export function ProjectGallery({
  projects,
  locale,
  activeCategory,
  onCategoryChange,
  selectedProjectId,
  onProjectSelect,
  onScreenshotSelect,
}: ProjectGalleryProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const filtered = projects.filter(
    (project) => project.category === activeCategory,
  );
  const selected =
    filtered.find(({ id }) => id === (selectedProjectId ?? selection)) ??
    filtered[0];
  return (
    <div className="project-gallery">
      <div
        className="project-filters"
        aria-label={
          locale === "fr" ? "Catégories de projets" : "Project categories"
        }
      >
        {Object.entries(portfolioContent.projectCategories)
          .filter(
            ([category]) =>
              category === activeCategory ||
              projects.some((project) => project.category === category),
          )
          .map(([category, label]) => (
            <button
              type="button"
              key={category}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category as ProjectCategory)}
            >
              {localize(label, locale)}
              <small aria-hidden="true">
                {
                  projects.filter((project) => project.category === category)
                    .length
                }
              </small>
            </button>
          ))}
      </div>
      {filtered.length > 1 && (
        <div
          className="project-list"
          aria-label={
            locale === "fr" ? "Choisir un projet" : "Choose a project"
          }
        >
          {filtered.map((project) => (
            <button
              type="button"
              key={project.id}
              aria-pressed={project.id === selected?.id}
              onClick={() => {
                setSelection(project.id);
                onProjectSelect?.(project.id);
              }}
            >
              {localize(project.name, locale)}
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 && (
        <div className="project-empty">
          <Icon name="grid" />
          <h3>
            {locale === "fr"
              ? "La suite s’écrit ici."
              : "More stories to come."}
          </h3>
          <p>
            {locale === "fr"
              ? "Aucun projet publié dans cette catégorie pour le moment."
              : "No published projects in this category yet."}
          </p>
          <button type="button" onClick={() => onCategoryChange("software")}>
            {locale === "fr"
              ? "Découvrir les projets logiciel"
              : "Discover software projects"}
          </button>
        </div>
      )}
      {(selected ? [selected] : []).map((project) => {
        const index = filtered.indexOf(project);
        const fields = [
          [locale === "fr" ? "L’intention" : "The intention", project.problem],
          [locale === "fr" ? "La réponse" : "The approach", project.solution],
          ["Architecture", project.architecture],
          [
            locale === "fr" ? "Les défis" : "The challenges",
            project.challenges,
          ],
          [
            locale === "fr" ? "Ce que j’en retiens" : "What I learned",
            project.learnings,
          ],
        ] as const;
        return (
          <article className="project-card" key={project.id}>
            {project.screenshots?.length ? (
              <ProjectScreenshots
                key={project.id}
                project={project}
                locale={locale}
                onSelect={onScreenshotSelect}
              />
            ) : (
              <ProjectCover variant={project.id} />
            )}
            <div className="project-card-copy">
              <div className="project-meta">
                <span>
                  0{index + 1} /{" "}
                  {localize(
                    portfolioContent.projectCategories[project.category],
                    locale,
                  )}
                </span>
                <span>{localize(project.status, locale)}</span>
              </div>
              <h3>{localize(project.name, locale)}</h3>
              <p>{localize(project.summary, locale)}</p>
              <div className="project-stack">
                {project.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              {fields.some(([, value]) => localize(value, locale)) && (
                <details className="project-case">
                  <summary>
                    {locale === "fr"
                      ? "Découvrir le projet"
                      : "Explore the project"}
                    <Icon name="arrow" />
                  </summary>
                  <dl>
                    {fields
                      .filter(([, value]) => localize(value, locale))
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{localize(value, locale)}</dd>
                        </div>
                      ))}
                  </dl>
                </details>
              )}
              <div className="detail-links">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                    <Icon name="external" />
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {locale === "fr" ? "Voir le projet" : "View project"}
                    <Icon name="external" />
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProjectScreenshots({
  project,
  locale,
  onSelect,
}: {
  project: Project;
  locale: Locale;
  onSelect?: (src: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const screenshots = project.screenshots!;
  const screenshot = screenshots[index] ?? screenshots[0];
  return (
    <figure className="project-preview">
      <img
        key={screenshot.src}
        className="project-screenshot"
        src={screenshot.src}
        alt={localize(screenshot.alt, locale)}
        width="1440"
        height="900"
      />
      <figcaption>
        <span aria-live="polite">{localize(screenshot.alt, locale)}</span>
        {screenshots.length > 1 && (
          <div
            className="project-preview-pages"
            aria-label={
              locale === "fr" ? "Captures du projet" : "Project screenshots"
            }
          >
            {screenshots.map((shot, i) => (
              <button
                type="button"
                key={shot.src}
                aria-label={localize(shot.alt, locale)}
                aria-pressed={index === i}
                onClick={() => {
                  setIndex(i);
                  onSelect?.(shot.src);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
