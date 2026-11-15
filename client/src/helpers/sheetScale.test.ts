import { expect, test } from "vitest";
import { nextZoomStop, SHEET_LABEL_PX, sheetScale } from "./sheetScale";

const letter = { pageWidthPx: 816, pageHeightPx: 1056 };
test("fit page shows the whole sheet", () => {
  const scale = sheetScale({
    mode: "page",
    zoom: 1,
    containerWidth: 864,
    containerHeight: 730,
    ...letter,
  });
  expect(scale).toBeCloseTo((730 - SHEET_LABEL_PX) / 1056, 3);
});
test("fit page leaves room for the measured sheet label", () => {
  const scale = sheetScale({
    mode: "page",
    zoom: 1,
    containerWidth: 864,
    containerHeight: 730,
    labelHeight: 40,
    ...letter,
  });
  expect(scale).toBeCloseTo((730 - 40) / 1056, 3);
});
test("fit page is limited by width on a landscape sheet", () => {
  const scale = sheetScale({
    mode: "page",
    zoom: 1,
    containerWidth: 600,
    containerHeight: 900,
    pageWidthPx: 1056,
    pageHeightPx: 816,
  });
  expect(scale).toBeCloseTo(600 / 1056, 3);
});
test("fit width uses the container width and may exceed 100%", () => {
  expect(
    sheetScale({
      mode: "width",
      zoom: 1,
      containerWidth: 1300,
      containerHeight: 900,
      ...letter,
    })
  ).toBeCloseTo(1300 / 816, 3);
});
test("custom returns the stored zoom, clamped to 0.1 and 3", () => {
  expect(
    sheetScale({
      mode: "custom",
      zoom: 5,
      containerWidth: 800,
      containerHeight: 600,
      ...letter,
    })
  ).toBe(3);
});
test("zoom steps move to the neighbouring stop", () => {
  expect(nextZoomStop(0.62, 1)).toBe(0.67);
  expect(nextZoomStop(0.62, -1)).toBe(0.5);
  expect(nextZoomStop(3, 1)).toBe(3);
});
