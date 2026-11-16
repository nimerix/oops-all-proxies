import { DRIVE_ID } from "./drive";

const API = "https://mpcfill.com/2";
const TIMEOUT_MS = 15000;
const SOURCES_TTL_MS = 60 * 60 * 1000;
export const PAGE_SIZE = 40;
export const MAX_PAGES = 50;
export const MAX_QUERY_LENGTH = 200;

export type MpcType = "card" | "cardback";
export type MpcImage = {
  id: string;
  name: string;
  source: string;
  dpi: number;
};
export type MpcPage = { total: number; hasMore: boolean; cards: MpcImage[] };

export class MpcError extends Error {}

const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

async function call(
  fetcher: typeof fetch,
  path: string,
  body?: unknown
): Promise<Record<string, unknown>> {
  const response = await fetcher(`${API}${path}`, {
    method: body === undefined ? "GET" : "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "User-Agent": "OopsAllProxies/1.0 (https://www.oopsallproxies.com)",
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new MpcError(`MPCFill returned ${response.status}.`);
  }
  const json = object(await response.json().catch(() => null));
  if (!json) throw new MpcError("MPCFill returned an unexpected response.");
  return json;
}

let sources: { ids: number[]; at: number } | null = null;

// MPCFill searches only the sources it is given, in the order given. Only
// Drive sources are searched, since images are fetched through the Drive route.
async function sourceIds(fetcher: typeof fetch) {
  if (sources && Date.now() - sources.at < SOURCES_TTL_MS) return sources.ids;
  const results = object((await call(fetcher, "/sources/")).results) ?? {};
  const ids = Object.values(results)
    .map(object)
    .filter((source) => source?.sourceType === "Google Drive")
    .map((source) => source?.pk)
    .filter((pk): pk is number => Number.isSafeInteger(pk));
  if (!ids.length) throw new MpcError("MPCFill listed no sources.");
  sources = { ids, at: Date.now() };
  return ids;
}

export function resetSourceCache() {
  sources = null;
}

const ids = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];

async function searchIds(
  fetcher: typeof fetch,
  type: MpcType,
  query: string
): Promise<string[]> {
  const searchSettings = {
    // Exact names suit card searches; a cardback filter is usually a partial name.
    searchTypeSettings: {
      fuzzySearch: type === "cardback",
      filterCardbacks: false,
    },
    sourceSettings: {
      sources: (await sourceIds(fetcher)).map((id) => [id, true]),
    },
    filterSettings: {
      minimumDPI: 0,
      maximumDPI: 1500,
      maximumSize: 30,
      languages: [],
      includesTags: [],
      excludesTags: ["NSFW"],
    },
  };
  if (type === "cardback" && !query)
    return ids(
      (await call(fetcher, "/cardbacks/", { searchSettings })).cardbacks
    );
  const cardType = type === "card" ? "CARD" : "CARDBACK";
  const results = object(
    (
      await call(fetcher, "/editorSearch/", {
        searchSettings,
        queries: [{ query, cardType }],
      })
    ).results
  );
  return ids(object(Object.values(results ?? {})[0])?.[cardType]);
}

async function details(
  fetcher: typeof fetch,
  identifiers: string[]
): Promise<MpcImage[]> {
  if (!identifiers.length) return [];
  const results =
    object(
      (await call(fetcher, "/cards/", { cardIdentifiers: identifiers })).results
    ) ?? {};
  return identifiers.flatMap((id) => {
    const card = object(results[id]);
    if (
      !card ||
      card.sourceType !== "Google Drive" ||
      !DRIVE_ID.test(id) ||
      typeof card.name !== "string"
    )
      return [];
    return [
      {
        id,
        name: card.name.trim().slice(0, 200),
        source:
          typeof card.sourceName === "string"
            ? card.sourceName.slice(0, 100)
            : "",
        dpi: Number.isSafeInteger(card.dpi) ? (card.dpi as number) : 0,
      },
    ];
  });
}

export async function searchMpcFill(
  type: MpcType,
  query: string,
  page: number,
  fetcher: typeof fetch = fetch
): Promise<MpcPage> {
  const found = await searchIds(fetcher, type, query);
  const start = page * PAGE_SIZE;
  return {
    total: found.length,
    hasMore: start + PAGE_SIZE < found.length && page + 1 < MAX_PAGES,
    cards: await details(fetcher, found.slice(start, start + PAGE_SIZE)),
  };
}
