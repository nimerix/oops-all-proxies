import { create } from "zustand";

export type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  // Where focus goes when the opener is gone or disabled once the dialog closes.
  fallbackFocus?: () => HTMLElement | null;
};
export type ConfirmRequest = ConfirmOptions & {
  id: number;
  resolve: (confirmed: boolean) => void;
};
let nextId = 0;

export const DELETE_SAVED_DATA: ConfirmOptions = {
  title: "Delete everything saved in this browser?",
  body: "All cards, uploaded images and print settings are deleted. This cannot be undone.",
  confirmLabel: "Delete saved data",
  danger: true,
};

export const useConfirmStore = create<{ request: ConfirmRequest | null }>(
  () => ({ request: null })
);

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  useConfirmStore.getState().request?.resolve(false);
  return new Promise((resolve) => {
    const request: ConfirmRequest = {
      ...options,
      id: ++nextId,
      resolve: (confirmed) => {
        if (useConfirmStore.getState().request === request)
          useConfirmStore.setState({ request: null });
        resolve(confirmed);
      },
    };
    useConfirmStore.setState({ request });
  });
}
