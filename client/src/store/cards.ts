import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isUploadedFileToken, makeUploadedFileToken } from "../helpers/ImageHelper";
import { indexedDBStorage, migrateFromLocalStorage } from "../helpers/IndexedDBStorage";
import type { CardOption } from "../types/Card";

type Store = {
  // ---------- persisted ----------
  cards: CardOption[];

  cachedImageUrls: Record<string, string>;
  setCachedImageUrls: (images: Record<string, string>) => void;
  appendCachedImageUrls: (newImages: Record<string, string>) => void;
  clearCachedForCard: (uuid: string) => void;
  clearCachedForMany: (uuids: string[]) => void;
  resetCachedImageUrls: () => void;

  globalLanguage: string;
  setGlobalLanguage: (lang: string) => void;

  setCards: (cards: CardOption[]) => void;
  appendCards: (newCards: CardOption[]) => void;
  updateCard: (pos: number, updatedCard: Partial<CardOption>) => void;

  // ---------- volatile (NOT persisted) ----------
  selectedImages: Record<string, string>;
  setSelectedImages: (images: Record<string, string>) => void;
  appendSelectedImages: (newImages: Record<string, string>) => void;
  clearSelectedImage: (uuid: string) => void;
  clearManySelectedImages: (uuids: string[]) => void;

  selectedBackFaceImages: Record<string, string>;
  setSelectedBackFaceImages: (images: Record<string, string>) => void;
  appendSelectedBackFaceImages: (newImages: Record<string, string>) => void;
  clearSelectedBackFaceImage: (uuid: string) => void;

  originalSelectedImages: Record<string, string>;
  setOriginalSelectedImages: (images: Record<string, string>) => void;
  appendOriginalSelectedImages: (newImages: Record<string, string>) => void;

  uploadedImages: Record<string, string>;
  setUploadedImages: (images: Record<string, string>) => void;
  appendUploadedImages: (newImages: Record<string, string>) => void;

  uploadedOriginalImages: Record<string, string>;
  setUploadedOriginalImages: (images: Record<string, string>) => void;
  appendUploadedOriginalImages: (newImages: Record<string, string>) => void;

  uploadedFiles: Record<string, File>;
  setUploadedFiles: (files: Record<string, File>) => void;
  appendUploadedFiles: (newFiles: Record<string, File>) => void;

  uploadedBackFiles: Record<string, File>;
  setUploadedBackFiles: (files: Record<string, File>) => void;
  appendUploadedBackFiles: (newFiles: Record<string, File>) => void;

  originalSelectedBackImages: Record<string, string>;
  setOriginalSelectedBackImages: (images: Record<string, string>) => void;
  appendOriginalSelectedBackImages: (newImages: Record<string, string>) => void;

  removeCardAt: (pos: number) => void;
  duplicateCardAt: (pos: number) => void;
  clearVolatileForCard: (uuid: string) => void;
  removeCardsByUuid: (uuids: string[]) => void;
};

