export const HOME_CAMERA = "CAM_Overview";
export const OVERVIEW_FRAME_SCALE = 0.88;

// Keep the room prominent with breathing room around the architectural cut.
export function overviewFrameScale(width: number, height: number) {
  if (width <= 640) return 0.78;
  return Math.min(
    1,
    Math.max(OVERVIEW_FRAME_SCALE, ((width * 9) / (height * 16)) * 0.98),
  );
}
export const cameraTravel = {
  focusSeconds: 1.1,
  returnSeconds: 0.9,
  crossZoneSeconds: 1.4,
  minimumLegSeconds: 0.22,
};

// The desk approach clears the chair before descending toward the phone.
const cameraParents: Record<string, string> = {
  CAM_Anchor_Monitor: "CAM_Anchor_Desk",
  CAM_Anchor_Smartphone: "CAM_Anchor_Desk",
};

export function cameraPath(name: string): string[] {
  if (name === HOME_CAMERA) return [HOME_CAMERA];
  const parent = cameraParents[name];
  return [...(parent ? cameraPath(parent) : [HOME_CAMERA]), name];
}

// Follow the same reviewed edges in either direction, including on interruption.
export function cameraRoute(from: string, to: string): string[] {
  const start = cameraPath(from);
  const end = cameraPath(to);
  let shared = 0;
  while (start[shared + 1] && start[shared + 1] === end[shared + 1]) shared++;
  return [...start.slice(shared).reverse(), ...end.slice(shared + 1)];
}

export function travelEase(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}
