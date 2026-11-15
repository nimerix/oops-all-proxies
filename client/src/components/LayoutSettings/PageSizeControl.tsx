import { useSettingsStore } from "@/store";
import { layoutPresetsSizes, type LayoutPreset } from "@/store/settings";
const presets: LayoutPreset[] = [
  "Letter",
  "A4",
  "Legal",
  "Tabloid",
  "A3",
  "SuperB",
  "ArchA",
  "ArchB",
  "A2",
  "A1",
];
export function PageSizeControl() {
  const s = useSettingsStore();
  return (
    <>
      <div className="field">
        <label htmlFor="paper-size">Paper size</label>
        <select
          id="paper-size"
          value={s.pageSizePreset}
          onChange={(e) => s.setPageSizePreset(e.target.value as LayoutPreset)}
        >
          {presets.map((preset) => {
            const {
              pageWidth: w,
              pageHeight: h,
              pageSizeUnit: unit,
            } = layoutPresetsSizes[preset];
            return (
              <option key={preset} value={preset}>
                {`${preset}, ${w} × ${h} ${unit}`}
              </option>
            );
          })}
        </select>
      </div>
      <div className="segmented" role="group" aria-label="Orientation">
        {(["portrait", "landscape"] as const).map((orientation) => (
          <button
            key={orientation}
            type="button"
            aria-pressed={s.pageOrientation === orientation}
            onClick={() => {
              if (s.pageOrientation !== orientation) s.swapPageOrientation();
            }}
          >
            {orientation === "portrait" ? "Portrait" : "Landscape"}
          </button>
        ))}
      </div>
    </>
  );
}
