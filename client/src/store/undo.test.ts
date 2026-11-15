import { beforeAll, beforeEach, expect, test } from "vitest";
import { useCardsStore } from "./cards";
import { deckEdit, useUndoStore } from "./undo";
import type { CardOption } from "../types/Card";

const card = (uuid: string, extra: Partial<CardOption> = {}): CardOption => ({
  uuid,
  name: uuid.toUpperCase(),
  imageUrls: [`https://img/${uuid}.png`],
  isUserUpload: false,
  ...extra,
});

beforeAll(async () => {
  await useCardsStore.persist.rehydrate();
});
beforeEach(() => {
  useCardsStore.getState().clearAll();
  useUndoStore.getState().clear();
});

test("undo restores the deck slice and returns the label", () => {
  useCardsStore.setState({
    cards: [card("a"), card("b")],
    originalSelectedImages: { a: "u1", b: "u2" },
  });
  deckEdit("remove B", () => useCardsStore.getState().removeCardsByUuid(["b"]));
  expect(useCardsStore.getState().cards.map((c) => c.uuid)).toEqual(["a"]);
  expect(useUndoStore.getState().undo()).toBe("remove B");
  expect(useCardsStore.getState().cards.map((c) => c.uuid)).toEqual(["a", "b"]);
  expect(useCardsStore.getState().originalSelectedImages).toEqual({
    a: "u1",
    b: "u2",
  });
});

test("an action with several writes is one entry and is undone as a whole", () => {
  const faces = [
    { name: "Day", imageUrl: "https://img/day.png", faceIndex: 0 },
    { name: "Night", imageUrl: "https://img/night.png", faceIndex: 1 },
  ];
  useCardsStore.setState({
    cards: [card("a", { faces, currentFaceIndex: 0 })],
    originalSelectedImages: { a: faces[0].imageUrl },
    selectedImages: { a: "data:day" },
  });
  deckEdit("flip A", () => {
    const state = useCardsStore.getState();
    state.updateCard(0, { currentFaceIndex: 1 });
    state.appendOriginalSelectedImages({ a: faces[1].imageUrl });
    state.clearSelectedImage("a");
  });
  expect(useUndoStore.getState().past).toHaveLength(1);
  expect(useCardsStore.getState().cards[0].currentFaceIndex).toBe(1);
  expect(useUndoStore.getState().undo()).toBe("flip A");
  const restored = useCardsStore.getState();
  expect(restored.cards[0].currentFaceIndex).toBe(0);
  expect(restored.originalSelectedImages.a).toBe(faces[0].imageUrl);
  expect(useUndoStore.getState().past).toHaveLength(0);
});

test("undo drops cached previews and reports only for cards that changed or were removed", () => {
  const report = { kind: "mirror" } as const;
  useCardsStore.setState({
    cards: [card("a"), card("b"), card("c")],
    originalSelectedImages: { a: "u1", b: "u2", c: "u3" },
    selectedImages: { a: "data:a", b: "data:b", c: "data:c" },
    selectedBackFaceImages: { a: "data:a-back", b: "data:b-back" },
    bleedReports: {
      a: { front: report },
      b: { front: report },
      c: { front: report },
    },
  });
  deckEdit("change B and remove C", () => {
    useCardsStore.getState().appendOriginalSelectedImages({ b: "u2-new" });
    useCardsStore.setState((s) => ({
      cards: s.cards.filter((c) => c.uuid !== "c"),
    }));
  });
  useCardsStore.setState((s) => ({
    selectedImages: { ...s.selectedImages, b: "data:b-new" },
  }));
  useUndoStore.getState().undo();
  const state = useCardsStore.getState();
  expect(state.cards.map((c) => c.uuid)).toEqual(["a", "b", "c"]);
  expect(state.originalSelectedImages.b).toBe("u2");
  expect(state.selectedImages).toEqual({ a: "data:a" });
  expect(state.selectedBackFaceImages).toEqual({ a: "data:a-back" });
  expect(Object.keys(state.bleedReports)).toEqual(["a"]);
});

