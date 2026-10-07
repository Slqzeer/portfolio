import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { RoomObjectId } from "../content/types";
import { AccessibleRoomControls } from "./AccessibleRoomControls";
import { sceneManifest } from "./sceneManifest";

describe("AccessibleRoomControls", () => {
  it("exposes every localized scene action through native buttons", async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn<(id: RoomObjectId) => void>();
    render(
      <AccessibleRoomControls
        locale="fr"
        activeObject={null}
        canvasFailed={false}
        onInteract={onInteract}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(
      Object.keys(sceneManifest).length,
    );
    const flag = screen.getByRole("button", {
      name: localize(portfolioContent.roomObjects.flag.label, "fr"),
    });
    await user.click(flag);
    expect(onInteract).toHaveBeenCalledWith("flag");
  });

  it("remains keyboard-usable when the canvas fails", async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn<(id: RoomObjectId) => void>();
    render(
      <AccessibleRoomControls
        locale="en"
        activeObject="monitor"
        canvasFailed
        onInteract={onInteract}
      />,
    );

    const controls = screen.getByRole("navigation", {
      name: "Interactive room controls",
    });
    expect(controls).toHaveAttribute("data-canvas-failed", "true");

    await user.tab();
    expect(screen.getAllByRole("button")[0]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onInteract).toHaveBeenCalledOnce();
  });
});
