import { useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useRef, useState } from "react";
import { AgXToneMapping, Mesh, MeshStandardMaterial, Vector3 } from "three";
import type { Lighting } from "../app/appState";
import type { Locale, RoomObjectId } from "../content/types";
import { RoomModel } from "./RoomModel";
import { SceneBoundary } from "./SceneBoundary";

export interface RoomCanvasProps {
  locale: Locale;
  lighting: Lighting;
  activeObject: RoomObjectId | null;
  onInteract: (id: RoomObjectId) => void;
  onReady: () => void;
  onError: (error: Error) => void;
  ambientPaused?: boolean;
  reducedMotion?: boolean;
  transitionId?: number;
  onArrive?: (transitionId: number) => void;
  interactionEnabled?: boolean;
}

function SceneMetrics() {
  const { gl } = useThree();
  const sample = useRef({ frames: 0, startedAt: performance.now() });

  const position = useRef(new Vector3());
  useFrame(({ scene }) => {
    const now = performance.now();
    sample.current.frames += 1;
    const elapsed = now - sample.current.startedAt;
    // Sample the sub-second curtain sequence on every rendered frame.
    const slat = scene.getObjectByName("Blind_Slat_37");
    if (slat) {
      gl.domElement.dataset.blindHeight = slat
        .getWorldPosition(position.current)
        .y.toFixed(4);
      gl.domElement.dataset.blindX = position.current.x.toFixed(4);
      gl.domElement.dataset.blindDepth = position.current.z.toFixed(4);
      gl.domElement.dataset.blindTilt = slat.rotation.x.toFixed(4);
    }
    if (elapsed < 1000) return;
    gl.domElement.dataset.fps = String(
      Math.round((sample.current.frames * 1000) / elapsed),
    );
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    const breeze = scene.getObjectByName("Blind_Breeze");
    if (breeze)
      gl.domElement.dataset.blindBreeze = breeze.position.x.toFixed(5);
    const foliage = scene.getObjectByName("Exterior_Foliage_00");
    if (foliage)
      gl.domElement.dataset.foliageWind = foliage.rotation.z.toFixed(5);
    gl.domElement.dataset.rackActivity = [
      "EMIT_Rack_00_00",
      "EMIT_Rack_00_01",
      "EMIT_Rack_Side_00_ACT1",
      "EMIT_Rack_Side_03_NET1",
    ]
      .map((name) => {
        const led = scene.getObjectByName(name);
        return led instanceof Mesh &&
          led.material instanceof MeshStandardMaterial
          ? led.material.emissiveIntensity.toFixed(3)
          : "";
      })
      .join(",");
    const power = scene.getObjectByName("EMIT_Controller_Power");
    if (power instanceof Mesh && power.material instanceof MeshStandardMaterial)
      gl.domElement.dataset.controllerGlow =
        power.material.emissiveIntensity.toFixed(4);
    for (const [attribute, name] of [
      ["phoneNotification", "Phone_Notification_0"],
      ["screenTyping", "Editor_monitor_TypingMask"],
    ]) {
      const object = scene.getObjectByName(name);
      if (object) gl.domElement.dataset[attribute] = object.scale.x.toFixed(5);
    }
    const editor = scene.getObjectByName("Editor_monitor_day");
    if (editor)
      gl.domElement.dataset.editorTheme = editor.visible ? "day" : "night";
    const mask = scene.getObjectByName("Editor_monitor_TypingMask");
    if (mask) gl.domElement.dataset.editorReading = String(!mask.visible);
    sample.current = { frames: 0, startedAt: now };
  });

  return null;
}

function RoomLoading({ locale }: { locale: Locale }) {
  const progress = Math.round(useProgress().progress);
  const label =
    locale === "fr" ? "Chargement de la chambre" : "Loading the room";
  return (
    <div className="room-loading">
      <div
        className="room-loading-bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p aria-hidden="true">
        {label} · {progress} %
      </p>
    </div>
  );
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
      {failed ? (
        <img
          className="room-poster"
          data-testid="room-poster"
          src={`/assets/room/room-overview-${props.lighting}.png`}
          alt=""
        />
      ) : (
        !ready && <RoomLoading locale={props.locale} />
      )}
      {failed && (
        <p role="status">
          {props.locale === "fr"
            ? "La chambre est indisponible. Les rubriques restent accessibles."
            : "The room is unavailable. All sections remain accessible."}
        </p>
      )}
      <SceneBoundary onError={reportError}>
        <Canvas
          orthographic
          camera={{ near: 0.1, far: 100, zoom: 65 }}
          dpr={[1, 2]}
          // Blender renders the room with AgX; ACES (R3F's default) shifts its colours.
          gl={{ toneMapping: AgXToneMapping }}
          fallback={
            <span>
              {props.locale === "fr"
                ? "Chambre 3D indisponible"
                : "3D room unavailable"}
            </span>
          }
        >
          <Suspense fallback={null}>
            <RoomModel
              activeObject={props.activeObject}
              locale={props.locale}
              lighting={props.lighting}
              ambientPaused={props.ambientPaused}
              onInteract={props.onInteract}
              onReady={reportReady}
              reducedMotion={reducedMotion}
              transitionId={props.transitionId}
              onArrive={props.onArrive}
              interactionEnabled={props.interactionEnabled}
            />
            <SceneMetrics />
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
