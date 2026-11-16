import { afterEach, expect, test, vi } from "vitest";
import { getMpcImageUrl } from "./Mpc";
import { mpcImageId, previewImageUrl, searchMpcFill } from "./mpcfill";

afterEach(() => vi.unstubAllGlobals());

test("reads the Drive id back out of a saved MPC image path", () => {
  const id = "1OQkhsnMZlZrKFZyXOYOWfAwpoIRmdqlP";
  expect(mpcImageId(getMpcImageUrl(id))).toBe(id);
  expect(mpcImageId(`https://old.example${getMpcImageUrl(id)}`)).toBe(id);
  expect(mpcImageId("https://cards.scryfall.io/large/front/a.jpg")).toBeNull();
  expect(mpcImageId(null)).toBeNull();
  expect(previewImageUrl(getMpcImageUrl(id)!)).toBe(
    `https://drive.google.com/thumbnail?sz=w400-h400&id=${id}`
  );
  expect(previewImageUrl("data:image/png;base64,AAAA")).toBe(
    "data:image/png;base64,AAAA"
  );
});

test("asks the Worker for one page and checks the reply", async () => {
  const page = {
    total: 1,
    hasMore: false,
    cards: [{ id: "drive-id-0001", name: "Sol Ring", source: "A", dpi: 800 }],
  };
  const fetcher = vi.fn(async () => Response.json(page));
  vi.stubGlobal("fetch", fetcher);
  expect(await searchMpcFill("card", "Sol Ring", 2)).toEqual(page);
  expect(fetcher).toHaveBeenCalledWith(
    "/api/mpcfill/search?type=card&q=Sol+Ring&page=2",
    expect.anything()
  );

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ total: 1, hasMore: false, cards: [{}] }))
  );
  await expect(searchMpcFill("card", "Sol Ring", 0)).rejects.toThrow(
    /unexpected response/
  );

  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { error: "MPCFill search is unavailable." },
        { status: 502 }
      )
    )
  );
  await expect(searchMpcFill("cardback", "", 0)).rejects.toThrow(
    "MPCFill search is unavailable."
  );

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    })
  );
  await expect(searchMpcFill("card", "Sol Ring", 0)).rejects.toThrow(
    /Could not reach MPCFill/
  );
});
