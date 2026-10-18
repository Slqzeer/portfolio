import { useEffect, useState } from "react";
import { sceneManifest } from "./sceneManifest";
import { useIdleRoom, type MotionPreference } from "./useIdleRoom";
import type { RoomObjectId } from "../content/types";

const objectIds = Object.keys(sceneManifest) as RoomObjectId[];

export function useRoomMotion(readingMode: boolean) {
  const [preference, setPreference] = useState<MotionPreference>(() => {
    try {
      return localStorage.getItem("portfolio-motion") === "reduced"
        ? "reduced"
        : "full";
    } catch {
      return "full";
    }
  });
  const motion = useIdleRoom({
    objectIds,
    motionPreference: preference,
    forceReducedMotion: readingMode,
  });

  useEffect(() => {
    document.documentElement.dataset.motion = motion.reducedMotion
      ? "reduced"
      : "full";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [motion.reducedMotion]);

  const toggleMotion = () => {
    const next = preference === "full" ? "reduced" : "full";
    setPreference(next);
    try {
      localStorage.setItem("portfolio-motion", next);
    } catch {
      // The preference still applies for this visit.
    }
  };

  return { ...motion, animationsEnabled: preference === "full", toggleMotion };
}
