import { useEffect, useRef, useState } from "react";
import type { RoomObjectId } from "../content/types";

export type MotionPreference = "system" | "full" | "reduced";

interface UseIdleRoomOptions {
  objectIds: readonly RoomObjectId[];
  delayMs?: number;
  forceReducedMotion?: boolean;
  motionPreference?: MotionPreference;
}

export function useIdleRoom({
  objectIds,
  delayMs = 8000,
  forceReducedMotion = false,
  motionPreference = "system",
}: UseIdleRoomOptions) {
  const [reducedMotion] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : {
          matches: false,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        },
  );
  const [hidden, setHidden] = useState(document.hidden);
  const [systemReduced, setSystemReduced] = useState(reducedMotion.matches);
  const motionReduced =
    forceReducedMotion ||
    motionPreference === "reduced" ||
    (motionPreference === "system" && systemReduced);
  const ambientPaused = motionReduced || hidden;
  const [hintedObject, setHintedObject] = useState<RoomObjectId | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const index = useRef(-1);

  useEffect(() => {
    const updatePause = () => {
      setSystemReduced(reducedMotion.matches);
      setHidden(document.hidden);
    };
    updatePause();
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
    reducedMotion: motionReduced,
  };
}
