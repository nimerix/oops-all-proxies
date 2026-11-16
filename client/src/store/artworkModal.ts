import { create } from "zustand";
import type { ArtworkScope } from "../helpers/artworkScope";
import type { CardOption } from "../types/Card";

type OpenScope = Exclude<ArtworkScope, "name">;
export type ArtworkTab = "printings" | "mpcfill" | "back" | "bleed";

type ArtworkModalData = {
  card: CardOption | null;
  index: number | null;
  autoFetchPrints?: boolean;
  scope?: OpenScope;
  tab?: ArtworkTab;
};

type Store = {
  open: boolean;
  card: CardOption | null;
  index: number | null;
  autoFetchPrints: boolean;
  scope: OpenScope;
  tab: ArtworkTab;
  openModal: (data: ArtworkModalData) => void;
  closeModal: () => void;
  updateCard: (updatedCard: Partial<CardOption>) => void;
};

export const useArtworkModalStore = create<Store>((set) => ({
  open: false,
  card: null,
  index: null,
  autoFetchPrints: false,
  scope: "copy",
  tab: "printings",
  openModal: (data) =>
    set({
      open: true,
      card: data.card,
      index: data.index,
      autoFetchPrints: data.autoFetchPrints ?? false,
      scope: data.scope ?? "copy",
      tab: data.tab ?? "printings",
    }),
  closeModal: () =>
    set({
      open: false,
      card: null,
      index: null,
      autoFetchPrints: false,
      scope: "copy",
      tab: "printings",
    }),
  updateCard: (updatedCard) =>
    set((state) => {
      if (!state.card) return state;

      return { ...state, card: { ...state.card, ...updatedCard } };
    }),
}));
