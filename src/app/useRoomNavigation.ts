import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MouseEvent,
} from "react";
import type { RoomObjectId } from "../content/types";
import { sceneManifest } from "../room/sceneManifest";
import type { AppAction, AppState } from "./appState";

function parseRoomHash(
  hash: string,
  validIds: readonly RoomObjectId[],
): RoomObjectId | null {
  const match = /^#room\/([^/]+)$/.exec(hash);
  if (!match) return null;

  return validIds.includes(match[1] as RoomObjectId)
    ? (match[1] as RoomObjectId)
    : null;
}

function hashForObject(id: RoomObjectId): string {
  return `#room/${id}`;
}

interface RoomHistoryState {
  roomObjectId: RoomObjectId;
  parentId: RoomObjectId | null;
}

function isRoomHistoryState(
  state: unknown,
  roomObjectId: RoomObjectId,
  parentId: RoomObjectId | null,
): boolean {
  if (!state || typeof state !== "object") return false;
  const entry = state as Partial<RoomHistoryState>;
  return entry.roomObjectId === roomObjectId && entry.parentId === parentId;
}

export function useRoomNavigation(
  {
    activeObject,
    navigationPhase,
    readingMode,
  }: Pick<AppState, "activeObject" | "navigationPhase" | "readingMode">,
  dispatch: Dispatch<AppAction>,
) {
  const restoreFocus = useRef<{
    objectId: RoomObjectId;
    destination: RoomObjectId | null;
  } | null>(null);
  const triggers = useRef(new Map<string, HTMLElement>());

  const closeObject = useCallback(() => {
    const objectId = activeObject;
    if (!objectId) return;
    const previous = window.history.state?.parentId;
    const parentId =
      typeof previous === "string" &&
      sceneManifest[previous as keyof typeof sceneManifest]?.cameraAnchorName
        ? (previous as keyof typeof sceneManifest)
        : null;
    restoreFocus.current = { objectId, destination: parentId };
    if (isRoomHistoryState(window.history.state, objectId, parentId)) {
      window.history.back();
    } else {
      window.history.replaceState(
        null,
        "",
        parentId
          ? hashForObject(parentId)
          : window.location.pathname + window.location.search,
      );
    }
    dispatch({ type: "object.selected", objectId: parentId });
  }, [activeObject, dispatch]);

  useEffect(() => {
    const pending = restoreFocus.current;
    if (!pending) return;
    if (activeObject !== pending.destination) {
      restoreFocus.current = null;
      return;
    }
    if (navigationPhase === "FOCUS") return;
    const { objectId } = pending;
    restoreFocus.current = null;
    const saved = triggers.current.get(objectId);
    const focus = (trigger: HTMLElement | null) => {
      const menu = trigger?.closest("details");
      if (menu) menu.open = true;
      trigger?.focus();
    };
    const fallback = () =>
      focus(
        (saved?.isConnected
          ? saved
          : saved?.id
            ? document.getElementById(saved.id)
            : null) ??
          document.querySelector<HTMLElement>(`a[href="#room/${objectId}"]`),
      );
    if (!saved?.id.startsWith("room-hotspot-")) {
      fallback();
      return;
    }
    // Drei mounts its HTML markers in a separate React root after camera arrival.
    const restoreMarker = () => {
      const marker = document.getElementById(saved.id);
      if (!marker) return false;
      focus(marker);
      return true;
    };
    if (restoreMarker()) return;
    const observer = new MutationObserver(() => {
      if (restoreMarker()) {
        observer.disconnect();
        clearTimeout(timeout);
      }
    });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      fallback();
    }, 5000);
    observer.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [navigationPhase, activeObject]);

  useEffect(() => {
    if (!activeObject) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeObject();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeObject, activeObject]);

  useEffect(() => {
    const validIds = Object.values(sceneManifest)
      .filter(({ action }) => action === "focus" || action === "focus-zone")
      .map(({ id }) => id);
    const syncFromHistory = () => {
      if (window.location.hash === "#home") {
        dispatch({ type: "home.opened" });
        return;
      }
      const objectId = parseRoomHash(window.location.hash, validIds);
      dispatch({
        type: "object.selected",
        objectId,
      });
      if (objectId) dispatch({ type: "intro.minimized" });
    };

    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    window.addEventListener("hashchange", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      window.removeEventListener("hashchange", syncFromHistory);
    };
  }, [dispatch]);

  const selectObject = useCallback(
    (objectId: RoomObjectId) => {
      const target = objectId;
      if (target === activeObject) return;
      const trigger = document.activeElement;
      if (
        trigger instanceof HTMLElement &&
        trigger.dataset.roomObject === target
      )
        triggers.current.set(target, trigger);
      window.history.pushState(
        { roomObjectId: target, parentId: activeObject },
        "",
        hashForObject(target),
      );
      dispatch({ type: "object.selected", objectId: target });
      dispatch({ type: "intro.minimized" });
    },
    [activeObject, dispatch],
  );

  const captureTrigger = useCallback((event: MouseEvent<HTMLElement>) => {
    const trigger = (event.target as Element).closest<HTMLElement>(
      "[data-room-object], a[href^='#room/']",
    );
    const id =
      trigger?.dataset.roomObject ?? trigger?.getAttribute("href")?.slice(6);
    if (trigger && id) triggers.current.set(id, trigger);
  }, []);

  const toggleReading = useCallback(() => {
    if (!readingMode && !activeObject) selectObject("monitor");
    dispatch({ type: "reading.toggled" });
  }, [readingMode, activeObject, selectObject, dispatch]);

  const explore = useCallback(() => {
    if (readingMode) dispatch({ type: "reading.toggled" });
    dispatch({ type: "intro.minimized" });
  }, [readingMode, dispatch]);

  return { selectObject, closeObject, captureTrigger, toggleReading, explore };
}
