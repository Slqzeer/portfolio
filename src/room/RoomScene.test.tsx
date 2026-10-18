import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Lighting } from "../app/appState";
import type { Locale, RoomObjectId } from "../content/types";
import { RoomScene } from "./RoomScene";

vi.mock("./RoomCanvas", () => ({
  RoomCanvas: ({
    locale,
    lighting,
    activeObject,
    onInteract,
    onError,
    ambientPaused,
    reducedMotion,
  }: {
    locale: Locale;
    lighting: Lighting;
    activeObject: RoomObjectId | null;
    onInteract: (id: RoomObjectId) => void;
    onError: (error: Error) => void;
    ambientPaused: boolean;
    reducedMotion: boolean;
  }) => (
    <div
      data-testid="room-canvas"
      data-paused={ambientPaused}
      data-reduced-motion={reducedMotion}
      data-locale={locale}
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
  it("passes interaction and motion state to the canvas", async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn<(id: RoomObjectId) => void>();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject="server"
        ambientPaused
        reducedMotion
        onInteract={onInteract}
      />,
    );
    const canvas = await screen.findByTestId("room-canvas");
    expect(canvas).toHaveAttribute("data-active-object", "server");
    expect(canvas).toHaveAttribute("data-locale", "en");
    expect(canvas).toHaveAttribute("data-paused", "true");
    expect(canvas).toHaveAttribute("data-reduced-motion", "true");
    await user.click(screen.getByRole("button", { name: "model-server" }));
    expect(onInteract).toHaveBeenCalledWith("server");
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

  it("reports canvas failure so the header can expose fallback navigation", async () => {
    const user = userEvent.setup();
    const onUnavailable = vi.fn();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject={null}
        onInteract={() => undefined}
        onUnavailable={onUnavailable}
      />,
    );
    await user.click(
      await screen.findByRole("button", { name: "fail-canvas" }),
    );
    expect(onUnavailable).toHaveBeenCalledOnce();
  });
});
