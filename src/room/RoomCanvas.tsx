import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Lighting } from "../app/appState";
import type { RoomObjectId } from "../content/types";
import { RoomModel } from "./RoomModel";

export interface RoomCanvasProps {
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onReady: () => void;
  onError: (error: Error) => void;
  ambientPaused?: boolean;
  reducedMotion?: boolean;
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

function SceneMetrics() {
  const { gl } = useThree();
  const sample = useRef({ frames: 0, startedAt: performance.now() });

  useFrame(() => {
    const now = performance.now();
    sample.current.frames += 1;
    const elapsed = now - sample.current.startedAt;
    if (elapsed < 1000) return;
    gl.domElement.dataset.fps = String(
      Math.round((sample.current.frames * 1000) / elapsed),
    );
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    sample.current = { frames: 0, startedAt: now };
  });

  return null;
}

export function RoomCanvas(props: RoomCanvasProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reportedError = useRef(false);
  const reducedMotion =
    props.reducedMotion ??
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const reportError = useCallback(
    (error: Error) => {
      setFailed(true);
      if (reportedError.current) return;
      reportedError.current = true;
      props.onError(error);
    },
    [props.onError],
  );

  const reportReady = useCallback(() => {
    setReady(true);
    props.onReady();
  }, [props.onReady]);

  return (
    <div
      className="room-canvas"
      data-active-object={props.activeObject ?? undefined}
      data-ready={ready}
      data-failed={failed}
    >
      {(!ready || failed) && (
        <img
          className="room-poster"
          data-testid="room-poster"
          src={`/assets/room/room-poster-${props.lighting}.webp`}
          alt=""
        />
      )}
      {failed && <p role="status">3D scene unavailable</p>}
      <CanvasErrorBoundary onError={reportError}>
        <Canvas
          orthographic
          camera={{ near: 0.1, far: 100, zoom: 65 }}
          dpr={[1, 2]}
          fallback={<span>3D scene unavailable</span>}
        >
          <Suspense fallback={null}>
            <RoomModel
              activeObject={props.activeObject}
              lighting={props.lighting}
              ambientPaused={props.ambientPaused}
              onInteract={props.onInteract}
              onReady={reportReady}
              reducedMotion={reducedMotion}
            />
            <SceneMetrics />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
