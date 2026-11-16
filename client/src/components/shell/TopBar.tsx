import { Download, Palette } from "lucide-react";
import { plural } from "@/helpers/plural";
import { useCardsStore, useSettingsStore, useUiStore } from "@/store";
import { SaveStatus } from "./SaveStatus";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";
import { SCHEME_MENU_ID, SchemeMenu } from "./SchemeMenu";

export function TopBar() {
  const count = useCardsStore((s) => s.cards.length);
  const perSheet = useSettingsStore((s) => s.columns * s.rows);
  const setExportOpen = useUiStore((s) => s.setExportOpen);
  const sheets = Math.ceil(count / perSheet);
  return (
    <>
      <header className="top-bar">
        <a href="#" className="brand" aria-label="Oops, All Proxies home">
          <BrandMark />
          <BrandWordmark />
        </a>
        <p className="deck-summary">
          {plural(count, "card", "cards") +
            ", " +
            plural(sheets, "sheet", "sheets")}
        </p>
        <SaveStatus />
        <button
          type="button"
          className="icon-button scheme-button"
          popoverTarget={SCHEME_MENU_ID}
          aria-label="Color scheme"
          title="Color scheme"
          // Safari does not focus buttons on click; Escape in the menu returns focus here.
          onClick={(e) => e.currentTarget.focus()}
        >
          <Palette size={18} aria-hidden="true" />
        </button>
        <button
          className="primary-button export-button"
          disabled={!count}
          onClick={(e) => {
            // Safari does not focus buttons on click; the dialog returns focus here.
            e.currentTarget.focus();
            setExportOpen(true);
          }}
        >
          <Download size={17} aria-hidden="true" />
          Export
        </button>
      </header>
      <SchemeMenu />
    </>
  );
}
