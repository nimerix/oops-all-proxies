import type { CardOption } from "../types/Card";
import { cardSource, type ImageSources } from "./cardSources";

export type DeckGroup = {
  key: string;
  uuids: string[];
  card: CardOption;
  firstIndex: number;
  lastIndex: number;
};

function frontSource(card: CardOption, images: ImageSources) {
  const chosen = images.originalSelectedImages[card.uuid];
  if (chosen) return chosen;
  const { source } = cardSource(card, images);
  return typeof source === "string" ? source : null;
}

function sortedOverrides(card: CardOption) {
  const entries = Object.entries(card.bleedArtwork ?? {})
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length ? entries : null;
}

// Upload tokens contain the card's uuid, so uploaded copies never share a key.
function groupKey(card: CardOption, images: ImageSources) {
  return JSON.stringify([
    card.name.toLowerCase(),
    frontSource(card, images),
    card.currentFaceIndex ?? 0,
    images.originalSelectedBackImages?.[card.uuid] ?? null,
    !!card.hasBakedBleed,
    !!card.backHasBakedBleed,
    sortedOverrides(card),
  ]);
}

export function groupDeck(
  cards: CardOption[],
  images: ImageSources
): DeckGroup[] {
  const groups = new Map<string, DeckGroup>();
  cards.forEach((card, index) => {
    const key = groupKey(card, images);
    const group = groups.get(key);
    if (group) {
      group.uuids.push(card.uuid);
      group.lastIndex = index;
    } else
      groups.set(key, {
        key,
        uuids: [card.uuid],
        card,
        firstIndex: index,
        lastIndex: index,
      });
  });
  return [...groups.values()];
}

export function groupOf(groups: DeckGroup[], uuid: string) {
  return groups.find((group) => group.uuids.includes(uuid));
}

export function needsArtwork(card: CardOption, images: ImageSources) {
  return cardSource(card, images).source === undefined;
}

export type MoveTarget = "start" | "end" | "earlier" | "later";

// "earlier" and "later" first gather the copies at the first one, then move
// the block one card.
export function moveGroup(
  cards: CardOption[],
  group: DeckGroup,
  to: MoveTarget
): CardOption[] {
  const ids = new Set(group.uuids);
  const moved = cards.filter((card) => ids.has(card.uuid));
  const rest = cards.filter((card) => !ids.has(card.uuid));
  const first = cards.findIndex((card) => ids.has(card.uuid));
  const at =
    to === "start"
      ? 0
      : to === "end"
        ? rest.length
        : to === "earlier"
          ? Math.max(0, first - 1)
          : Math.min(rest.length, first + 1);
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}

// Whether moving changes the order: the copies are apart, or not already at
// that end.
export function canMoveGroup(
  group: DeckGroup,
  deckLength: number,
  to: MoveTarget
) {
  const together =
    group.lastIndex - group.firstIndex === group.uuids.length - 1;
  if (!together) return true;
  return to === "start" || to === "earlier"
    ? group.firstIndex > 0
    : group.lastIndex < deckLength - 1;
}
