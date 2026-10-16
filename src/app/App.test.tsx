import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { localize, portfolioContent } from "../content/portfolioContent";

const label = (id: keyof typeof portfolioContent.roomObjects) =>
  localize(portfolioContent.roomObjects[id].label, "fr");

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

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

    await user.click(
      screen.getByRole("button", { name: "Français, switch to English" }),
    );

    expect(
      screen.getByText("End-of-study internship · February 2027"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "English, passer en français" }),
    ).toBeInTheDocument();
  });

  it("uses the room flag to change language", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Changer de langue" }));

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(window.location.hash).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("minimizes the introduction before room exploration", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/Je transforme des données/)).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("data-intro-open", "true");
    await user.click(
      screen.getByRole("button", { name: "Explorer la chambre" }),
    );

    expect(
      screen.queryByText(/Je transforme des données/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute(
      "data-intro-open",
      "false",
    );
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
    expect(window.location.hash).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
        name: localize(portfolioContent.roomObjects.controller.label, "fr"),
      }),
    );

    expect(window.location.hash).toBe("#room/controller");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", {
        name: localize(
          portfolioContent.details["game-development"].title,
          "fr",
        ),
      }),
    ).toBeInTheDocument();
  });

  it("restores the trigger focus when Escape closes the detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    const server = screen.getByRole("button", { name: label("server") });

    await user.click(server);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(server).toHaveFocus();
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

  it("opens the same content from conventional navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Navigation principale" }),
      ).getByRole("link", { name: "Projets" }),
    );

    await waitFor(() => expect(window.location.hash).toBe("#room/monitor"));
    expect(
      screen.getByRole("dialog", {
        name: localize(portfolioContent.details.projects.title, "fr"),
      }),
    ).toBeInTheDocument();
  });

  it("enters desk focus from the overview without a detail panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: label("desk") }));

    expect(window.location.hash).toBe("#room/desk");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: label("monitor") }),
    ).toBeInTheDocument();
  });

  it("closes a desk child to the desk, then the desk to the overview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: label("desk") }));
    await user.click(screen.getByRole("button", { name: label("monitor") }));
    expect(window.location.hash).toBe("#room/monitor");
    expect(
      screen.getByRole("dialog", {
        name: localize(portfolioContent.details.projects.title, "fr"),
      }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(window.location.hash).toBe("#room/desk"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(
      screen.queryByRole("button", { name: label("monitor") }),
    ).not.toBeInTheDocument();
  });

  it("closes a direct desk child URL to the desk", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#room/monitor");
    render(<App />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(window.location.hash).toBe("#room/desk");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(window.location.hash).toBe("");
  });

  it("opens game projects directly from the controller", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: label("controller") }));

    expect(window.location.hash).toBe("#room/controller");
    expect(
      screen.getByRole("dialog", {
        name: localize(
          portfolioContent.details["game-development"].title,
          "fr",
        ),
      }),
    ).toBeInTheDocument();
  });
});
