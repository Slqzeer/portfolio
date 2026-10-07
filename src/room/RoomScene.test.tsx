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
  }: {
    lighting: Lighting;
    activeObject: RoomObjectId | null;
    onInteract: (id: RoomObjectId) => void;
  }) => (
    <div
      data-testid="room-canvas"
      data-lighting={lighting}
      data-active-object={activeObject ?? undefined}
    >
      <button type="button" onClick={() => onInteract("server")}>
        interact-server
      </button>
      <button type="button" onClick={() => onInteract("window")}>
        interact-window
      </button>
    </div>
  ),
}));

describe("RoomScene", () => {
  it("hosts the 3D canvas with localized scene labeling", () => {
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject="server"
        onSelect={() => undefined}
        onToggleLighting={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Chambre interactive")).toBeInTheDocument();
    expect(screen.getByTestId("room-canvas")).toHaveAttribute(
      "data-active-object",
      "server",
    );
  });

  it("routes model interactions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(id: RoomObjectId) => void>();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject={null}
        onSelect={onSelect}
        onToggleLighting={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "interact-server" }));
    expect(onSelect).toHaveBeenCalledWith("server");
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
          onSelect={() => undefined}
          onToggleLighting={() => undefined}
        />,
      );

      const scene = screen.getByTestId("room-scene");
      expect(scene).toHaveAttribute("data-curtains", curtains);
      expect(scene).toHaveAttribute("data-window", windowState);
      expect(scene).toHaveAttribute("data-lamps", lamps);
      expect(screen.getByTestId("room-canvas")).toHaveAttribute(
        "data-lighting",
        lighting,
      );
    },
  );

  it("uses the window as the lighting control", async () => {
    const user = userEvent.setup();
    const onToggleLighting = vi.fn();
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject={null}
        onSelect={() => undefined}
        onToggleLighting={onToggleLighting}
      />,
    );

    await user.click(screen.getByRole("button", { name: "interact-window" }));
    expect(onToggleLighting).toHaveBeenCalledOnce();
  });
});
