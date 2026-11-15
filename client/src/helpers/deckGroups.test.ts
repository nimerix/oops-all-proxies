import { describe, expect, test } from "vitest";
import type { CardOption } from "../types/Card";
import type { ImageSources } from "./cardSources";
import {
  canMoveGroup,
  groupDeck,
  groupOf,
  moveGroup,
  needsArtwork,
} from "./deckGroups";
import { makeUploadedFileToken } from "./imageUtils";

const c = (
  uuid: string,
  name: string,
  patch: Partial<CardOption> = {}
): CardOption => ({ uuid, name, imageUrls: [], isUserUpload: false, ...patch });

describe("groupDeck", () => {
  test("copies with the same printing share a row in order of first appearance", () => {
    const groups = groupDeck(
      [c("a1", "Island"), c("b1", "Sol Ring"), c("a2", "Island")],
      { originalSelectedImages: { a1: "isl", b1: "sol", a2: "isl" } }
    );
    expect(groups.map((g) => [g.card.name, g.uuids])).toEqual([
      ["Island", ["a1", "a2"]],
      ["Sol Ring", ["b1"]],
    ]);
    expect([groups[0].firstIndex, groups[0].lastIndex]).toEqual([0, 2]);
    expect([groups[1].firstIndex, groups[1].lastIndex]).toEqual([1, 1]);
  });

  test("copies that match in everything that prints share a row", () => {
    const groups = groupDeck(
      [
        c("a1", "Island", { bleedArtwork: { insetMm: 0.5, borders: "auto" } }),
        c("a2", "island", { bleedArtwork: { borders: "auto", insetMm: 0.5 } }),
      ],
      { originalSelectedImages: { a1: "isl", a2: "isl" } }
    );
    expect(groups).toHaveLength(1);
  });

  test("an empty bleed override prints like no override", () => {
    const groups = groupDeck(
      [c("a1", "Island", { bleedArtwork: {} }), c("a2", "Island")],
      { originalSelectedImages: { a1: "isl", a2: "isl" } }
    );
    expect(groups).toHaveLength(1);
  });

  test.each<[string, Partial<ImageSources>, Partial<CardOption>]>([
    ["a different back", { originalSelectedBackImages: { a2: "back" } }, {}],
    ["a different face", {}, { currentFaceIndex: 1 }],
    ["a bleed override", {}, { bleedArtwork: { insetMm: 0.5 } }],
    [
      "a different printing",
      { originalSelectedImages: { a1: "isl", a2: "isl-2" } },
      {},
    ],
    ["baked bleed", {}, { hasBakedBleed: true }],
  ])("copies that differ by %s get separate rows", (_name, images, patch) => {
    const groups = groupDeck([c("a1", "Island"), c("a2", "Island", patch)], {
      originalSelectedImages: { a1: "isl", a2: "isl" },
      ...images,
    });
    expect(groups.map((g) => g.uuids)).toEqual([["a1"], ["a2"]]);
  });

  test("uploaded images never merge", () => {
    const upload = (uuid: string) => c(uuid, "My card", { isUserUpload: true });
    const groups = groupDeck([upload("u1"), upload("u2")], {
      originalSelectedImages: {
        u1: makeUploadedFileToken("u1"),
        u2: makeUploadedFileToken("u2"),
      },
    });
    expect(groups.map((g) => g.uuids)).toEqual([["u1"], ["u2"]]);
  });

  test("the last copy of A in A, B, A is the second A", () => {
    const cards = [c("a1", "Island"), c("b1", "Sol Ring"), c("a2", "Island")];
    const images = { originalSelectedImages: { a1: "isl", a2: "isl" } };
    expect(groupDeck(cards, images)[0].uuids.at(-1)).toBe("a2");
  });

  test("groupOf finds the row holding a copy", () => {
    const cards = [c("a1", "Island"), c("b1", "Sol Ring"), c("a2", "Island")];
    const groups = groupDeck(cards, {
      originalSelectedImages: { a1: "isl", a2: "isl", b1: "sol" },
    });
    expect(groups).toHaveLength(2);
    expect(groupOf(groups, "a2")).toBe(groups[0]);
    expect(groupOf(groups, "b1")).toBe(groups[1]);
    expect(groupOf(groups, "zz")).toBeUndefined();
  });
});

