import { useMemo } from "react";
import {
  replacedUploads,
  scopeOptions,
  scopeTargets,
  type ArtworkScope,
} from "../helpers/artworkScope";
import { plural } from "../helpers/plural";
import { useCardsStore, useSettingsStore } from "../store";
import type { CardOption } from "../types/Card";

// "deck" sets the back that every card without its own back prints with.
export type DialogScope = ArtworkScope | "deck";
export type ScopeOption = { scope: DialogScope; count: number };

const usesDeckBack = (
  card: CardOption,
  backs: Record<string, string>
): boolean => !backs[card.uuid] && (card.faces?.length ?? 0) < 2;

export function useArtworkScope(
  card: CardOption,
  chosen: DialogScope,
  kind: "front" | "back"
) {
  const cards = useCardsStore((s) => s.cards);
  const originalSelectedImages = useCardsStore((s) => s.originalSelectedImages);
  const originalSelectedBackImages = useCardsStore(
    (s) => s.originalSelectedBackImages
  );
  const uploadedFiles = useCardsStore((s) => s.uploadedFiles);
  const customBack = useSettingsStore((s) => !!s.customCardbackUrl);
  return useMemo(() => {
    const images = {
      originalSelectedImages,
      originalSelectedBackImages,
      uploadedFiles,
    };
    const options: ScopeOption[] = scopeOptions(card, cards, images);
    if (kind === "back")
      options.push({
        scope: "deck",
        count: cards.filter((c) => usesDeckBack(c, originalSelectedBackImages))
          .length,
      });
    const scope = options.some((o) => o.scope === chosen) ? chosen : "copy";
    let replaces = "";
    let assignedBacks = 0;
    if (scope === "deck") {
      if (customBack) replaces = "This replaces your custom deck back.";
    } else {
      const { fronts, backs } = replacedUploads(
        scopeTargets(scope, card, cards, images),
        cards,
        images
      );
      assignedBacks = backs;
      const count = kind === "front" ? fronts : backs;
      if (count)
        replaces =
          kind === "front"
            ? `This replaces ${plural(count, "uploaded image", "uploaded images")}.`
            : `This replaces ${plural(count, "assigned back", "assigned backs")}.`;
    }
    return { options, scope, replaces, assignedBacks };
  }, [
    card,
    cards,
    originalSelectedImages,
    originalSelectedBackImages,
    uploadedFiles,
    customBack,
    chosen,
    kind,
  ]);
}
