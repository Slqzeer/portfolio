import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Lighting } from "../app/appState";
import type { RoomObjectId } from "../content/types";
import { RoomScene } from "./RoomScene";

vi.mock("./RoomCanvas", () => ({
  RoomCanvas: ({
    lighting,
    activeObject,
    onInteract,
    onError,
  }: {
    lighting: Lighting;
    activeObject: RoomObjectId | null;
    onInteract: (id: RoomObjectId) => void;
    onError: (error: Error) => void;
  }) => (
    <div
      data-testid="room-canvas"
      data-lighting={lighting}
      data-active-object={activeObject ?? undefined}
    >
      <button type="button" onClick={() => onInteract("server")}>
        model-server
      </button>
      <button type="button" onClick={() => onError(new Error("WebGL"))}>
        fail-canvas
      </button>
    </div>
  ),
}));

describe("RoomScene", () => {
  it("hosts the 3D canvas and accessible controls", () => {
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject="server"
        onInteract={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Chambre interactive")).toBeInTheDocument();
    expect(screen.getByTestId("room-canvas")).toHaveAttribute(
      "data-active-object",
      "server",
    );
    expect(screen.getByRole("button", { name: "Homelab" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("routes model and keyboard interactions through one callback", async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn<(id: RoomObjectId) => void>();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject={null}
        onInteract={onInteract}
      />,
    );

    await user.click(screen.getByRole("button", { name: "model-server" }));
    await user.click(screen.getByRole("button", { name: "Change lighting" }));
    expect(onInteract.mock.calls).toEqual([["server"], ["window"]]);
  });

  it.each([
    ["day", "open", "daylight", "off"],
    ["night", "closed", "dark", "on"],
  ] as const)(
    "derives the complete %s lighting state",
    (lighting, curtains, windowState, lamps) => {
      render(
        <RoomScene
          locale="fr"
          lighting={lighting}
          activeObject={null}
          onInteract={() => undefined}
        />,
      );

      const scene = screen.getByTestId("room-scene");
      expect(scene).toHaveAttribute("data-curtains", curtains);
      expect(scene).toHaveAttribute("data-window", windowState);
      expect(scene).toHaveAttribute("data-lamps", lamps);
    },
  );

  it("keeps accessible controls active after canvas failure", async () => {
    const user = userEvent.setup();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject={null}
        onInteract={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "fail-canvas" }));
    expect(
      screen.getByRole("navigation", { name: "Interactive room controls" }),
    ).toHaveAttribute("data-canvas-failed", "true");
  });
});
