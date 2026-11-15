import { create } from "zustand";

export type Region = "deck" | "sheets" | "print";
export type SidePanel = "deck" | "print";

type Store = {
  region: Region;
  sidePanel: SidePanel;
  deckFilter: string;
  attentionOnly: boolean;
  highlightedCardId: string | null;
  focusRequest: { uuid: string; nonce: number } | null;
  addCardsOpen: boolean;
  exportOpen: boolean;
  currentSheet: number;
  setRegion: (region: Region) => void;
  setSidePanel: (sidePanel: SidePanel) => void;
  setDeckFilter: (deckFilter: string) => void;
  setAttentionOnly: (attentionOnly: boolean) => void;
  setHighlightedCardId: (highlightedCardId: string | null) => void;
  requestFocusCard: (uuid: string) => void;
  setAddCardsOpen: (addCardsOpen: boolean) => void;
  setExportOpen: (exportOpen: boolean) => void;
  setCurrentSheet: (currentSheet: number) => void;
};

export const useUiStore = create<Store>((set) => ({
  region: "deck",
  sidePanel: "deck",
  deckFilter: "",
  attentionOnly: false,
  highlightedCardId: null,
  focusRequest: null,
  addCardsOpen: false,
  exportOpen: false,
  currentSheet: 0,
  setRegion: (region) => set({ region }),
  setSidePanel: (sidePanel) => set({ sidePanel }),
  setDeckFilter: (deckFilter) => set({ deckFilter }),
  setAttentionOnly: (attentionOnly) => set({ attentionOnly }),
  setHighlightedCardId: (highlightedCardId) => set({ highlightedCardId }),
  requestFocusCard: (uuid) =>
    set((s) => ({
      focusRequest: { uuid, nonce: (s.focusRequest?.nonce ?? 0) + 1 },
    })),
  setAddCardsOpen: (addCardsOpen) => set({ addCardsOpen }),
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setCurrentSheet: (currentSheet) => set({ currentSheet }),
}));
