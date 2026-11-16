import { SCHEMES } from "@/schemes";
import { useSchemeStore } from "@/store";
import { BrandMark } from "./BrandMark";

export const SCHEME_MENU_ID = "scheme-menu";

// Opened by the palette button in the top bar. It is rendered outside the
// bar so it keeps the page colors instead of the bar's.
export function SchemeMenu() {
  const scheme = useSchemeStore((s) => s.scheme);
  const setScheme = useSchemeStore((s) => s.setScheme);
  return (
    // tabIndex keeps focus in the menu after a click on blank space, so Escape
    // still returns it to the palette button.
    <div
      id={SCHEME_MENU_ID}
      className="scheme-menu"
      popover="auto"
      tabIndex={-1}
    >
      <h2 id="scheme-heading" className="scheme-title">
        Color scheme
      </h2>
      <div
        className="swatch-picker"
        role="radiogroup"
        aria-labelledby="scheme-heading"
        aria-describedby="scheme-help"
      >
        {SCHEMES.map(({ id, label }) => (
          <label key={id} className="swatch-option">
            <input
              type="radio"
              name="color-scheme"
              value={id}
              checked={scheme === id}
              onChange={() => setScheme(id)}
              // Safari does not focus radios on click. Focus inside the menu
              // lets Escape return it to the palette button.
              onClick={(e) => e.currentTarget.focus()}
            />
            <span className="scheme-swatch" data-scheme={id}>
              <BrandMark />
            </span>
            <span className="swatch-name">{label}</span>
          </label>
        ))}
      </div>
      <p id="scheme-help" className="hint">
        Changes how this site looks. Card backs are chosen in Print setup.
      </p>
    </div>
  );
}
