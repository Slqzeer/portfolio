import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { localize, portfolioContent } from "../content/portfolioContent";

describe("App", () => {
  it("renders the first-screen portfolio shell", () => {
    render(<App />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByText("Stage de fin d’études · février 2027"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navigation principale" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub" })).toBeDisabled();
  });

  it("switches the interface to English", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByText("End-of-study internship · February 2027"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Français" }),
    ).toBeInTheDocument();
  });

  it("minimizes the introduction before room exploration", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/Je transforme des données/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Explorer la chambre" }),
    );

    expect(
      screen.queryByText(/Je transforme des données/),
    ).not.toBeInTheDocument();
  });

  it("persists the lighting selected from the window", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: localize(portfolioContent.roomObjects.window.label, "fr"),
      }),
    );

    await waitFor(() =>
      expect(localStorage.getItem("portfolio-preferences")).toContain(
        '"lighting":"night"',
      ),
    );
  });
});
