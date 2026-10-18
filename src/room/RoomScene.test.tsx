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
  }: {
    locale: Locale;
    lighting: Lighting;
    activeObject: RoomObjectId | null;
    onInteract: (id: RoomObjectId) => void;
    onError: (error: Error) => void;
  }) => (
    <div
      data-testid="room-canvas"
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
  it("can re-enable and persist animations when the system reduces motion", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const user = userEvent.setup();
    const view = (
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject={null}
        onInteract={() => undefined}
        onClose={() => undefined}
      />
    );
    try {
      const { unmount } = render(view);
      expect(document.documentElement).toHaveAttribute(
        "data-motion",
        "reduced",
      );
      await user.click(screen.getByRole("button", { name: "Animations" }));
      expect(document.documentElement).toHaveAttribute("data-motion", "full");
      expect(localStorage.getItem("portfolio-motion")).toBe("full");
      unmount();
      render(view);
      expect(document.documentElement).toHaveAttribute("data-motion", "full");
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("persists the manual motion preference and pauses ambient motion", async () => {
    const user = userEvent.setup();
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject={null}
        onInteract={() => undefined}
        onClose={() => undefined}
      />,
    );
    const toggle = screen.getByRole("button", {
      name: "Animations",
    });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem("portfolio-motion")).toBe("reduced");
    expect(screen.getByTestId("room-scene")).toHaveAttribute(
      "data-ambient-paused",
      "true",
    );
    expect(document.documentElement).toHaveAttribute("data-motion", "reduced");
  });
  it("hosts the 3D canvas and accessible controls", async () => {
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject="server"
        onInteract={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Chambre interactive")).toBeInTheDocument();
    expect(await screen.findByTestId("room-canvas")).toHaveAttribute(
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
        onClose={() => undefined}
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
          onClose={() => undefined}
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
        onClose={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "fail-canvas" }));
    expect(
      screen.getByRole("navigation", { name: "Interactive room controls" }),
    ).toHaveAttribute("data-canvas-failed", "true");
  });

  it("passes the locale to the canvas and Back to onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <RoomScene
        locale="en"
        lighting="day"
        activeObject="desk"
        onInteract={() => undefined}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("room-canvas")).toHaveAttribute(
      "data-locale",
      "en",
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
