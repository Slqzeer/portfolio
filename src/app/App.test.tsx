import { act, render, screen, waitFor } from "@testing-library/react";
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

  it("keeps one shareable focused object during rapid selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: localize(portfolioContent.roomObjects.server.label, "fr"),
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: localize(portfolioContent.roomObjects.monitor.label, "fr"),
      }),
    );

    expect(window.location.hash).toBe("#room/monitor");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", {
        name: localize(portfolioContent.details.projects.title, "fr"),
      }),
    ).toBeInTheDocument();
  });

  it("restores the trigger focus when Escape closes the detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    const monitor = screen.getByRole("button", {
      name: localize(portfolioContent.roomObjects.monitor.label, "fr"),
    });

    await user.click(monitor);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(monitor).toHaveFocus();
  });

  it("synchronizes browser history and ignores unknown hashes", () => {
    render(<App />);

    act(() => {
      window.history.replaceState(null, "", "#room/server");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(
      screen.getByRole("dialog", {
        name: localize(portfolioContent.details.homelab.title, "fr"),
      }),
    ).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "#room/unknown");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
