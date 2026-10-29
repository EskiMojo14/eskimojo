export function getProgressValue(value: number | undefined, max: number) {
  if (!Number.isFinite(max) || max <= 0) {
    throw new RangeError("Progress max must be a positive finite number.");
  }
  if (value !== undefined && !Number.isFinite(value)) {
    throw new RangeError("Progress value must be finite.");
  }
  return value === undefined ? undefined : Math.min(max, Math.max(0, value));
}
