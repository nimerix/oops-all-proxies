import { beforeAll, beforeEach, expect, it, test } from "vitest";
import { restoreSettings, useSettingsStore } from "./settings";
beforeAll(async () => {
  await useSettingsStore.persist.rehydrate();
});
beforeEach(() => useSettingsStore.getState().resetSettings());
it("fits automatic grids in each orientation without losing portrait capacity", () => {
  useSettingsStore.getState().swapPageOrientation();
  expect([
    useSettingsStore.getState().columns,
    useSettingsStore.getState().rows,
  ]).toEqual([4, 2]);
  useSettingsStore.getState().swapPageOrientation();
  expect([
    useSettingsStore.getState().columns,
    useSettingsStore.getState().rows,
  ]).toEqual([3, 3]);
});
it("restores custom row preferences after a temporary size constraint", () => {
  useSettingsStore.getState().setColumns(2);
  useSettingsStore.getState().swapPageOrientation();
  expect([
    useSettingsStore.getState().columns,
    useSettingsStore.getState().rows,
  ]).toEqual([2, 2]);
  useSettingsStore.getState().swapPageOrientation();
  expect([
    useSettingsStore.getState().columns,
    useSettingsStore.getState().rows,
  ]).toEqual([2, 3]);
});
test("a workspace saved before the revamp opens two-sided at fit page", () => {
  const restored = restoreSettings({
    exportCollated: true,
    zoom: 1.4,
    columns: 4,
    rows: 2,
    pageOrientation: "landscape",
  });
  expect(restored.twoSided).toBe(true);
  expect(restored.zoomMode).toBe("page");
  expect(restored.zoom).toBe(1);
  expect(restored.columns).toBe(4);
  expect(restored.pageOrientation).toBe("landscape");
});
test("a saved one-sided choice wins over exportCollated", () => {
  const restored = restoreSettings({
    twoSided: false,
    exportCollated: true,
    zoomMode: "custom",
    zoom: 0.5,
  });
  expect(restored.twoSided).toBe(false);
  expect(restored.exportCollated).toBe(true);
  expect(restored.zoom).toBe(0.5);
});
test("an invalid zoom mode falls back to fit page", () => {
  expect(restoreSettings({ zoomMode: "huge", zoom: 2 }).zoomMode).toBe("page");
});
