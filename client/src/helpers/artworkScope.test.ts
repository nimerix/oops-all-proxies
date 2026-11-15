import { describe, expect, test } from "vitest";
import type { CardOption } from "../types/Card";
import type { ImageSources } from "./cardSources";
import { replacedUploads, scopeOptions, scopeTargets } from "./artworkScope";
import { makeUploadedFileToken } from "./imageUtils";

const c = (
  uuid: string,
  name: string,
  patch: Partial<CardOption> = {}
): CardOption => ({ uuid, name, imageUrls: [], isUserUpload: false, ...patch });

const i1 = c("i1", "Island");
const i2 = c("i2", "Island");
const i3 = c("i3", "Island");
const i4 = c("i4", "Island");
const u1 = c("u1", "island", { isUserUpload: true });
const s1 = c("s1", "Sol Ring");
const cards = [i1, i2, i3, i4, u1, s1];
const upload = makeUploadedFileToken("u1");
const images: ImageSources = {
  originalSelectedImages: {
    i1: "a",
    i2: "a",
    i3: "b",
    i4: "a",
    u1: upload,
    s1: "sol",
  },
  originalSelectedBackImages: { i4: "back" },
  uploadedFiles: { u1: new File([], "island.png") },
};

describe("scopeTargets", () => {
  test("copy targets only the card", () =>
    expect(scopeTargets("copy", i1, cards, images)).toEqual(["i1"]));
  test("row targets the copies that print identically", () =>
    expect(scopeTargets("row", i1, cards, images)).toEqual(["i1", "i2"]));
  test("name targets every card with that name, across printings, backs and uploads", () =>
    expect(scopeTargets("name", i1, cards, images)).toEqual([
      "i1",
      "i2",
      "i3",
      "i4",
      "u1",
    ]));
  test("row falls back to the card when it is no longer in the deck", () =>
    expect(scopeTargets("row", c("gone", "Island"), cards, images)).toEqual([
      "gone",
    ]));
});

describe("scopeOptions", () => {
  test("options list only scopes that differ", () => {
    expect(scopeOptions(i1, cards, images)).toEqual([
      { scope: "copy", count: 1 },
      { scope: "row", count: 2 },
      { scope: "name", count: 5 },
    ]);
    expect(scopeOptions(s1, cards, images)).toEqual([
      { scope: "copy", count: 1 },
    ]);
  });
  test("a single copy with namesakes offers this copy and the name", () =>
    expect(scopeOptions(i3, cards, images)).toEqual([
      { scope: "copy", count: 1 },
      { scope: "name", count: 5 },
    ]));
  test("a row that holds every namesake does not offer the name", () => {
    const deck = [i1, i2];
    expect(scopeOptions(i1, deck, images)).toEqual([
      { scope: "copy", count: 1 },
      { scope: "row", count: 2 },
    ]);
  });
});

describe("replacedUploads", () => {
  test("replaced uploads are counted", () =>
    expect(replacedUploads(["i1", "i4", "u1"], cards, images)).toEqual({
      fronts: 1,
      backs: 1,
    }));
  test("cards from Scryfall with no assigned back replace nothing", () =>
    expect(replacedUploads(["i1", "i2", "s1"], cards, images)).toEqual({
      fronts: 0,
      backs: 0,
    }));
});
