import { useSettingsStore } from "@/store";
import { plural } from "@/helpers/plural";
import { printLayout } from "@/helpers/printLayout";
import { NumberInput } from "../NumberInput";
export function GridControls() {
  const s = useSettingsStore();
  const { maxColumns, maxRows } = printLayout({ ...s, cardSpacingMm: 0 });
  return (
    <>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="columns">Columns</label>
          <NumberInput
            id="columns"
            min={1}
            max={maxColumns}
            value={s.columns}
            onCommit={s.setColumns}
          />
        </div>
        <div className="field">
          <label htmlFor="rows">Rows</label>
          <NumberInput
            id="rows"
            min={1}
            max={maxRows}
            value={s.rows}
            onCommit={s.setRows}
          />
        </div>
      </div>
      <div className="grid-summary">
        <span className="hint">
          {plural(s.columns * s.rows, "card", "cards") + " per sheet"}
        </span>
        <button className="text-button" onClick={s.fitMaximumCards}>
          Fit maximum cards
        </button>
      </div>
    </>
  );
}
