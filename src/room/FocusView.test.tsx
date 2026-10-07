import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { roomObjects } from "./roomObjects";
import { FocusView } from "./FocusView";

describe("FocusView", () => {
  it("applies the selected object's camera transform", () => {
    const definition = roomObjects.find(({ id }) => id === "server")!;

    render(
      <FocusView definition={definition} onClose={() => undefined}>
        <span>Room</span>
      </FocusView>,
    );

    expect(screen.getByTestId("focus-view")).toHaveStyle({
      "--focus-scale": String(definition.focusTransform.scale),
    });
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <FocusView definition={roomObjects[0]} onClose={onClose}>
        <span>Room</span>
      </FocusView>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