export const useCardsStore = create<Store>()(
  persist(
    (set, _) => ({
      // ---------- persisted ----------
      cards: [],

      cachedImageUrls: {},
      setCachedImageUrls: (images) => set({ cachedImageUrls: images }),
      appendCachedImageUrls: (newImages) =>
        set((state) => ({
          cachedImageUrls: { ...state.cachedImageUrls, ...newImages },
        })),
      clearCachedForCard: (uuid) =>
        set((state) => {
          if (!state.cachedImageUrls?.[uuid]) return {};
          const next = { ...state.cachedImageUrls };
          delete next[uuid];
          return { cachedImageUrls: next };
        }),
      clearCachedForMany: (uuids) =>
        set((state) => {
          if (!uuids?.length) return {};
          const next = { ...state.cachedImageUrls };
          for (const id of uuids) delete next[id];
          return { cachedImageUrls: next };
        }),
      resetCachedImageUrls: () => set({ cachedImageUrls: {} }),

      globalLanguage: "en",
      setGlobalLanguage: (lang) => set({ globalLanguage: lang }),

      setCards: (cards) => set({ cards }),
      appendCards: (newCards) =>
        set((state) => ({ cards: [...state.cards, ...newCards] })),
      updateCard: (pos, updatedCard) =>
        set((state) => ({
          cards: state.cards.map((card, index) =>
            index === pos ? { ...card, ...updatedCard } : card
          ),
        })),

      // ---------- volatile ----------
      selectedImages: {},
      setSelectedImages: (images) => set({ selectedImages: images }),
      appendSelectedImages: (newImages) =>
        set((state) => ({
          selectedImages: { ...state.selectedImages, ...newImages },
        })),
      clearSelectedImage: (uuid) =>
        set((state) => {
          const newSelected = { ...state.selectedImages };
          delete newSelected[uuid];
          return { selectedImages: newSelected };
        }),
      clearManySelectedImages: (uuids) =>
        set((state) => {
          const newSelected = { ...state.selectedImages };
          for (const uuid of uuids) delete newSelected[uuid];
          return { selectedImages: newSelected };
        }),

      selectedBackFaceImages: {},
      setSelectedBackFaceImages: (images) => set({ selectedBackFaceImages: images }),
      appendSelectedBackFaceImages: (newImages) =>
        set((state) => ({
          selectedBackFaceImages: { ...state.selectedBackFaceImages, ...newImages },
        })),
      clearSelectedBackFaceImage: (uuid) =>
        set((state) => {
          const newSelected = { ...state.selectedBackFaceImages };
          delete newSelected[uuid];
          return { selectedBackFaceImages: newSelected };
        }),

      originalSelectedImages: {},
      setOriginalSelectedImages: (images) =>
        set({ originalSelectedImages: images }),
      appendOriginalSelectedImages: (newImages) =>
        set((state) => ({
          originalSelectedImages: {
            ...state.originalSelectedImages,
            ...newImages,
          },
        })),

      uploadedImages: {},
      setUploadedImages: (images) => set({ uploadedImages: images }),
      appendUploadedImages: (newImages) =>
        set((state) => ({
          uploadedImages: { ...state.uploadedImages, ...newImages },
        })),

      uploadedOriginalImages: {},
      setUploadedOriginalImages: (images) =>
        set({ uploadedOriginalImages: images }),
      appendUploadedOriginalImages: (newImages) =>
        set((state) => ({
          uploadedOriginalImages: {
            ...state.uploadedOriginalImages,
            ...newImages,
          },
        })),

      uploadedFiles: {},
      setUploadedFiles: (files) => set({ uploadedFiles: files }),
      appendUploadedFiles: (newFiles) =>
        set((state) => ({
          uploadedFiles: { ...state.uploadedFiles, ...newFiles },
        })),

      uploadedBackFiles: {},
      setUploadedBackFiles: (files) => set({ uploadedBackFiles: files }),
      appendUploadedBackFiles: (newFiles) =>
        set((state) => ({
          uploadedBackFiles: { ...state.uploadedBackFiles, ...newFiles },
        })),

      originalSelectedBackImages: {},
      setOriginalSelectedBackImages: (images) =>
        set({ originalSelectedBackImages: images }),
      appendOriginalSelectedBackImages: (newImages) =>
        set((state) => ({
          originalSelectedBackImages: {
            ...state.originalSelectedBackImages,
            ...newImages,
          },
        })),

      // helpers
      removeCardAt: (pos) =>
        set((state) => {
          const cards = [...state.cards];
          const [removed] = cards.splice(pos, 1);
          if (removed?.uuid) {
            const uuid = removed.uuid;
            const {
              selectedImages,
              selectedBackFaceImages,
              originalSelectedImages,
              uploadedImages,
              uploadedOriginalImages,
              uploadedFiles,
              uploadedBackFiles,
              originalSelectedBackImages,
              cachedImageUrls,
            } = state;

            delete selectedImages[uuid];
            delete selectedBackFaceImages[uuid];
            delete originalSelectedImages[uuid];
            delete uploadedImages[uuid];
            delete uploadedOriginalImages[uuid];
            delete uploadedFiles[uuid];
            delete uploadedBackFiles[uuid];
            delete originalSelectedBackImages[uuid];
            delete cachedImageUrls[uuid];

            return {
              cards,
              selectedImages: { ...selectedImages },
              selectedBackFaceImages: { ...selectedBackFaceImages },
              originalSelectedImages: { ...originalSelectedImages },
              uploadedImages: { ...uploadedImages },
              uploadedOriginalImages: { ...uploadedOriginalImages },
              uploadedFiles: { ...uploadedFiles },
              uploadedBackFiles: { ...uploadedBackFiles },
              originalSelectedBackImages: { ...originalSelectedBackImages },
              cachedImageUrls: { ...cachedImageUrls },
            };
          }
          return { cards };
        }),

      duplicateCardAt: (pos) =>
        set((state) => {
          const cards = [...state.cards];
          const cardToDuplicate = cards[pos];
          if (!cardToDuplicate) return {};

          const newUuid = crypto.randomUUID();
          const duplicatedCard: CardOption = {
            ...cardToDuplicate,
            uuid: newUuid,
          };

          // Insert the duplicate right after the original
          cards.splice(pos + 1, 0, duplicatedCard);

          // Copy over all associated data with the new UUID
          const oldUuid = cardToDuplicate.uuid;
          const {
            selectedImages,
            selectedBackFaceImages,
            originalSelectedImages,
            uploadedImages,
            uploadedOriginalImages,
            uploadedFiles,
            uploadedBackFiles,
            originalSelectedBackImages,
            cachedImageUrls,
          } = state;

          const updates: any = { cards };

          if (selectedImages[oldUuid]) {
            updates.selectedImages = {
              ...selectedImages,
              [newUuid]: selectedImages[oldUuid],
            };
          }
          if (selectedBackFaceImages[oldUuid]) {
            updates.selectedBackFaceImages = {
              ...selectedBackFaceImages,
              [newUuid]: selectedBackFaceImages[oldUuid],
            };
          }
          if (originalSelectedImages[oldUuid]) {
            const originalValue = originalSelectedImages[oldUuid];
            updates.originalSelectedImages = {
              ...originalSelectedImages,
              [newUuid]: isUploadedFileToken(originalValue)
                ? makeUploadedFileToken(newUuid)
                : originalValue,
            };
          }
          if (uploadedImages[oldUuid]) {
            updates.uploadedImages = {
              ...uploadedImages,
              [newUuid]: uploadedImages[oldUuid],
            };
          }
          if (uploadedOriginalImages[oldUuid]) {
            updates.uploadedOriginalImages = {
              ...uploadedOriginalImages,
              [newUuid]: uploadedOriginalImages[oldUuid],
            };
          }
          if (uploadedFiles[oldUuid]) {
            updates.uploadedFiles = {
              ...uploadedFiles,
              [newUuid]: uploadedFiles[oldUuid],
            };
          }
          if (uploadedBackFiles[oldUuid]) {
            updates.uploadedBackFiles = {
              ...uploadedBackFiles,
              [newUuid]: uploadedBackFiles[oldUuid],
            };
          }
          if (originalSelectedBackImages[oldUuid]) {
            const originalBackValue = originalSelectedBackImages[oldUuid];
            updates.originalSelectedBackImages = {
              ...originalSelectedBackImages,
              [newUuid]: isUploadedFileToken(originalBackValue)
                ? makeUploadedFileToken(newUuid)
                : originalBackValue,
            };
          }
          if (cachedImageUrls[oldUuid]) {
            updates.cachedImageUrls = {
              ...cachedImageUrls,
              [newUuid]: cachedImageUrls[oldUuid],
            };
          }

          return updates;
        }),

      clearVolatileForCard: (uuid) =>
        set((state) => {
          const {
            selectedImages,
            selectedBackFaceImages,
            originalSelectedImages,
            uploadedImages,
            uploadedOriginalImages,
            uploadedFiles,
            uploadedBackFiles,
            originalSelectedBackImages,
            cachedImageUrls,
          } = state;
          delete selectedImages[uuid];
          delete selectedBackFaceImages[uuid];
          delete originalSelectedImages[uuid];
          delete uploadedImages[uuid];
          delete uploadedOriginalImages[uuid];
          delete uploadedFiles[uuid];
          delete uploadedBackFiles[uuid];
          delete originalSelectedBackImages[uuid];
          delete cachedImageUrls[uuid];

          return {
            selectedImages: { ...selectedImages },
            selectedBackFaceImages: { ...selectedBackFaceImages },
            originalSelectedImages: { ...originalSelectedImages },
            uploadedImages: { ...uploadedImages },
            uploadedOriginalImages: { ...uploadedOriginalImages },
            uploadedFiles: { ...uploadedFiles },
            uploadedBackFiles: { ...uploadedBackFiles },
            originalSelectedBackImages: { ...originalSelectedBackImages },
            cachedImageUrls: { ...cachedImageUrls },
          };
        }),

      removeCardsByUuid: (uuids) =>
        set((state) => {
          if (!uuids?.length) return {};
          const removeSet = new Set(uuids);
          const cards = state.cards.filter((card) => !removeSet.has(card.uuid));
          if (cards.length === state.cards.length) {
            return {};
          }

          const strip = (map: Record<string, any>) => {
            if (!map) return map;
            const clone = { ...map };
            for (const id of removeSet) {
              delete clone[id];
            }
            return clone;
          };

          return {
            cards,
            selectedImages: strip(state.selectedImages),
            selectedBackFaceImages: strip(state.selectedBackFaceImages),
            originalSelectedImages: strip(state.originalSelectedImages),
            uploadedImages: strip(state.uploadedImages),
            uploadedOriginalImages: strip(state.uploadedOriginalImages),
            uploadedFiles: strip(state.uploadedFiles),
            uploadedBackFiles: strip(state.uploadedBackFiles),
            originalSelectedBackImages: strip(state.originalSelectedBackImages),
            cachedImageUrls: strip(state.cachedImageUrls),
          };
        }),
    }),
    {
      name: "proxxied:cards:v7",
      version: 7,

      partialize: (state) => {
        const persistedState: Partial<Store> = {
          cards: state.cards,
          cachedImageUrls: state.cachedImageUrls,
          globalLanguage: state.globalLanguage,
        };

        const filteredOriginalSelectedImages: Record<string, string> = {};
        for (const uuid in state.originalSelectedImages) {
          const imageUrl = state.originalSelectedImages[uuid];
          if (imageUrl && !imageUrl.startsWith("data:")) {
            filteredOriginalSelectedImages[uuid] = imageUrl;
          }
        }

        persistedState.originalSelectedImages = filteredOriginalSelectedImages;

        return persistedState;
      },

      storage: createJSONStorage(() => indexedDBStorage),

      migrate: (persistedState: any, prevVersion) => {
        if (!persistedState) {
          return {
            cards: [],
            cachedImageUrls: {},
            globalLanguage: "en",
            originalSelectedImages: {},
          };
        }
        if (prevVersion < 6) {
          return {
            ...persistedState,
            originalSelectedImages: persistedState.originalSelectedImages || {},
          };
        }
        if (prevVersion < 7) {
          // Version 7: Migrated to IndexedDB, no structural changes
          return persistedState;
        }
        return persistedState;
      },

      // After rehydrate, migrate from localStorage and cleanup
      onRehydrateStorage: () => async (_state, error) => {
        if (error) {
          console.error("[Store] Rehydration error:", error);
          return;
        }

        // Migrate from localStorage to IndexedDB
        try {
          await migrateFromLocalStorage("proxxied:cards:v6");

          // Clean up old localStorage keys
          const toRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("proxxied:")) {
              toRemove.push(k);
            }
          }
          toRemove.forEach(k => {
            console.log("[Store] Removing legacy localStorage key:", k);
            localStorage.removeItem(k);
          });
        } catch (err) {
          console.error("[Store] Migration error:", err);
        }
      }
    }
  )
);
