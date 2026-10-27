import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObjectDetails } from "./ObjectDetails";

describe("ObjectDetails", () => {
  it("keeps the reader's focus when the camera finishes approaching", () => {
    const { rerender } = render(
      <ObjectDetails
        objectId="server"
        locale="en"
        ready={false}
        onClose={() => undefined}
      />,
    );
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    rerender(
      <ObjectDetails objectId="server" locale="en" onClose={() => undefined} />,
    );
    expect(close).toHaveFocus();
  });

  it("renders homelab, timeline, volleyball, exploration, and contact content", () => {
    const { rerender } = render(
      <ObjectDetails objectId="server" locale="en" onClose={() => undefined} />,
    );
    expect(screen.getByText(/Understand what happens/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Homelab Portal" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/Slqzeer/homelab-portal",
    );

    rerender(
      <ObjectDetails
        objectId="education"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(
      screen.getByText(
        "Full-stack development internship — Crédit Agricole CIB",
      ),
    ).toBeInTheDocument();

    rerender(
      <ObjectDetails
        objectId="volleyball"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("Teamwork")).toBeInTheDocument();

    rerender(
      <ObjectDetails
        objectId="bookshelf"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    expect(screen.getByText("SVMs and kernel methods")).toBeInTheDocument();
    expect(screen.getByText("Backend testing")).toBeInTheDocument();

    rerender(
      <ObjectDetails
        objectId="contact"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText(/An idea, a project/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/Slqzeer",
    );
  });

  it("keeps project roles separated between the monitor, controller, and phone", () => {
    const { rerender } = render(
      <ObjectDetails
        objectId="monitor"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Data & AI" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Software" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Games" })).toBeNull();

    rerender(
      <ObjectDetails
        objectId="controller"
        locale="en"
        activeCategory="game-development"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: "Pass-Through" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Data & AI" })).toBeNull();

    rerender(
      <ObjectDetails
        objectId="smartphone"
        locale="en"
        activeCategory="experiments"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: "Hermes" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Games" })).toBeNull();
  });
});
