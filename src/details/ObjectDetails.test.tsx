import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObjectDetails } from "./ObjectDetails";

describe("ObjectDetails", () => {
  it("renders homelab, timeline, volleyball, exploration, and contact content", () => {
    const { rerender } = render(
      <ObjectDetails objectId="server" locale="en" onClose={() => undefined} />,
    );
    expect(screen.getByText("Docker")).toBeInTheDocument();

    rerender(
      <ObjectDetails
        objectId="education"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("2024–2027")).toBeInTheDocument();

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
    expect(screen.getByText("Local LLMs")).toBeInTheDocument();

    rerender(
      <ObjectDetails
        objectId="contact"
        locale="en"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText(/Let’s discuss/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub" })).toBeDisabled();
    expect(screen.getByText("Sample data")).toBeInTheDocument();
  });
});
