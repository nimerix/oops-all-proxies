import { create } from "zustand";
import { useCardsStore, type CardsState } from "./cards";
import { useLoadingStore } from "./loading";
import { useNotifications } from "./notifications";

export type DeckSnapshot = Pick<
  CardsState,
  | "cards"
  | "originalSelectedImages"
  | "originalSelectedBackImages"
  | "uploadedFiles"
  | "uploadedBackFiles"
>;
export type UndoEntry = { label: string; snapshot: DeckSnapshot };
type Entry = UndoEntry;

export const UNDO_NOTICE_TAG = "undo";
const dismissUndoNotices = () =>
  useNotifications.getState().dismissTagged(UNDO_NOTICE_TAG);

const LIMIT = 20;
const deckKeys = [
  "cards",
  "originalSelectedImages",
  "originalSelectedBackImages",
  "uploadedFiles",
  "uploadedBackFiles",
] as const;

function takeSnapshot(state: CardsState): DeckSnapshot {
  return {
    cards: state.cards,
    originalSelectedImages: state.originalSelectedImages,
    originalSelectedBackImages: state.originalSelectedBackImages,
    uploadedFiles: state.uploadedFiles,
    uploadedBackFiles: state.uploadedBackFiles,
  };
}

function restore(snapshot: DeckSnapshot) {
  useCardsStore.setState((current) => {
    const before = new Map(snapshot.cards.map((card) => [card.uuid, card]));
    const sameSources = (id: string) =>
      current.originalSelectedImages[id] ===
        snapshot.originalSelectedImages[id] &&
      current.uploadedFiles[id] === snapshot.uploadedFiles[id] &&
      current.originalSelectedBackImages[id] ===
        snapshot.originalSelectedBackImages[id] &&
      current.uploadedBackFiles[id] === snapshot.uploadedBackFiles[id];
    const unchanged = new Set(
      current.cards
        .filter(
          (card) => before.get(card.uuid) === card && sameSources(card.uuid)
        )
        .map((card) => card.uuid)
    );
    const keep = <T>(map: Record<string, T>) =>
      Object.fromEntries(
        Object.entries(map).filter(([id]) => unchanged.has(id))
      );
    return {
      ...snapshot,
      selectedImages: keep(current.selectedImages),
      selectedBackFaceImages: keep(current.selectedBackFaceImages),
      bleedReports: keep(current.bleedReports),
    };
  });
}

export const useUndoStore = create<{
  past: Entry[];
  record: (label: string) => void;
  undo: () => string | null;
  undoEntry: (entry: Entry) => string | null;
  clear: () => void;
}>((set, get) => ({
  past: [],
  record: (label) =>
    set((s) => ({
      past: [
        ...s.past,
        { label, snapshot: takeSnapshot(useCardsStore.getState()) },
      ].slice(-LIMIT),
    })),
  undo: () => {
    const entry = get().past.at(-1);
    return entry ? get().undoEntry(entry) : null;
  },
  undoEntry: (entry) => {
    if (get().past.at(-1) !== entry) return null;
    set((s) => ({ past: s.past.slice(0, -1) }));
    restore(entry.snapshot);
    dismissUndoNotices();
    return entry.label;
  },
  clear: () => {
    set({ past: [] });
    dismissUndoNotices();
  },
}));

export function undoFromUser(entry?: Entry): string | null {
  if (
    document.querySelector("dialog[open]") ||
    useLoadingStore.getState().loadingTask
  )
    return null;
  const undo = useUndoStore.getState();
  return entry ? undo.undoEntry(entry) : undo.undo();
}

export function deckEdit(label: string, mutate: () => void): Entry | null {
  const before = useUndoStore.getState().past;
  useUndoStore.getState().record(label);
  const entry = useUndoStore.getState().past.at(-1)!;
  const forget = () =>
    useUndoStore.setState((s) => ({
      past:
        s.past.at(-1) === entry ? before : s.past.filter((e) => e !== entry),
    }));
  try {
    mutate();
  } catch (error) {
    forget();
    throw error;
  }
  const after = useCardsStore.getState();
  if (deckKeys.every((key) => after[key] === entry.snapshot[key])) {
    forget();
    return null;
  }
  dismissUndoNotices();
  return entry;
}
