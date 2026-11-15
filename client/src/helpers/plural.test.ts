import { expect, test } from "vitest";
import { plural } from "./plural";

test("plural picks the word and formats the count", () => {
  expect(plural(1, "card", "cards")).toBe("1 card");
  expect(plural(0, "card", "cards")).toBe("0 cards");
  expect(plural(1000, "card", "cards")).toBe("1,000 cards");
});
