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
});
