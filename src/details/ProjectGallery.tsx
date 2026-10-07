import { localize, portfolioContent } from "../content/portfolioContent";
import type { Locale, Project, ProjectCategory } from "../content/types";

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
  return (
    <div className="project-gallery">
      <div className="project-filters">
        {Object.entries(portfolioContent.projectCategories).map(
          ([category, label]) => (
            <button
              type="button"
              key={category}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category as ProjectCategory)}
            >
              {localize(label, locale)}
            </button>
          ),
        )}
      </div>
      {projects
        .filter(({ category }) => category === activeCategory)
        .map((project) => (
          <article key={project.id}>
            <h3>{localize(project.name, locale)}</h3>
            <p>{localize(project.summary, locale)}</p>
            <p>{localize(project.problem, locale)}</p>
            <p>{localize(project.solution, locale)}</p>
            <p>{localize(project.architecture, locale)}</p>
            <p>{localize(project.challenges, locale)}</p>
            <p>{localize(project.learnings, locale)}</p>
            <p>{project.stack.join(" · ")}</p>
            <p>{localize(project.status, locale)}</p>
          </article>
        ))}
    </div>
  );
}
