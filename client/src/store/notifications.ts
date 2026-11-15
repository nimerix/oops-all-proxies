import { create } from "zustand";

export type NoticeAction = {
  label: string;
  run: () => boolean | void;
  tag?: string;
};
export type Notice = {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
  action?: NoticeAction;
};
let nextId = 0;
export const useNotifications = create<{
  notices: Notice[];
  notify: (
    message: string,
    kind?: Notice["kind"],
    action?: NoticeAction
  ) => void;
  dismiss: (id: number) => void;
  dismissTagged: (tag: string) => void;
}>((set) => ({
  notices: [],
  notify: (message, kind = "info", action) =>
    set((s) => ({
      notices: [
        ...s.notices.slice(-1),
        { id: ++nextId, message, kind, action },
      ],
    })),
  dismiss: (id) =>
    set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
  dismissTagged: (tag) =>
    set((s) => ({ notices: s.notices.filter((n) => n.action?.tag !== tag) })),
}));
export const notify = (
  message: string,
  kind: Notice["kind"] = "info",
  action?: NoticeAction
) => useNotifications.getState().notify(message, kind, action);
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
