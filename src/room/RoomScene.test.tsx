import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { localize, portfolioContent } from "../content/portfolioContent";
import type { RoomObjectId } from "../content/types";
import { RoomScene } from "./RoomScene";

describe("RoomScene", () => {
  it("renders one localized native button for every room object", () => {
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject={null}
        onSelect={() => undefined}
        onToggleLighting={() => undefined}
      />,
    );

    for (const [id, object] of Object.entries(portfolioContent.roomObjects)) {
      const button = screen.getByRole("button", {
        name: localize(object.label, "fr"),
      });

      expect(button).toHaveAttribute("data-room-object", id);
    }
  });

  it("selects the activated object", async () => {
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

    await user.click(
      screen.getByRole("button", {
        name: localize(portfolioContent.roomObjects.server.label, "en"),
      }),
    );

    expect(onSelect).toHaveBeenCalledWith("server");
  });

  it("exposes the minimum 44px hotspot token", () => {
    render(
      <RoomScene
        locale="fr"
        lighting="day"
        activeObject={null}
        onSelect={() => undefined}
        onToggleLighting={() => undefined}
      />,
    );

    expect(screen.getByTestId("room-scene")).toHaveStyle({
      "--room-hit-target": "44px",
    });
  });
});
