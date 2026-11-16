import { beforeEach, expect, it, vi } from "vitest";
import { SCHEME_STORAGE_KEY } from "./scheme";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});
const freshStore = async () => (await import("./scheme")).useSchemeStore;

it("starts in the default scheme and saves a new choice", async () => {
  const store = await freshStore();
  expect(store.getState().scheme).toBe("midnight");
  store.getState().setScheme("oxblood");
  expect(store.getState().scheme).toBe("oxblood");
  expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("oxblood");
});
it("starts in the saved scheme and forgets it on reset", async () => {
  localStorage.setItem(SCHEME_STORAGE_KEY, "forest");
  const store = await freshStore();
  expect(store.getState().scheme).toBe("forest");
  store.getState().resetScheme();
  expect(store.getState().scheme).toBe("midnight");
  expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBeNull();
});
it("ignores a saved value that is not a scheme", async () => {
  localStorage.setItem(SCHEME_STORAGE_KEY, "plaid");
  expect((await freshStore()).getState().scheme).toBe("midnight");
});
