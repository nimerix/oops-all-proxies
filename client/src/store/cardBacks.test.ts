import { beforeAll, beforeEach, expect, test } from "vitest";
import { assignBacks, setDeckBack } from "./cardBacks";
import { useCardsStore } from "./cards";
import { useSettingsStore } from "./settings";
import { useUndoStore } from "./undo";
import type { BleedReport } from "../helpers/bleedReport";

const report = {} as BleedReport;

beforeAll(async () => {
  await useCardsStore.persist.rehydrate();
});
beforeEach(() => {
  useCardsStore.getState().clearAll();
  useUndoStore.getState().clear();
  useCardsStore.setState({
    cards: ["a", "b"].map((uuid) => ({
      uuid,
      name: "Sol Ring",
      imageUrls: [],
      isUserUpload: false,
    })),
    selectedImages: { a: "front-a", b: "front-b" },
    selectedBackFaceImages: { a: "back-a", b: "back-b" },
    bleedReports: {
      a: { front: report, back: report },
      b: { front: report, back: report },
    },
  });
});

test("a new back clears only the back's preview and report, and undoes", () => {
  assignBacks(
    new Set(["a"]),
    {
      kind: "url",
      url: "/api/cards/images/front?id=back-id-0001",
      hasBleed: true,
    },
    "change back"
  );
  const state = useCardsStore.getState();
  expect(state.originalSelectedBackImages).toEqual({
    a: "/api/cards/images/front?id=back-id-0001",
  });
  expect(state.cards[0]).toMatchObject({
    hasBackImage: true,
    backHasBakedBleed: true,
  });
  expect(state.selectedImages).toEqual({ a: "front-a", b: "front-b" });
  expect(state.selectedBackFaceImages).toEqual({ b: "back-b" });
  expect(state.bleedReports.a).toEqual({ front: report });
  expect(state.bleedReports.b).toEqual({ front: report, back: report });

  expect(useUndoStore.getState().undo()).toBe("change back");
  expect(useCardsStore.getState().originalSelectedBackImages).toEqual({});
});

test("uploaded backs get one file each, and null removes them", () => {
  const files = { a: new File(["a"], "a.png"), b: new File(["b"], "b.png") };
  assignBacks(
    new Set(["a", "b"]),
    { kind: "file", files, hasBleed: false },
    "add back"
  );
  let state = useCardsStore.getState();
  expect(state.uploadedBackFiles).toEqual(files);
  expect(state.originalSelectedBackImages).toEqual({
    a: "uploaded-file://a",
    b: "uploaded-file://b",
  });

  assignBacks(new Set(["a", "b"]), null, "remove back");
  state = useCardsStore.getState();
  expect(state.uploadedBackFiles).toEqual({});
  expect(state.originalSelectedBackImages).toEqual({});
  expect(
    state.cards.every((c) => !c.hasBackImage && !c.backHasBakedBleed)
  ).toBe(true);
});

test("the deck back replaces the custom back and its bleed flag", () => {
  setDeckBack("/api/cards/images/front?id=back-id-0001", true);
  expect(useSettingsStore.getState()).toMatchObject({
    customCardbackUrl: "/api/cards/images/front?id=back-id-0001",
    customCardbackHasBleed: true,
  });
  expect(useCardsStore.getState().selectedBackFaceImages).toEqual({});
  expect(useCardsStore.getState().selectedImages).toEqual({
    a: "front-a",
    b: "front-b",
  });
  setDeckBack(null, false);
  expect(useSettingsStore.getState().customCardbackUrl).toBeNull();
});
