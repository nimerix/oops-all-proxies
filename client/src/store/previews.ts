import { create } from "zustand";

export type LoadState = "idle" | "loading" | "error";

type Store = {
  status: Record<string, LoadState>;
  errors: Record<string, string>;
  setStatus: (key: string, state: LoadState, error?: string) => void;
  forget: (uuids: string[]) => void;
  clear: () => void;
};

export const usePreviewStore = create<Store>((set) => ({
  status: {},
  errors: {},
  setStatus: (key, state, error) =>
    set((s) => {
      const errors = { ...s.errors };
      if (error === undefined) delete errors[key];
      else errors[key] = error;
      return { status: { ...s.status, [key]: state }, errors };
    }),
  forget: (uuids) =>
    set((s) => {
      const keys = new Set(
        uuids.flatMap((id) => [`${id}:false`, `${id}:true`])
      );
      const keep = <T>(map: Record<string, T>) =>
        Object.fromEntries(Object.entries(map).filter(([k]) => !keys.has(k)));
      return { status: keep(s.status), errors: keep(s.errors) };
    }),
  clear: () => set({ status: {}, errors: {} }),
}));
