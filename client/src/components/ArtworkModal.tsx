import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { groupDeck, groupOf } from "../helpers/deckGroups";
import { useArtworkModalStore, useCardsStore } from "../store";
import type { ArtworkTab } from "../store/artworkModal";
import { ArtworkBack } from "./ArtworkBack";
import { ArtworkMpcFill } from "./ArtworkMpcFill";
import { ArtworkPrintings } from "./ArtworkPrintings";
import type { DialogScope } from "../hooks/useArtworkScope";
import {
  BleedArtworkControls,
  type BleedPreviewRetry,
} from "./BleedArtworkControls";
import type { CardOption } from "../types/Card";

export function ArtworkModal(props: BleedPreviewRetry) {
  const { open, card } = useArtworkModalStore();
  // The sheets region that renders this is hidden while a phone shows the deck.
  return open && card
    ? createPortal(
        <ArtworkDialog key={card.uuid} card={card} {...props} />,
        document.body
      )
    : null;
}

const TABS: [ArtworkTab, string][] = [
  ["printings", "Printings"],
  ["mpcfill", "MPCFill"],
  ["back", "Back"],
  ["bleed", "Bleed for this card"],
];

function ArtworkDialog({
  card: opened,
  onRetry,
}: { card: CardOption } & BleedPreviewRetry) {
  const dialog = useRef<HTMLDialogElement>(null);
  const card =
    useCardsStore((s) => s.cards.find((c) => c.uuid === opened.uuid)) ?? opened;
  const [tab, setTab] = useState(() => useArtworkModalStore.getState().tab);
  // Searches keep their results while another tab is shown.
  const [visited, setVisited] = useState(() => new Set([tab]));
  const [scope, setScope] = useState<DialogScope>(
    () => useArtworkModalStore.getState().scope
  );
  const close = useArtworkModalStore.getState().closeModal;
  const show = (next: ArtworkTab) => {
    setTab(next);
    setVisited((seen) => (seen.has(next) ? seen : new Set(seen).add(next)));
  };
  const tabProps = { card, onClose: close, scope, onScopeChange: setScope };
  useEffect(() => {
    const el = dialog.current;
    // Safari does not focus a button on click, so a click on the sheet leaves
    // focus on the body.
    const opener =
      document.activeElement === document.body
        ? document.querySelector(
            `[data-card-id="${CSS.escape(opened.uuid)}"] .card-art`
          )
        : document.activeElement;
    const fromDeck =
      opener instanceof HTMLElement && !!opener.closest(".deck-row");
    el?.showModal();
    // The search starts open only for a card with no artwork; its name is the fix.
    el?.querySelector<HTMLElement>("#art-search-name")?.focus();
    return () => {
      el?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else if (fromDeck) {
        // A choice can move the card to another deck row.
        const state = useCardsStore.getState();
        const row = groupOf(groupDeck(state.cards, state), opened.uuid);
        if (row)
          document
            .querySelector<HTMLElement>(
              `.deck-row[data-row-id="${CSS.escape(row.uuids[0])}"] .action-menu summary`
            )
            ?.focus();
      }
    };
  }, [opened.uuid]);
  return (
    <dialog
      ref={dialog}
      className="artwork-dialog"
      aria-labelledby="artwork-title"
      onCancel={close}
    >
      <header className="artwork-heading">
        <h2 id="artwork-title">{card.name}</h2>
        <button
          className="icon-button"
          aria-label="Close artwork picker"
          onClick={close}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="picker-tabs" role="group" aria-label="Picker view">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => show(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="dialog-body artwork-body">
        {visited.has("printings") && (
          <div className="printings-tab" hidden={tab !== "printings"}>
            <ArtworkPrintings {...tabProps} />
          </div>
        )}
        {visited.has("mpcfill") && (
          <div className="printings-tab" hidden={tab !== "mpcfill"}>
            <ArtworkMpcFill {...tabProps} />
          </div>
        )}
        {visited.has("back") && (
          <div hidden={tab !== "back"}>
            <ArtworkBack {...tabProps} />
          </div>
        )}
        {tab === "bleed" && (
          <BleedArtworkControls card={card} onRetry={onRetry} />
        )}
      </div>
    </dialog>
  );
}
