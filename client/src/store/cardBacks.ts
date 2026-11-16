import { makeUploadedFileToken } from "../helpers/imageUtils";
import { useCardsStore } from "./cards";
import { usePreviewStore } from "./previews";
import { useSettingsStore } from "./settings";
import { deckEdit } from "./undo";

export type AssignedBack =
  | { kind: "file"; files: Record<string, File>; hasBleed: boolean }
  | { kind: "url"; url: string; hasBleed: boolean }
  | null;

// Assigns a back to each card, or removes the assigned back with null. Fronts
// keep their previews and bleed reports.
export function assignBacks(
  ids: Set<string>,
  back: AssignedBack,
  label: string
) {
  deckEdit(label, () =>
    useCardsStore.setState((s) => {
      const strip = <T>(map: Record<string, T>) =>
        Object.fromEntries(Object.entries(map).filter(([id]) => !ids.has(id)));
      const backs = strip(s.originalSelectedBackImages);
      const files = strip(s.uploadedBackFiles);
      const reports = { ...s.bleedReports };
      for (const id of ids) {
        if (back?.kind === "url") backs[id] = back.url;
        else if (back?.kind === "file") {
          backs[id] = makeUploadedFileToken(id);
          files[id] = back.files[id];
        }
        if (reports[id]) reports[id] = { front: reports[id].front };
      }
      return {
        cards: s.cards.map((c) =>
          ids.has(c.uuid)
            ? {
                ...c,
                hasBackImage: !!back,
                backHasBakedBleed: !!back?.hasBleed,
              }
            : c
        ),
        originalSelectedBackImages: backs,
        uploadedBackFiles: files,
        selectedBackFaceImages: strip(s.selectedBackFaceImages),
        bleedReports: reports,
      };
    })
  );
  usePreviewStore.getState().forget([...ids]);
}

export function setDeckBack(url: string | null, hasBleed: boolean) {
  const settings = useSettingsStore.getState();
  settings.setCustomCardbackUrl(url);
  settings.setCustomCardbackHasBleed(hasBleed);
  // Print setup clears these too, but it is not mounted on every layout.
  useCardsStore.setState({ selectedBackFaceImages: {} });
}
