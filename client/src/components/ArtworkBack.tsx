import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ImagePlus, RotateCcw, Search } from "lucide-react";
import { scopeTargets, type ArtworkScope } from "../helpers/artworkScope";
import { cardSource } from "../helpers/cardSources";
import { blobToDataUrl, isUploadedFileToken } from "../helpers/imageUtils";
import { getMpcImageUrl } from "../helpers/Mpc";
import { mpcImageId, previewImageUrl, type MpcImage } from "../helpers/mpcfill";
import { plural } from "../helpers/plural";
import { copyUpload } from "../helpers/uploads";
import { defaultCardbackUrl } from "../constants";
import { useCardsStore, useSettingsStore } from "../store";
import { assignBacks, setDeckBack } from "../store/cardBacks";
import { errorMessage, notify } from "../store/notifications";
import type { CardOption } from "../types/Card";
import { MpcFillCredit, MpcFillResults } from "./ArtworkMpcFill";
import { useArtworkScope, type DialogScope } from "../hooks/useArtworkScope";
import { ScopeFieldset } from "./ArtworkScope";

const MAX_BYTES = 30 * 1024 * 1024;

function useBackPreview(card: CardOption) {
  const images = useCardsStore(
    useShallow((s) => ({
      originalSelectedImages: s.originalSelectedImages,
      originalSelectedBackImages: s.originalSelectedBackImages,
      uploadedBackFiles: s.uploadedBackFiles,
    }))
  );
  const settings = useSettingsStore(
    useShallow((s) => ({
      customCardbackUrl: s.customCardbackUrl,
      customCardbackHasBleed: s.customCardbackHasBleed,
      cardbackDesign: s.cardbackDesign,
    }))
  );
  const { source } = cardSource(
    card,
    images,
    true,
    settings.customCardbackUrl,
    settings.customCardbackHasBleed,
    defaultCardbackUrl(settings.cardbackDesign)
  );
  const fileUrl = useMemo(
    () => (source instanceof File ? URL.createObjectURL(source) : null),
    [source]
  );
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl]
  );
  const assigned = images.originalSelectedBackImages[card.uuid];
  const otherFace =
    (card.faces?.length ?? 0) > 1
      ? card.faces?.[(card.currentFaceIndex ?? 0) === 0 ? 1 : 0]
      : undefined;
  const caption = assigned
    ? isUploadedFileToken(assigned)
      ? "Your uploaded back"
      : mpcImageId(assigned)
        ? "An MPCFill back"
        : "Its own back image"
    : otherFace
      ? `Its other face, ${otherFace.name}`
      : settings.customCardbackUrl
        ? "The deck's custom back"
        : "The deck's default back";
  const src =
    fileUrl ?? (typeof source === "string" ? previewImageUrl(source) : null);
  return { src, caption };
}

