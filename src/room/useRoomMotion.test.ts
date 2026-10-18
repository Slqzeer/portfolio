import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRoomMotion } from "./useRoomMotion";

describe("room animation preference", () => {
  it("starts animated even when the system requests reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    try {
      const { result } = renderHook(() => useRoomMotion(false));
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.reducedMotion).toBe(false);
      expect(document.documentElement).toHaveAttribute("data-motion", "full");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("remembers an explicit pause and can re-enable animations", () => {
    localStorage.setItem("portfolio-motion", "reduced");
    const { result, unmount } = renderHook(() => useRoomMotion(false));
    expect(result.current.reducedMotion).toBe(true);
    act(() => result.current.toggleMotion());
    expect(result.current.reducedMotion).toBe(false);
    expect(localStorage.getItem("portfolio-motion")).toBe("full");
    act(() => result.current.toggleMotion());
    unmount();
    const restored = renderHook(() => useRoomMotion(false));
    expect(restored.result.current.animationsEnabled).toBe(false);
    expect(restored.result.current.ambientPaused).toBe(true);
  });

  it("temporarily pauses in reading mode without changing the saved choice", () => {
    const { result, rerender } = renderHook(
      ({ reading }) => useRoomMotion(reading),
      { initialProps: { reading: false } },
    );
    rerender({ reading: true });
    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.reducedMotion).toBe(true);
    rerender({ reading: false });
    expect(result.current.reducedMotion).toBe(false);
    expect(localStorage.getItem("portfolio-motion")).toBeNull();
  });
});
