import type { CardOption } from "../types/Card";
import type { ImageSources } from "./cardSources";
import { groupDeck, groupOf } from "./deckGroups";
import { isUploadedFileToken } from "./imageUtils";

export type ArtworkScope = "copy" | "row" | "name";

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function scopeTargets(
  scope: ArtworkScope,
  card: CardOption,
  cards: CardOption[],
  images: ImageSources
): string[] {
  if (scope === "name")
    return cards.filter((c) => sameName(c.name, card.name)).map((c) => c.uuid);
  if (scope === "row")
    return groupOf(groupDeck(cards, images), card.uuid)?.uuids ?? [card.uuid];
  return [card.uuid];
}

export function scopeOptions(
  card: CardOption,
  cards: CardOption[],
  images: ImageSources
): { scope: ArtworkScope; count: number }[] {
  const row = scopeTargets("row", card, cards, images).length;
  const name = scopeTargets("name", card, cards, images).length;
  return [
    { scope: "copy" as const, count: 1 },
    ...(row > 1 ? [{ scope: "row" as const, count: row }] : []),
    ...(name > row ? [{ scope: "name" as const, count: name }] : []),
  ];
}

export function replacedUploads(
  uuids: string[],
  cards: CardOption[],
  images: ImageSources
): { fronts: number; backs: number } {
  const ids = new Set(uuids);
  let fronts = 0,
    backs = 0;
  for (const card of cards) {
    if (!ids.has(card.uuid)) continue;
    if (
      card.isUserUpload ||
      isUploadedFileToken(images.originalSelectedImages[card.uuid])
    )
      fronts++;
    if (images.originalSelectedBackImages?.[card.uuid]) backs++;
  }
  return { fronts, backs };
}
