import { DRIVE_ID, fetchDriveImage } from "./drive";
import {
  MAX_PAGES,
  MAX_QUERY_LENGTH,
  searchMpcFill,
  type MpcType,
} from "./mpcfill";

const BROWSER_CACHE = "public, max-age=86400";
const EDGE_CACHE = "public, max-age=604800";
const SEARCH_BROWSER_CACHE = "public, max-age=3600";
const SEARCH_EDGE_CACHE = "public, max-age=86400";

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers });

function withCacheControl(response: Response, value: string) {
  const copy = new Response(response.body, response);
  copy.headers.set("Cache-Control", value);
  return copy;
}

async function driveImage(request: Request, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id || !DRIVE_ID.test(id))
    return json({ error: "Invalid Google Drive image ID." }, 400);
  const cache = caches.default;
  const key = new Request(
    `${url.origin}/api/cards/images/front?id=${encodeURIComponent(id)}`
  );
  const cached = await cache.match(key);
  if (cached) return withCacheControl(cached, BROWSER_CACHE);
  let image: Response;
  try {
    image = withCacheControl(await fetchDriveImage(id), EDGE_CACHE);
  } catch {
    return json(
      {
        error:
          "Could not fetch this Drive image. It must be shared publicly and be under 30 MB.",
      },
      502
    );
  }
  ctx.waitUntil(cache.put(key, image.clone()).catch(() => {}));
  return withCacheControl(image, BROWSER_CACHE);
}

async function mpcFillSearch(request: Request, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const query = (url.searchParams.get("q") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const pageText = url.searchParams.get("page") ?? "0";
  const page = /^\d{1,2}$/.test(pageText) ? Number(pageText) : -1;
  if (
    (type !== "card" && type !== "cardback") ||
    (type === "card" && !query) ||
    query.length > MAX_QUERY_LENGTH ||
    page < 0 ||
    page >= MAX_PAGES
  )
    return json({ error: "Invalid MPCFill search." }, 400);
  const cache = caches.default;
  const key = new Request(
    `${url.origin}/api/mpcfill/search?${new URLSearchParams({ type, q: query, page: String(page) })}`
  );
  const cached = await cache.match(key);
  if (cached) return withCacheControl(cached, SEARCH_BROWSER_CACHE);
  let found: Response;
  try {
    found = json(await searchMpcFill(type as MpcType, query, page), 200, {
      "Cache-Control": SEARCH_EDGE_CACHE,
    });
  } catch {
    return json(
      { error: "MPCFill search is unavailable right now. Try again later." },
      502
    );
  }
  ctx.waitUntil(cache.put(key, found.clone()).catch(() => {}));
  return withCacheControl(found, SEARCH_BROWSER_CACHE);
}

const ROUTES = new Map([
  ["/api/cards/images/front", driveImage],
  ["/api/mpcfill/search", mpcFillSearch],
]);

export default {
  async fetch(request, _env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/health") return json({ ok: true });
    const route = ROUTES.get(pathname);
    if (!route) return json({ error: "Not found." }, 404);
    if (request.method !== "GET")
      return json({ error: "Method not allowed." }, 405, { Allow: "GET" });
    return route(request, ctx);
  },
} satisfies ExportedHandler;
