import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCardsStore, useUiStore } from "@/store";
import { AddCardsForm } from "./AddCardsForm";

// While the deck is empty the Deck panel shows the form itself.
export function AddCardsDialog() {
  const open = useUiStore((s) => s.addCardsOpen);
  const hasCards = useCardsStore((s) => s.cards.length > 0);
  useEffect(() => {
    if (open && !hasCards) useUiStore.getState().setAddCardsOpen(false);
  }, [open, hasCards]);
  return open && hasCards ? <AddCardsPanel /> : null;
}

function AddCardsPanel() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => useUiStore.getState().setAddCardsOpen(false);
  useEffect(() => {
    const el = dialog.current,
      opener = document.activeElement;
    el?.showModal();
    document.getElementById("decklist")?.focus();
    return () => {
      el?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="add-cards-dialog"
      aria-labelledby="add-heading"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="dialog-heading">
        <h2 id="add-heading">Add cards</h2>
        <button
          className="icon-button"
          aria-label="Close add cards"
          onClick={close}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="dialog-body">
        <AddCardsForm onAdded={close} />
      </div>
    </dialog>
  );
}
