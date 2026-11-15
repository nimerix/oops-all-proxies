import type { ZoomMode } from "../store/settings";

export const ZOOM_STOPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3];
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

// The sheet label above each page at the default font size: a 12 px caption at
// line-height 1.5 and its 8 px margin (mat.css). The container is the
// scroller's content box.
export const SHEET_LABEL_PX = 26;

export const mmToPx = (mm: number) => (mm * 96) / 25.4;

export function sheetScale(input: {
  mode: ZoomMode;
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  pageWidthPx: number;
  pageHeightPx: number;
  labelHeight?: number;
}): number {
  const width = input.containerWidth / input.pageWidthPx;
  if (input.mode === "custom")
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, input.zoom));
  if (input.mode === "width") return Math.max(0.05, width);
  const height =
    (input.containerHeight - (input.labelHeight ?? SHEET_LABEL_PX)) /
    input.pageHeightPx;
  return Math.max(0.05, Math.min(width, height));
}

const EPSILON = 0.005;

export function nextZoomStop(scale: number, direction: 1 | -1): number {
  if (direction === 1)
    return ZOOM_STOPS.find((stop) => stop > scale + EPSILON) ?? MAX_ZOOM;
  return (
    [...ZOOM_STOPS].reverse().find((stop) => stop < scale - EPSILON) ??
    ZOOM_STOPS[0]
  );
}