test("a failed edit leaves no entry", () => {
  useCardsStore.setState({ cards: [card("a")] });
  expect(() =>
    deckEdit("boom", () => {
      throw new Error("x");
    })
  ).toThrow("x");
  expect(useUndoStore.getState().past).toHaveLength(0);
  deckEdit("keep", () => useCardsStore.getState().removeCardsByUuid(["a"]));
  expect(() =>
    deckEdit("boom", () => {
      throw new Error("y");
    })
  ).toThrow("y");
  expect(useUndoStore.getState().past.map((e) => e.label)).toEqual(["keep"]);
});

test("keeps the newest 20 entries and returns null when empty", () => {
  expect(useUndoStore.getState().undo()).toBeNull();
  for (let i = 0; i < 25; i++)
    deckEdit(`add ${i}`, () =>
      useCardsStore.getState().appendCards([card(`c${i}`)])
    );
  const { past } = useUndoStore.getState();
  expect(past).toHaveLength(20);
  expect(past[0].label).toBe("add 5");
  expect(past[0].snapshot.cards).toHaveLength(5);
  expect(useUndoStore.getState().undo()).toBe("add 24");
  expect(useCardsStore.getState().cards).toHaveLength(24);
  for (let i = 0; i < 19; i++) useUndoStore.getState().undo();
  expect(useCardsStore.getState().cards).toHaveLength(5);
  expect(useUndoStore.getState().undo()).toBeNull();
  expect(useCardsStore.getState().cards).toHaveLength(5);
});

test("restores uploaded File objects by reference", () => {
  const front = new File(["front"], "front.png", { type: "image/png" });
  const back = new File(["back"], "back.png", { type: "image/png" });
  useCardsStore.setState({
    cards: [card("a", { isUserUpload: true, hasBackImage: true })],
    originalSelectedImages: { a: "upload:a" },
    originalSelectedBackImages: { a: "upload:a" },
    uploadedFiles: { a: front },
    uploadedBackFiles: { a: back },
  });
  deckEdit("remove A", () => useCardsStore.getState().removeCardsByUuid(["a"]));
  expect(useCardsStore.getState().uploadedFiles).toEqual({});
  useUndoStore.getState().undo();
  const state = useCardsStore.getState();
  expect(state.uploadedFiles.a).toBe(front);
  expect(state.uploadedBackFiles.a).toBe(back);
  expect(state.originalSelectedBackImages.a).toBe("upload:a");
});

test("deckEdit returns its entry, or null when nothing changed", () => {
  useCardsStore.setState({ cards: [card("a")] });
  const entry = deckEdit("remove A", () =>
    useCardsStore.getState().removeCardsByUuid(["a"])
  );
  expect(entry).toBe(useUndoStore.getState().past.at(-1));
  expect(entry?.label).toBe("remove A");
  expect(deckEdit("nothing", () => {})).toBeNull();
});

test("undoEntry restores when its entry is the newest", () => {
  useCardsStore.setState({ cards: [card("a"), card("b")] });
  const entry = deckEdit("remove B", () =>
    useCardsStore.getState().removeCardsByUuid(["b"])
  )!;
  expect(useUndoStore.getState().undoEntry(entry)).toBe("remove B");
  expect(useCardsStore.getState().cards.map((c) => c.uuid)).toEqual(["a", "b"]);
  expect(useUndoStore.getState().past).toHaveLength(0);
});

test("undoEntry changes nothing when a newer entry exists", () => {
  useCardsStore.setState({ cards: [card("a"), card("b")] });
  const first = deckEdit("remove A", () =>
    useCardsStore.getState().removeCardsByUuid(["a"])
  )!;
  deckEdit("remove B", () => useCardsStore.getState().removeCardsByUuid(["b"]));
  expect(useUndoStore.getState().undoEntry(first)).toBeNull();
  expect(useCardsStore.getState().cards).toEqual([]);
  expect(useUndoStore.getState().past.map((e) => e.label)).toEqual([
    "remove A",
    "remove B",
  ]);
});