describe("moveGroup", () => {
  const cards = [c("a1", "Island"), c("b1", "Sol Ring"), c("a2", "Island")];
  const groups = groupDeck(cards, {
    originalSelectedImages: { a1: "isl", a2: "isl", b1: "sol" },
  });

  test("moveGroup to the end keeps the copies together and in order", () => {
    expect(moveGroup(cards, groups[0], "end").map((c) => c.uuid)).toEqual([
      "b1",
      "a1",
      "a2",
    ]);
  });

  test("moveGroup to the start keeps the copies together and in order", () => {
    expect(moveGroup(cards, groups[0], "start").map((c) => c.uuid)).toEqual([
      "a1",
      "a2",
      "b1",
    ]);
    expect(moveGroup(cards, groups[1], "start").map((c) => c.uuid)).toEqual([
      "b1",
      "a1",
      "a2",
    ]);
  });

  test("moving keeps the card objects themselves", () => {
    const moved = moveGroup(cards, groups[1], "end");
    expect(moved).toHaveLength(3);
    expect(moved.every((card) => cards.includes(card))).toBe(true);
  });
});

describe("moveGroup one position", () => {
  const images = {
    originalSelectedImages: { a1: "a", a2: "a", b: "b", c: "c", d: "d" },
  };
  const deck = (...ids: string[]) =>
    ids.map((id) => c(id, id.startsWith("a") ? "A" : id.toUpperCase()));
  const move = (ids: string[], to: "earlier" | "later") => {
    const cards = deck(...ids);
    const group = groupOf(groupDeck(cards, images), "a1")!;
    return moveGroup(cards, group, to).map((card) => card.uuid);
  };

  test("a single-copy row swaps with its neighbour both ways", () => {
    const cards = deck("b", "c", "d");
    const groups = groupDeck(cards, images);
    const ids = (to: "earlier" | "later", row: number) =>
      moveGroup(cards, groups[row], to).map((card) => card.uuid);
    expect(ids("earlier", 1)).toEqual(["c", "b", "d"]);
    expect(ids("later", 1)).toEqual(["b", "d", "c"]);
  });

  test("later gathers the copies at the first one, then moves past the next card", () => {
    expect(move(["a1", "b", "a2", "c"], "later")).toEqual([
      "b",
      "a1",
      "a2",
      "c",
    ]);
  });

  test("earlier gathers the copies at the first one, then moves before the previous card", () => {
    expect(move(["b", "a1", "c", "a2"], "earlier")).toEqual([
      "a1",
      "a2",
      "b",
      "c",
    ]);
  });

  test("earlier on a block already first only gathers its copies", () => {
    expect(move(["a1", "b", "a2", "c"], "earlier")).toEqual([
      "a1",
      "a2",
      "b",
      "c",
    ]);
    expect(move(["a1", "a2", "b"], "earlier")).toEqual(["a1", "a2", "b"]);
  });

  test("later on a block already last changes nothing", () => {
    expect(move(["b", "a1", "a2"], "later")).toEqual(["b", "a1", "a2"]);
    expect(move(["a1", "a2"], "later")).toEqual(["a1", "a2"]);
  });

  test("a move is offered only when it changes the order", () => {
    const can = (ids: string[]) => {
      const cards = deck(...ids);
      const group = groupOf(groupDeck(cards, images), "a1")!;
      return (["start", "earlier", "later", "end"] as const).map((to) =>
        canMoveGroup(group, cards.length, to)
      );
    };
    expect(can(["a1", "a2", "b"])).toEqual([false, false, true, true]);
    expect(can(["b", "a1", "a2"])).toEqual([true, true, false, false]);
    expect(can(["a1", "b", "a2"])).toEqual([true, true, true, true]);
    expect(can(["a1"])).toEqual([false, false, false, false]);
  });

  test("later moves a gathered block past only the card after it", () => {
    expect(move(["b", "a1", "c", "a2", "d"], "later")).toEqual([
      "b",
      "c",
      "a1",
      "a2",
      "d",
    ]);
  });
});

describe("needsArtwork", () => {
  test("a card with no source needs artwork; a card with only faces does not", () => {
    const images = { originalSelectedImages: {} };
    expect(needsArtwork(c("x", "Unknown"), images)).toBe(true);
    expect(
      needsArtwork(
        c("y", "Fire // Ice", {
          faces: [{ name: "Fire", imageUrl: "fire.png", faceIndex: 0 }],
        }),
        images
      )
    ).toBe(false);
  });

  test("a chosen original or an image URL counts as artwork", () => {
    expect(
      needsArtwork(c("x", "Sol Ring"), {
        originalSelectedImages: { x: "sol.png" },
      })
    ).toBe(false);
    expect(
      needsArtwork(c("x", "Sol Ring", { imageUrls: ["sol.png"] }), {
        originalSelectedImages: {},
      })
    ).toBe(false);
  });

  test("an upload whose file is missing needs artwork", () => {
    const token = makeUploadedFileToken("u");
    const card = c("u", "Mine", { isUserUpload: true });
    expect(needsArtwork(card, { originalSelectedImages: { u: token } })).toBe(
      true
    );
    expect(
      needsArtwork(card, {
        originalSelectedImages: { u: token },
        uploadedFiles: { u: new File(["x"], "mine.png") },
      })
    ).toBe(false);
  });
});
