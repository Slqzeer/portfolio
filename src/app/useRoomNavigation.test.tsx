import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode, useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appReducer, initialAppState, type AppState } from "./appState";
import { useRoomNavigation } from "./useRoomNavigation";

function mountNavigation(initial: Partial<AppState> = {}) {
  return renderHook(
    () => {
      const [state, dispatch] = useReducer(appReducer, {
        ...initialAppState,
        ...initial,
      });
      const navigation = useRoomNavigation(state, dispatch);
      return { state, navigation };
    },
    { wrapper: StrictMode },
  );
}

function FocusHarness({ markerVisible = true }: { markerVisible?: boolean }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const navigation = useRoomNavigation(state, dispatch);
  return (
    <div id="root" onClickCapture={navigation.captureTrigger}>
      {markerVisible && (
        <button
          id="room-hotspot-monitor"
          data-room-object="monitor"
          onClick={() => navigation.selectObject("monitor")}
        >
          Monitor marker
        </button>
      )}
      <details>
        <summary>Navigation</summary>
        <a href="#room/monitor">Projects link</a>
      </details>
      <button onClick={navigation.closeObject}>Close</button>
      <button onClick={() => navigation.selectObject("server")}>
        Select server
      </button>
      <button
        onClick={() =>
          dispatch({ type: "camera.arrived", transitionId: state.transitionId })
        }
      >
        Arrive
      </button>
      <output data-testid="phase">{state.navigationPhase}</output>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("room navigation", () => {
  it("opens a direct project hash and closes without leaving the current path and query", () => {
    window.history.replaceState(null, "", "/portfolio?preview=1#room/monitor");
    const back = vi.spyOn(window.history, "back");
    const { result } = mountNavigation();
    expect(result.current.state).toMatchObject({
      activeObject: "monitor",
      introExpanded: false,
    });
    act(() => result.current.navigation.closeObject());
    expect(result.current.state.activeObject).toBeNull();
    expect(
      window.location.pathname + window.location.search + window.location.hash,
    ).toBe("/portfolio?preview=1");
    expect(back).not.toHaveBeenCalled();
  });

  it.each([
    "#room/unknown",
    "#server",
    "#room/server/extra",
    "#room/window",
    "#room/flag",
  ])("ignores non-navigable hash %s", (hash) => {
    window.history.replaceState(null, "", hash);
    const { result } = mountNavigation();
    expect(result.current.state.activeObject).toBeNull();
  });

  it("records shareable selections once and returns through their recorded history", async () => {
    const push = vi.spyOn(window.history, "pushState");
    const { result } = mountNavigation();
    act(() => result.current.navigation.selectObject("desk"));
    act(() => result.current.navigation.selectObject("monitor"));
    act(() => result.current.navigation.selectObject("monitor"));
    expect(push).toHaveBeenCalledTimes(2);
    expect(window.location.hash).toBe("#room/monitor");
    expect(window.history.state).toEqual({
      roomObjectId: "monitor",
      parentId: "desk",
    });
    act(() => result.current.navigation.closeObject());
    expect(result.current.state.activeObject).toBe("desk");
    await waitFor(() => expect(window.location.hash).toBe("#room/desk"));
  });

  it("does not go back through a history entry belonging to a different object", () => {
    window.history.replaceState(
      { roomObjectId: "smartphone", parentId: "desk" },
      "",
      "#room/monitor",
    );
    const back = vi.spyOn(window.history, "back");
    const { result } = mountNavigation();
    act(() => result.current.navigation.closeObject());
    expect(back).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#room/desk");
    expect(result.current.state.activeObject).toBe("desk");
  });

  it("synchronizes hash and history events and returns home", () => {
    const { result } = mountNavigation();
    act(() => {
      window.history.replaceState(null, "", "#room/server");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.state.activeObject).toBe("server");
    act(() => {
      window.history.replaceState(null, "", "#room/monitor");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current.state.activeObject).toBe("monitor");
    act(() => result.current.navigation.toggleReading());
    act(() => {
      window.history.replaceState(null, "", "#home");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current.state).toMatchObject({
      activeObject: null,
      readingMode: false,
      introExpanded: true,
    });
  });

  it("removes history and Escape listeners on unmount", () => {
    const dispatch = vi.fn();
    const { unmount } = renderHook(
      () =>
        useRoomNavigation(
          { ...initialAppState, activeObject: "server" },
          dispatch,
        ),
      { wrapper: StrictMode },
    );
    unmount();
    dispatch.mockClear();
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("opens Projects for reading and returns the selected object to exploration", () => {
    const { result } = mountNavigation();
    act(() => result.current.navigation.toggleReading());
    expect(window.location.hash).toBe("#room/monitor");
    expect(result.current.state).toMatchObject({
      activeObject: "monitor",
      readingMode: true,
      navigationPhase: "INTERACT",
      introExpanded: false,
    });
    act(() => result.current.navigation.explore());
    expect(result.current.state).toMatchObject({
      activeObject: "monitor",
      readingMode: false,
      navigationPhase: "FOCUS",
      introExpanded: false,
    });
    act(() => result.current.navigation.selectObject("server"));
    act(() => result.current.navigation.toggleReading());
    expect(result.current.state).toMatchObject({
      activeObject: "server",
      readingMode: true,
      navigationPhase: "INTERACT",
    });
    act(() => result.current.navigation.toggleReading());
    expect(result.current.state).toMatchObject({
      activeObject: "server",
      readingMode: false,
      navigationPhase: "FOCUS",
    });
  });

  it("starts exploration without selecting an object or adding a history entry", () => {
    const { result } = mountNavigation();
    const push = vi.spyOn(window.history, "pushState");
    act(() => result.current.navigation.explore());
    expect(result.current.state).toMatchObject({
      activeObject: null,
      readingMode: false,
      introExpanded: false,
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("restores a remounted hotspot only after camera arrival", async () => {
    const { rerender } = render(
      <StrictMode>
        <FocusHarness />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Monitor marker" }));
    rerender(
      <StrictMode>
        <FocusHarness markerVisible={false} />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    fireEvent.click(screen.getByRole("button", { name: "Arrive" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("ROOM");
    rerender(
      <StrictMode>
        <FocusHarness />
      </StrictMode>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Monitor marker" }),
      ).toHaveFocus(),
    );
  });

  it("cancels a pending focus return when a different object is selected", async () => {
    const { rerender } = render(<FocusHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Monitor marker" }));
    rerender(<FocusHarness markerVisible={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(window.location.hash).toBe(""));
    fireEvent.click(screen.getByRole("button", { name: "Select server" }));
    const arriving = screen.getByRole("button", { name: "Arrive" });
    arriving.focus();
    fireEvent.click(arriving);
    rerender(<FocusHarness />);
    await act(async () => {});
    expect(arriving).toHaveFocus();
  });

  it("falls back to the navigation link when its hotspot does not return", () => {
    vi.useFakeTimers();
    const { rerender } = render(<FocusHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Monitor marker" }));
    rerender(<FocusHarness markerVisible={false} />);
    // A direct hash closes immediately, avoiding unrelated browser traversal timers.
    window.history.replaceState(null, "", "#room/monitor");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Arrive" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("link", { name: "Projects link" })).toHaveFocus();
  });

  it("cancels delayed focus work on unmount", async () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<FocusHarness />);
    const oldRoot = document.getElementById("root")!;
    fireEvent.click(screen.getByRole("button", { name: "Monitor marker" }));
    rerender(<FocusHarness markerVisible={false} />);
    window.history.replaceState(null, "", "#room/monitor");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Arrive" }));
    unmount();
    const replacement = render(
      <a href="#room/monitor">Replacement Projects</a>,
    );
    replacement.container.append(oldRoot);
    const marker = document.createElement("button");
    marker.id = "room-hotspot-monitor";
    oldRoot.append(marker);
    await act(async () => {});
    expect(marker).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(5000));
    expect(
      screen.getByRole("link", { name: "Replacement Projects" }),
    ).not.toHaveFocus();
  });
});
