import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

const scene = vi.hoisted(() => ({
  arrive: undefined as ((id: number) => void) | undefined,
  id: 0,
}));
vi.mock("../room/RoomScene", () => ({
  RoomScene: ({
    onInteract,
    onArrive,
    transitionId,
  }: {
    onInteract: (id: "monitor" | "server") => void;
    onArrive: (id: number) => void;
    transitionId: number;
  }) => {
    scene.arrive = onArrive;
    scene.id = transitionId;
    return (
      <>
        <button onClick={() => onInteract("monitor")}>model-monitor</button>
        <button onClick={() => onInteract("server")}>model-server</button>
      </>
    );
  },
}));

describe("camera and content sequencing", () => {
  it("opens during the approach and focuses only the latest arrival", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "model-monitor" }));
    const cancelled = scene.id;
    expect(screen.getByRole("dialog", { name: "Projets" })).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Projets" })).not.toHaveFocus();
    expect(screen.getByRole("main")).toHaveAttribute(
      "data-navigation-phase",
      "FOCUS",
    );
    await user.click(screen.getByRole("button", { name: "model-server" }));
    act(() => scene.arrive!(cancelled));
    expect(screen.getByRole("dialog", { name: "Homelab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Homelab" })).not.toHaveFocus();
    act(() => scene.arrive!(scene.id));
    expect(screen.getByRole("dialog", { name: "Homelab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Homelab" })).toHaveFocus();
  });

  it("cancels an approach with Escape and ignores its late arrival", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "model-monitor" }));
    const cancelled = scene.id;
    await user.keyboard("{Escape}");
    const exiting = screen.getByRole("dialog", { hidden: true });
    expect(exiting).toHaveAttribute("data-open", "false");
    expect(exiting).toHaveAttribute("inert");
    act(() => scene.arrive!(cancelled));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => scene.arrive!(scene.id));
    expect(screen.getByRole("main")).toHaveAttribute(
      "data-navigation-phase",
      "ROOM",
    );
  });
});
