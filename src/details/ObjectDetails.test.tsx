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

    rerender(
      <ObjectDetails
        objectId="education"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(
      screen.getByText("Fullstack development — CACIB"),
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
});
