import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { portfolioContent } from "../content/portfolioContent";
import { ProjectGallery } from "./ProjectGallery";

describe("ProjectGallery", () => {
  it("switches real screenshots and resets the preview when selecting another project", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const projects = portfolioContent.projects
      .filter(({ id }) => id === "portfolio" || id === "classpulse")
      .map((project) => ({ ...project, category: "software" as const }));
    render(
      <ProjectGallery
        projects={projects}
        locale="en"
        activeCategory="software"
        onCategoryChange={() => undefined}
        onScreenshotSelect={onSelect}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/assets/projects/portfolio-room.png",
    );
    await user.click(screen.getByRole("button", { name: "The room at night" }));
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/assets/projects/portfolio-night.png",
    );
    expect(onSelect).toHaveBeenLastCalledWith(
      "/assets/projects/portfolio-night.png",
    );
    await user.click(screen.getByRole("button", { name: "ClassPulse" }));
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/assets/projects/classpulse-homepage.png",
    );
    expect(
      screen.queryByRole("heading", { name: "A room, a portfolio." }),
    ).toBeNull();
  });
  it("filters projects and exposes their complete story", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    const { rerender } = render(
      <ProjectGallery
        projects={portfolioContent.projects}
        locale="fr"
        activeCategory="data-ai"
        onCategoryChange={onCategoryChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "ClassPulse" }));
    expect(screen.getByRole("heading", { name: "ClassPulse" })).toBeVisible();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    await user.click(screen.getByText("Découvrir le projet"));
    expect(
      screen.getByText(/Contribuer à la conception du système/),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Logiciel" }));
    expect(onCategoryChange).toHaveBeenCalledWith("software");

    rerender(
      <ProjectGallery
        projects={portfolioContent.projects}
        locale="en"
        activeCategory="homelab"
        onCategoryChange={onCategoryChange}
      />,
    );
    expect(screen.queryByRole("article")).toBeNull();
    expect(
      screen.getByText("No published projects in this category yet."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Discover software projects" }),
    );
    expect(onCategoryChange).toHaveBeenLastCalledWith("software");
  });

  it("renders populated project links with safe external attributes", () => {
    const project = {
      ...portfolioContent.projects.find(({ id }) => id === "portfolio")!,
      github: "https://github.com/example/project",
      demo: "https://example.com/demo",
    };

    render(
      <ProjectGallery
        projects={[project]}
        locale="en"
        activeCategory="software"
        onCategoryChange={() => undefined}
      />,
    );

    for (const name of ["GitHub", "View project"]) {
      expect(screen.getByRole("link", { name })).toMatchObject({
        target: "_blank",
        rel: "noopener noreferrer",
      });
    }
  });
});
