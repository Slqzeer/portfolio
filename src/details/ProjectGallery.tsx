import { Icon } from "../components/Icon";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, Project, ProjectCategory } from "../content/types";
import { ProjectCover } from "./ProjectCover";

interface ProjectGalleryProps {
  projects: Project[];
  locale: Locale;
  activeCategory: ProjectCategory;
  onCategoryChange: (category: ProjectCategory) => void;
}

export function ProjectGallery({
  projects,
  locale,
  activeCategory,
  onCategoryChange,
}: ProjectGalleryProps) {
  const filtered = projects.filter(
    (project) => project.category === activeCategory,
  );
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
      {filtered.map((project, index) => {
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
            <ProjectCover variant={project.id} />
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