export function ArtworkBack({
  card,
  onClose,
  scope: chosenScope,
  onScopeChange,
}: {
  card: CardOption;
  onClose: () => void;
  scope: DialogScope;
  onScopeChange: (scope: DialogScope) => void;
}) {
  const { options, scope, replaces } = useArtworkScope(
    card,
    chosenScope,
    "back"
  );
  const deck = scope === "deck";
  const preview = useBackPreview(card);
  const [hasBleed, setHasBleed] = useState(false);
  const [filter, setFilter] = useState("");
  const [requested, setRequested] = useState("");
  const [attempt, setAttempt] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const customBack = useSettingsStore((s) => s.customCardbackUrl);
  const twoSided = useSettingsStore((s) => s.twoSided);
  const cards = useCardsStore((s) => s.cards);
  const backs = useCardsStore((s) => s.originalSelectedBackImages);
  const fronts = useCardsStore((s) => s.originalSelectedImages);
  const canReset = useMemo(
    () =>
      deck
        ? !!customBack
        : scopeTargets(scope as ArtworkScope, card, cards, {
            originalSelectedImages: fronts,
            originalSelectedBackImages: backs,
          }).some((id) => !!backs[id]),
    [deck, customBack, scope, card, cards, fronts, backs]
  );

  const targets = () => {
    const state = useCardsStore.getState();
    const current = state.cards.find((c) => c.uuid === card.uuid) ?? card;
    return {
      current,
      ids: new Set(
        scopeTargets(scope as ArtworkScope, current, state.cards, state)
      ),
    };
  };
  const subject = (ids: Set<string>, current: CardOption) =>
    ids.size === 1 ? current.name : `${ids.size} cards`;

  function chooseMpc(image: MpcImage) {
    const url = getMpcImageUrl(image.id)!;
    onClose();
    if (deck) {
      setDeckBack(url, true);
      notify("Deck back updated.", "success");
      return;
    }
    const { current, ids } = targets();
    assignBacks(
      ids,
      { kind: "url", url, hasBleed: true },
      `change back for ${subject(ids, current)}`
    );
    notify(
      ids.size === 1 ? "Back updated." : `Back updated for ${ids.size} cards.`,
      "success"
    );
  }

  async function upload(file: File) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > MAX_BYTES) {
      notify("Choose a PNG, JPEG or WebP back image up to 30 MB.", "error");
      return;
    }
    try {
      if (deck) {
        const url = await blobToDataUrl(file);
        onClose();
        setDeckBack(url, hasBleed);
        notify("Deck back updated.", "success");
        return;
      }
      const { current, ids } = targets();
      const before = useCardsStore.getState().cards;
      const files: Record<string, File> = {};
      for (const id of ids) files[id] = await copyUpload(file);
      if (useCardsStore.getState().cards !== before) {
        notify(
          "Back image not added: the deck changed while the file was loading. Choose the image again."
        );
        return;
      }
      onClose();
      assignBacks(
        ids,
        { kind: "file", files, hasBleed },
        `add back for ${subject(ids, current)}`
      );
      notify(
        ids.size === 1
          ? "Back image added."
          : `Back image added to ${ids.size} cards.`,
        "success"
      );
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  function reset() {
    onClose();
    if (deck) {
      setDeckBack(null, false);
      notify("The deck uses the built-in back again.", "success");
      return;
    }
    const state = useCardsStore.getState();
    const { current, ids } = targets();
    const owned = new Set(
      [...ids].filter((id) => state.originalSelectedBackImages[id])
    );
    if (!owned.size) return;
    assignBacks(owned, null, `remove back for ${subject(owned, current)}`);
    notify(
      owned.size === 1
        ? "Assigned back removed."
        : `Assigned backs removed from ${plural(owned.size, "card", "cards")}.`,
      "success"
    );
  }

  return (
    <div className="back-tab">
      <section className="back-current" aria-labelledby="back-current-title">
        <div className="back-preview">
          {preview.src ? (
            <img src={preview.src} alt="" referrerPolicy="no-referrer" />
          ) : null}
        </div>
        <div className="back-summary">
          <h3 id="back-current-title">This card's back</h3>
          <p>{preview.caption}</p>
          <p className="hint">
            Without an assigned back, a double-faced card prints its other face
            and other cards print the deck's default back.
          </p>
          {!twoSided && (
            <p className="hint">
              Backs print only when Print setup is set to Two-sided.
            </p>
          )}
        </div>
      </section>
      <ScopeFieldset
        card={card}
        options={options}
        scope={scope}
        replaces={replaces}
        onChange={onScopeChange}
      />
      <div className="back-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus size={16} aria-hidden="true" />
          Upload back image
        </button>
        <label className="check-field">
          <input
            type="checkbox"
            checked={hasBleed}
            onChange={(e) => setHasBleed(e.target.checked)}
          />
          Image includes 3 mm MPC bleed
        </label>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label={
            deck ? "Back image for the deck" : `Back image for ${card.name}`
          }
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          className="text-button"
          disabled={!canReset}
          onClick={reset}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {deck ? "Use the built-in back" : "Remove assigned back"}
        </button>
      </div>
      <section aria-labelledby="mpc-backs-title">
        <div className="printings-bar">
          <div className="printings-title">
            <h3 id="mpc-backs-title">MPCFill cardbacks</h3>
            <MpcFillCredit />
          </div>
        </div>
        <form
          className="art-search"
          onSubmit={(e) => {
            e.preventDefault();
            setRequested(filter.trim());
            setAttempt((n) => n + 1);
          }}
        >
          <div className="field">
            <label htmlFor="mpc-back-search">Cardback name</label>
            <input
              id="mpc-back-search"
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="All cardbacks"
              autoComplete="off"
            />
          </div>
          <button className="secondary-button">
            <Search size={16} aria-hidden="true" /> Search
          </button>
        </form>
        <MpcFillResults
          key={`${requested}:${attempt}`}
          type="cardback"
          query={requested}
          selectedId={mpcImageId(deck ? customBack : backs[card.uuid])}
          onChoose={chooseMpc}
        />
      </section>
    </div>
  );
}
