export const sceneMotion = {
  horizontalPixels: 14,
  verticalPixels: 8,
  rotationDegrees: 1.25,
  baseInterpolation: 0.075,
} as const;

export const MOBILE_CAMERA_BREAKPOINT = 640;

export function clampPointer(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export function frameLerpFactor(
  deltaSeconds: number,
  base = sceneMotion.baseInterpolation,
) {
  return 1 - (1 - base) ** (deltaSeconds * 60);
}
