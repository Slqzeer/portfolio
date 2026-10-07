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

    expect(screen.getByText(/Assistant documentaire/)).toBeInTheDocument();
    expect(screen.getByText("Python · PostgreSQL · React")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Homelab" }));
    expect(onCategoryChange).toHaveBeenCalledWith("homelab");

    rerender(
      <ProjectGallery
        projects={portfolioContent.projects}
        locale="en"
        activeCategory="homelab"
        onCategoryChange={onCategoryChange}
      />,
    );
    expect(screen.getByText(/Homelab observability/)).toBeInTheDocument();
    expect(screen.getByText(/Every alert should/)).toBeInTheDocument();
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
        activeCategory="data-ai"
        onCategoryChange={() => undefined}
      />,
    );

    for (const name of ["GitHub", "Demo"]) {
      expect(screen.getByRole("link", { name })).toMatchObject({
        target: "_blank",
        rel: "noopener noreferrer",
      });
    }
  });
});
