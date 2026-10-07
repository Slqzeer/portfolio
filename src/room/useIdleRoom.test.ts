import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomObjectId } from "../content/types";
import { useIdleRoom } from "./useIdleRoom";

const objectIds: RoomObjectId[] = ["monitor", "server", "bookshelf"];

describe("useIdleRoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hints one object after the idle delay and rotates without repetition", () => {
    const { result } = renderHook(() =>
      useIdleRoom({ objectIds, delayMs: 8000 }),
    );

    act(() => vi.advanceTimersByTime(7999));
    expect(result.current.hintedObject).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    const first = result.current.hintedObject;
    expect(first).not.toBeNull();

    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.hintedObject).not.toBe(first);
  });

  it("resets on input activity", () => {
    const { result } = renderHook(() =>
      useIdleRoom({ objectIds, delayMs: 8000 }),
    );

    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.hintedObject).not.toBeNull();

    act(() => window.dispatchEvent(new PointerEvent("pointerdown")));
    expect(result.current.hintedObject).toBeNull();

    act(() => vi.advanceTimersByTime(7999));
    expect(result.current.hintedObject).toBeNull();
  });

  it("suppresses ambient work for reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const { result } = renderHook(() =>
      useIdleRoom({ objectIds, delayMs: 8000 }),
    );
    act(() => vi.advanceTimersByTime(16000));

    expect(result.current).toEqual({
      hintedObject: null,
      ambientPaused: true,
      reducedMotion: true,
    });
  });

  it("pauses while hidden and resumes when visible", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const { result } = renderHook(() =>
      useIdleRoom({ objectIds, delayMs: 8000 }),
    );

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.ambientPaused).toBe(true);

    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.ambientPaused).toBe(false);
  });
});
