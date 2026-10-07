import { useEffect, useRef, useState } from "react";
import type { RoomObjectId } from "../content/types";

interface UseIdleRoomOptions {
  objectIds: readonly RoomObjectId[];
  delayMs?: number;
}

export function useIdleRoom({ objectIds, delayMs = 8000 }: UseIdleRoomOptions) {
  const [reducedMotion] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : {
          matches: false,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        },
  );
  const [ambientPaused, setAmbientPaused] = useState(
    reducedMotion.matches || document.hidden,
  );
  const [hintedObject, setHintedObject] = useState<RoomObjectId | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const index = useRef(-1);

  useEffect(() => {
    const updatePause = () =>
      setAmbientPaused(reducedMotion.matches || document.hidden);
    reducedMotion.addEventListener("change", updatePause);
    document.addEventListener("visibilitychange", updatePause);
    return () => {
      reducedMotion.removeEventListener("change", updatePause);
      document.removeEventListener("visibilitychange", updatePause);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const reset = () => {
      setHintedObject(null);
      setTimerVersion((value) => value + 1);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, reset));
    return () =>
      events.forEach((event) => window.removeEventListener(event, reset));
  }, []);

  useEffect(() => {
    if (ambientPaused || objectIds.length === 0) {
      setHintedObject(null);
      return;
    }

    const timer = window.setInterval(() => {
      index.current = (index.current + 1) % objectIds.length;
      setHintedObject(objectIds[index.current]);
    }, delayMs);
    return () => window.clearInterval(timer);
  }, [ambientPaused, delayMs, objectIds, timerVersion]);

  return {
    hintedObject,
    ambientPaused,
    reducedMotion: reducedMotion.matches,
  };
}
