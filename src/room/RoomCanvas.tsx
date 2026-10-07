import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Lighting } from "../app/appState";
import type { RoomObjectId } from "../content/types";

export interface RoomCanvasProps {
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onReady: () => void;
  onError: (error: Error) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error) => void;
}

class CanvasErrorBoundary extends Component<
  ErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function CanvasUnavailable({ onError }: { onError: (error: Error) => void }) {
  useEffect(() => {
    onError(new Error("WebGL is unavailable"));
  }, [onError]);

  return <p role="status">3D scene unavailable</p>;
}

export function RoomCanvas(props: RoomCanvasProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reportedError = useRef(false);

  const reportError = useCallback(
    (error: Error) => {
      setFailed(true);
      if (reportedError.current) return;
      reportedError.current = true;
      props.onError(error);
    },
    [props.onError],
  );

  const reportReady = () => {
    setReady(true);
    props.onReady();
  };

  return (
    <div
      className="room-canvas"
      data-active-object={props.activeObject ?? undefined}
    >
      {(!ready || failed) && (
        <img
          className="room-poster"
          data-testid="room-poster"
          src={`/assets/room/room-poster-${props.lighting}.webp`}
          alt=""
        />
      )}
      <CanvasErrorBoundary onError={reportError}>
        <Canvas
          dpr={[1, 2]}
          fallback={<CanvasUnavailable onError={reportError} />}
          onCreated={reportReady}
        >
          <Suspense fallback={null} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
