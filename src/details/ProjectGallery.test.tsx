import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { portfolioContent } from "../content/portfolioContent";
import { ProjectGallery } from "./ProjectGallery";

describe("ProjectGallery", () => {
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

    expect(
      screen.getByRole("heading", { name: "ClassPulse" }),
    ).toBeInTheDocument();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    await user.click(screen.getByText("Découvrir le projet"));
    expect(screen.getByText(/Mon rôle : contribuer/)).toBeVisible();

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
      ...portfolioContent.projects[0],
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
