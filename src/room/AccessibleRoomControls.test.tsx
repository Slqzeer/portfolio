import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { RoomObjectId } from "../content/types";
import { AccessibleRoomControls } from "./AccessibleRoomControls";
import { roomObjectIdsForContext } from "./sceneManifest";

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
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(
      roomObjectIdsForContext(null).length,
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
        onClose={vi.fn()}
      />,
    );

    const controls = screen.getByRole("navigation", {
      name: "Interactive room controls",
    });
    expect(controls).toHaveAttribute("data-canvas-failed", "true");

    await user.tab();
    expect(screen.getAllByRole("button")[0]).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onInteract).toHaveBeenCalledOnce();
  });

  it("shows top-level objects in the overview and desk children in desk focus", () => {
    const monitor = localize(portfolioContent.roomObjects.monitor.label, "fr");
    const smartphone = localize(
      portfolioContent.roomObjects.smartphone.label,
      "fr",
    );
    const { rerender } = render(
      <AccessibleRoomControls
        locale="fr"
        activeObject={null}
        canvasFailed={false}
        onInteract={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: localize(portfolioContent.roomObjects.desk.label, "fr"),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: monitor })).toBeNull();
    expect(screen.queryByRole("button", { name: smartphone })).toBeNull();

    rerender(
      <AccessibleRoomControls
        locale="fr"
        activeObject="desk"
        canvasFailed={false}
        onInteract={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: monitor })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: smartphone }),
    ).toBeInTheDocument();
  });

  it("offers a visible localized back button while a focus is active", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <AccessibleRoomControls
        locale="en"
        activeObject={null}
        canvasFailed={false}
        onInteract={vi.fn()}
        onClose={onClose}
      />,
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

    rerender(
      <AccessibleRoomControls
        locale="en"
        activeObject="desk"
        canvasFailed={false}
        onInteract={vi.fn()}
        onClose={onClose}
      />,
    );
    const back = screen.getByRole("button", { name: "Back" });
    expect(back).toBeVisible();
    await user.click(back);
    expect(onClose).toHaveBeenCalledOnce();

    rerender(
      <AccessibleRoomControls
        locale="fr"
        activeObject="monitor"
        canvasFailed={false}
        onInteract={vi.fn()}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("button", { name: "Retour" })).toBeVisible();
  });
});
