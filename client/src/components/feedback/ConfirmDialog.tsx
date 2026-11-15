import { useEffect, useRef } from "react";
import { useConfirmStore, type ConfirmRequest } from "../../store/confirm";

export function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  return request ? <ConfirmPanel key={request.id} request={request} /> : null;
}

function usable(el: Element | null | undefined): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    el !== document.body &&
    el.isConnected &&
    !el.matches(":disabled") &&
    el.getClientRects().length > 0
  );
}

function restoreFocus(
  opener: Element | null,
  fallback?: () => HTMLElement | null
) {
  const target = [opener, fallback?.()].find(usable);
  if (target) return target.focus();
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
  main.focus();
}

function ConfirmPanel({ request }: { request: ConfirmRequest }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = dialog.current,
      opener = document.activeElement;
    el?.showModal();
    cancel.current?.focus();
    return () => {
      el?.close();
      restoreFocus(opener, request.fallbackFocus);
    };
  }, [request]);
  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={(e) => {
        e.preventDefault();
        request.resolve(false);
      }}
    >
      <h2 id="confirm-title">{request.title}</h2>
      <p id="confirm-body">{request.body}</p>
      <div className="dialog-actions">
        <button
          ref={cancel}
          className="secondary-button"
          onClick={() => request.resolve(false)}
        >
          Cancel
        </button>
        <button
          className={
            request.danger ? "primary-button danger" : "primary-button"
          }
          onClick={() => request.resolve(true)}
        >
          {request.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
