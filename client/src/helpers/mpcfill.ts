import { apiUrl } from "../constants";
import { resolveImageUrl } from "./imageUtils";

export type MpcType = "card" | "cardback";
export type MpcImage = {
  id: string;
  name: string;
  source: string;
  dpi: number;
};
export type MpcPage = { total: number; hasMore: boolean; cards: MpcImage[] };

const MPC_IMAGE_PATH =
  /^(?:https?:\/\/[^/]+)?\/api\/cards\/images\/front\?id=([^&]+)$/;

// The id of a saved MPC image path, for showing which result is in use.
export function mpcImageId(url: string | null | undefined): string | null {
  const id = url?.match(MPC_IMAGE_PATH)?.[1];
  return id ? decodeURIComponent(id) : null;
}

// Drive serves small public thumbnails directly; the full image goes through
// the Worker only when the card is rendered.
export const mpcThumbnailUrl = (id: string) =>
  `https://drive.google.com/thumbnail?sz=w400-h400&id=${encodeURIComponent(id)}`;

// A small image for showing a saved source, without downloading a full MPC file.
export function previewImageUrl(src: string) {
  const id = mpcImageId(src);
  return id ? mpcThumbnailUrl(id) : resolveImageUrl(src);
}

const isImage = (value: unknown): value is MpcImage => {
  const v = value as MpcImage;
  return (
    !!v &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.source === "string" &&
    typeof v.dpi === "number"
  );
};

export async function searchMpcFill(
  type: MpcType,
  query: string,
  page: number,
  signal?: AbortSignal
): Promise<MpcPage> {
  const params = new URLSearchParams({ type, q: query, page: String(page) });
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/mpcfill/search?${params}`), {
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Could not reach MPCFill. Check your connection.");
  }
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    total?: unknown;
    hasMore?: unknown;
    cards?: unknown;
  } | null;
  if (!response.ok)
    throw new Error(
      typeof body?.error === "string" ? body.error : "MPCFill search failed."
    );
  if (
    !body ||
    !Number.isSafeInteger(body.total) ||
    typeof body.hasMore !== "boolean" ||
    !Array.isArray(body.cards) ||
    !body.cards.every(isImage)
  )
    throw new Error("MPCFill returned an unexpected response.");
  return {
    total: body.total as number,
    hasMore: body.hasMore,
    cards: body.cards,
  };
}
