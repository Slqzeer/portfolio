import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { RoomObjectDefinition } from "./roomObjects";

interface FocusViewProps {
  definition: RoomObjectDefinition | null;
  children: ReactNode;
  onClose: () => void;
}

type FocusStyle = CSSProperties & {
  "--focus-scale": string;
  "--focus-x": string;
  "--focus-y": string;
};

export function FocusView({ definition, children, onClose }: FocusViewProps) {
  useEffect(() => {
    if (!definition) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [definition, onClose]);

  const focus = definition?.focusTransform;
  const style: FocusStyle = {
    "--focus-scale": String(focus?.scale ?? 1),
    "--focus-x": `${50 - (focus?.x ?? 50)}%`,
    "--focus-y": `${50 - (focus?.y ?? 50)}%`,
  };

  return (
    <div
      className="focus-view"
      data-testid="focus-view"
      data-focused={definition?.id}
      style={style}
    >
      {children}
    </div>
  );
}
