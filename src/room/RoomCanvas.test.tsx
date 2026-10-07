import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomCanvas } from "./RoomCanvas";

const canvas = vi.hoisted(() => ({ fails: false }));

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
    ["day", "/assets/room/room-poster-day.webp"],
    ["night", "/assets/room/room-poster-night.webp"],
  ] as const)(
    "keeps the %s poster until the canvas is ready",
    async (lighting, src) => {
      const user = userEvent.setup();
      render(<RoomCanvas {...defaultProps} lighting={lighting} />);

      expect(screen.getByTestId("room-poster")).toHaveAttribute("src", src);

      await user.click(screen.getByRole("button", { name: "ready" }));

      expect(screen.queryByTestId("room-poster")).not.toBeInTheDocument();
      expect(defaultProps.onReady).toHaveBeenCalledOnce();
    },
  );

  it("keeps the poster and reports a readable WebGL fallback", async () => {
    canvas.fails = true;
    render(<RoomCanvas {...defaultProps} />);

    expect(screen.getByTestId("room-poster")).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "3D scene unavailable",
    );
    expect(defaultProps.onError).toHaveBeenCalledOnce();
  });
});
