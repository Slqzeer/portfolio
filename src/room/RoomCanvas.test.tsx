import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomCanvas } from "./RoomCanvas";

const canvas = vi.hoisted(() => ({ fails: false, progress: 0 }));

vi.mock("@react-three/drei", () => ({
  useProgress: () => ({ progress: canvas.progress }),
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: ReactNode }) => {
    if (canvas.fails) throw new Error("WebGL is unavailable");
    return <div data-testid="webgl-canvas">{children}</div>;
  },
  useFrame: () => undefined,
  useThree: () => ({
    gl: {
      domElement: document.createElement("canvas"),
      info: { render: { calls: 1 } },
    },
  }),
}));

vi.mock("./RoomModel", () => ({
  RoomModel: ({ onReady }: { onReady: () => void }) => (
    <button type="button" onClick={onReady}>
      ready
    </button>
  ),
}));

const defaultProps = {
  locale: "fr" as const,
  lighting: "day" as const,
  activeObject: null,
  onInteract: vi.fn(),
  onReady: vi.fn(),
  onError: vi.fn(),
};

describe("RoomCanvas", () => {
  beforeEach(() => {
    canvas.fails = false;
    vi.clearAllMocks();
  });

  it.each([
    ["fr", "Chargement de la chambre"],
    ["en", "Loading the room"],
  ] as const)(
    "shows a %s loading screen with progress until the canvas is ready",
    async (locale, label) => {
      const user = userEvent.setup();
      canvas.progress = 42;
      render(<RoomCanvas {...defaultProps} locale={locale} />);

      expect(screen.getByRole("progressbar", { name: label })).toHaveAttribute(
        "aria-valuenow",
        "42",
      );
      expect(screen.queryByTestId("room-poster")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "ready" }));

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(defaultProps.onReady).toHaveBeenCalledOnce();
    },
  );

  it("keeps the poster and reports a readable WebGL fallback", async () => {
    canvas.fails = true;
    render(<RoomCanvas {...defaultProps} />);

    expect(screen.getByTestId("room-poster")).toHaveAttribute(
      "src",
      "/assets/room/room-poster-day.webp",
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "3D scene unavailable",
    );
    expect(defaultProps.onError).toHaveBeenCalledOnce();
  });
});
