import { expect, test } from "vitest";
import { importNotice } from "./addCards";

test("an import with nothing missing says how many were added", () => {
  expect(importNotice(23, [])).toBe("Added 23 cards.");
  expect(importNotice(1, [])).toBe("Added 1 card.");
});

test("one missing card takes a singular verb", () => {
  expect(importNotice(23, ["Not A Real Card Name"])).toBe(
    "Added 23 cards. 1 card needs artwork: Not A Real Card Name. Use Find artwork in the Deck panel."
  );
});

test("several missing cards are listed", () => {
  expect(importNotice(23, ["A", "B", "C"])).toBe(
    "Added 23 cards. 3 cards need artwork: A, B, C. Use Find artwork in the Deck panel."
  );
});

test("more than four missing lists four and counts the rest", () => {
  expect(importNotice(1200, ["A", "B", "C", "D", "E", "F"])).toBe(
    "Added 1,200 cards. 6 cards need artwork: A, B, C, D and 2 more. Use Find artwork in the Deck panel."
  );
});
