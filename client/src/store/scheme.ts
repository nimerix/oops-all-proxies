import { create } from "zustand";
import { DEFAULT_SCHEME, SCHEMES, isSchemeId, type SchemeId } from "../schemes";

// Kept in localStorage rather than the saved workspace, so index.html can
// apply the scheme before the first paint.
export const SCHEME_STORAGE_KEY = "oops-all-proxies:color-scheme";

function savedScheme(): SchemeId {
  try {
    const saved = localStorage.getItem(SCHEME_STORAGE_KEY);
    return isSchemeId(saved) ? saved : DEFAULT_SCHEME;
  } catch {
    return DEFAULT_SCHEME;
  }
}

type SchemeStore = {
  scheme: SchemeId;
  setScheme: (scheme: SchemeId) => void;
  resetScheme: () => void;
};

export const useSchemeStore = create<SchemeStore>((set) => ({
  scheme: savedScheme(),
  setScheme: (scheme) => {
    try {
      localStorage.setItem(SCHEME_STORAGE_KEY, scheme);
    } catch {
      // Without storage the choice lasts until the tab closes.
    }
    set({ scheme });
  },
  resetScheme: () => {
    try {
      localStorage.removeItem(SCHEME_STORAGE_KEY);
    } catch {
      // Nothing was saved.
    }
    set({ scheme: DEFAULT_SCHEME });
  },
}));

export function applyScheme(scheme: SchemeId) {
  document.documentElement.dataset.scheme = scheme;
  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="apple-touch-icon"]'
    )
    .forEach((link) => {
      link.href = `/brand/icons/${scheme}/${link.href.split("/").pop()}`;
    });
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", SCHEMES.find((s) => s.id === scheme)!.themeColor);
}
