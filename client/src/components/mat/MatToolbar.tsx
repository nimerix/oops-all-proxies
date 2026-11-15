import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore, useUiStore } from "../../store";
import { MAX_ZOOM, nextZoomStop } from "../../helpers/sheetScale";

const FIXED = [0.5, 1, 2];
const percent = (scale: number) => `${Math.round(scale * 100)}%`;

export function MatToolbar({
  scale,
  sheetCount,
  onShowSheet,
}: {
  scale: number;
  sheetCount: number;
  onShowSheet: (index: number) => void;
}) {
  const s = useSettingsStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
      zoom: state.zoom,
      zoomMode: state.zoomMode,
      setZoom: state.setZoom,
      setZoomMode: state.setZoomMode,
    }))
  );
  const sheet = Math.min(
    useUiStore((state) => state.currentSheet),
    sheetCount - 1
  );
  const custom = s.zoomMode === "custom";
  const value = custom ? String(s.zoom) : s.zoomMode;
  const zoomOut = nextZoomStop(scale, -1);
  // Announced for the arrow buttons only; scrolling would be noisy.
  const [announced, setAnnounced] = useState("");
  const go = (index: number) => {
    setAnnounced(`Sheet ${index + 1} of ${sheetCount}`);
    onShowSheet(index);
  };
  return (
    <div className="preview-toolbar">
      <div className="view-switch" role="group" aria-label="Preview side">
        <button
          aria-pressed={s.viewMode === "front"}
          onClick={() => s.setViewMode("front")}
        >
          Fronts
        </button>
        <button
          aria-pressed={s.viewMode === "back"}
          onClick={() => s.setViewMode("back")}
        >
          Backs
        </button>
      </div>
      <div className="sheet-nav">
        <button
          className="mat-button"
          aria-label="Previous sheet"
          disabled={sheet <= 0}
          onClick={() => go(sheet - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="sheet-position">{`Sheet ${sheet + 1} of ${sheetCount}`}</span>
        <span className="sr-only" aria-live="polite">
          {announced}
        </span>
        <button
          className="mat-button"
          aria-label="Next sheet"
          disabled={sheet >= sheetCount - 1}
          onClick={() => go(sheet + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="zoom-controls">
        <button
          className="mat-button"
          aria-label="Zoom out"
          disabled={zoomOut >= scale}
          onClick={() => s.setZoom(zoomOut)}
        >
          <ZoomOut size={18} />
        </button>
        <select
          aria-label="Zoom"
          aria-describedby={custom ? undefined : "zoom-readout"}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "page" || next === "width") s.setZoomMode(next);
            else s.setZoom(Number(next));
          }}
        >
          <option value="page">Fit page</option>
          <option value="width">Fit width</option>
          {(custom && !FIXED.includes(s.zoom)
            ? [...FIXED, s.zoom].sort((a, b) => a - b)
            : FIXED
          ).map((stop) => (
            <option key={stop} value={String(stop)}>
              {percent(stop)}
            </option>
          ))}
        </select>
        {!custom && (
          <span id="zoom-readout" className="zoom-readout">
            {percent(scale)}
          </span>
        )}
        <button
          className="mat-button"
          aria-label="Zoom in"
          disabled={scale >= MAX_ZOOM}
          onClick={() => s.setZoom(nextZoomStop(scale, 1))}
        >
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  );
}
