import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { groupDeck, groupOf } from "../helpers/deckGroups";
import { useArtworkModalStore, useCardsStore } from "../store";
import { ArtworkPrintings } from "./ArtworkPrintings";
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

type Tab = "printings" | "bleed";

function ArtworkDialog({
  card: opened,
  onRetry,
}: { card: CardOption } & BleedPreviewRetry) {
  const dialog = useRef<HTMLDialogElement>(null);
  const card =
    useCardsStore((s) => s.cards.find((c) => c.uuid === opened.uuid)) ?? opened;
  const [tab, setTab] = useState<Tab>("printings");
  const close = useArtworkModalStore.getState().closeModal;
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
          {(
            [
              ["printings", "Printings"],
              ["bleed", "Bleed for this card"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="dialog-body artwork-body">
        <div className="printings-tab" hidden={tab !== "printings"}>
          <ArtworkPrintings card={card} onClose={close} />
        </div>
        {tab === "bleed" && (
          <BleedArtworkControls card={card} onRetry={onRetry} />
        )}
      </div>
    </dialog>
  );
}
