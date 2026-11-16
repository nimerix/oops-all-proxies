import { useEffect, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { scopeTargets } from "../helpers/artworkScope";
import { getMpcImageUrl } from "../helpers/Mpc";
import {
  mpcImageId,
  mpcThumbnailUrl,
  searchMpcFill,
  type MpcImage,
  type MpcType,
} from "../helpers/mpcfill";
import { plural } from "../helpers/plural";
import { useCardsStore, usePreviewStore } from "../store";
import { errorMessage, notify } from "../store/notifications";
import { deckEdit } from "../store/undo";
import type { CardOption } from "../types/Card";
import { Thumbnail } from "./ArtworkPrintings";
import { useArtworkScope, type DialogScope } from "../hooks/useArtworkScope";
import { ScopeFieldset } from "./ArtworkScope";

export function MpcFillCredit() {
  return (
    <p className="hint mpc-credit">
      Community images from{" "}
      <a href="https://mpcfill.com" target="_blank" rel="noreferrer">
        MPCFill
      </a>
      , with 3 mm bleed.
    </p>
  );
}

// Remount with a new key to start a different search.
export function MpcFillResults({
  type,
  query,
  selectedId,
  onChoose,
}: {
  type: MpcType;
  query: string;
  selectedId: string | null;
  onChoose: (image: MpcImage) => void;
}) {
  const [images, setImages] = useState<MpcImage[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const focusFrom = useRef<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void searchMpcFill(type, query, page, controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return;
        setTotal(found.total);
        setHasMore(found.hasMore);
        setImages((shown) => {
          const seen = new Set(shown.map((image) => image.id));
          return [...shown, ...found.cards.filter((c) => !seen.has(c.id))];
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [type, query, page, attempt]);
  // "Show more" disappears after the last page, so focus the first new image.
  useEffect(() => {
    if (focusFrom.current === null || loading) return;
    const choices =
      list.current?.querySelectorAll<HTMLElement>(".artwork-choice");
    choices?.[focusFrom.current]?.focus();
    focusFrom.current = null;
  }, [images, loading]);

  const status = loading
    ? images.length
      ? "Loading more…"
      : "Searching MPCFill…"
    : error && !images.length
      ? ""
      : images.length < total
        ? `Showing ${images.length} of ${plural(total, "image", "images")}`
        : plural(images.length, "image", "images");
  return (
    <div className="mpc-results">
      <p className="hint" role="status">
        {status}
      </p>
      {!loading && !error && !total && (
        <div className="empty-results">
          <p>
            {query
              ? `No MPCFill images found for “${query}”. MPCFill matches whole card names.`
              : "MPCFill has no images here right now."}
          </p>
        </div>
      )}
      {images.length > 0 && (
        <ul className="artwork-grid" ref={list}>
          {images.map((image) => {
            const selected = image.id === selectedId;
            const meta = [image.source, image.dpi ? `${image.dpi} DPI` : ""]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={image.id}>
                <button
                  className="artwork-choice"
                  aria-pressed={selected}
                  aria-label={[`Choose ${image.name}`, meta]
                    .filter(Boolean)
                    .join(", ")}
                  onClick={() => onChoose(image)}
                >
                  <span className="artwork-thumb">
                    <Thumbnail
                      src={mpcThumbnailUrl(image.id)}
                      alt={`${image.name}${image.source ? `, ${image.source}` : ""}`}
                    />
                    {selected && (
                      <span className="artwork-selected">
                        <Check size={14} aria-hidden="true" />
                        Selected
                      </span>
                    )}
                  </span>
                  <span className="artwork-set" title={image.name}>
                    {image.name}
                  </span>
                  <span className="artwork-meta">{meta}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error ? (
        <div role="alert" className="empty-results">
          <p>Could not search MPCFill. {error}</p>
          <button
            className="secondary-button"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        hasMore &&
        !loading && (
          <div className="mpc-more">
            <button
              className="secondary-button"
              onClick={() => {
                focusFrom.current = images.length;
                setPage((n) => n + 1);
              }}
            >
              Show more
            </button>
          </div>
        )
      )}
    </div>
  );
}

const faceName = (card: CardOption) =>
  (card.faces?.length ?? 0) > 1
    ? (card.faces?.[card.currentFaceIndex ?? 0]?.name ?? card.name)
    : card.name;

export function ArtworkMpcFill({
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
  const [query, setQuery] = useState(() => faceName(card));
  const [requested, setRequested] = useState(query);
  const [attempt, setAttempt] = useState(0);
  const { options, scope, replaces } = useArtworkScope(
    card,
    chosenScope,
    "front"
  );
  const selectedId = useCardsStore((s) =>
    mpcImageId(s.originalSelectedImages[card.uuid])
  );

  function choose(image: MpcImage) {
    const url = getMpcImageUrl(image.id)!;
    const state = useCardsStore.getState();
    const current = state.cards.find((c) => c.uuid === card.uuid) ?? card;
    const targets = new Set(
      scopeTargets(
        scope === "deck" ? "copy" : scope,
        current,
        state.cards,
        state
      )
    );
    const ids = new Set(
      state.cards
        .filter(
          (c) =>
            targets.has(c.uuid) &&
            (state.originalSelectedImages[c.uuid] !== url ||
              !c.isUserUpload ||
              !c.hasBakedBleed ||
              !!state.uploadedFiles[c.uuid])
        )
        .map((c) => c.uuid)
    );
    onClose();
    if (!ids.size) return;
    const subject =
      ids.size === 1 ? current.name : `${ids.size} cards named ${current.name}`;
    deckEdit(`change artwork for ${subject}`, () =>
      useCardsStore.setState((s) => {
        const strip = <T,>(map: Record<string, T>) =>
          Object.fromEntries(
            Object.entries(map).filter(([id]) => !ids.has(id))
          );
        const originals = { ...s.originalSelectedImages };
        const backs = { ...s.originalSelectedBackImages };
        return {
          cards: s.cards.map((c) => {
            if (!ids.has(c.uuid)) return c;
            originals[c.uuid] = url;
            // The new image has one face, so a double-faced card keeps
            // printing its other face as an assigned back.
            const other =
              (c.faces?.length ?? 0) > 1 && !backs[c.uuid]
                ? c.faces?.[(c.currentFaceIndex ?? 0) === 0 ? 1 : 0]?.imageUrl
                : undefined;
            if (other) backs[c.uuid] = other;
            return {
              ...c,
              imageUrls: [],
              faces: undefined,
              layout: undefined,
              set: undefined,
              number: undefined,
              currentFaceIndex: undefined,
              isUserUpload: true,
              hasBakedBleed: true,
              ...(other
                ? { hasBackImage: true, backHasBakedBleed: false }
                : {}),
            };
          }),
          originalSelectedImages: originals,
          originalSelectedBackImages: backs,
          selectedImages: strip(s.selectedImages),
          selectedBackFaceImages: strip(s.selectedBackFaceImages),
          bleedReports: strip(s.bleedReports),
          uploadedFiles: strip(s.uploadedFiles),
        };
      })
    );
    usePreviewStore.getState().forget([...ids]);
    notify(
      ids.size === 1
        ? "Artwork updated."
        : `Artwork updated for ${ids.size} cards.`,
      "success"
    );
  }

  return (
    <>
      <div className="printings-bar">
        <div className="printings-title">
          <h3>MPCFill images of {requested}</h3>
          <MpcFillCredit />
        </div>
      </div>
      <form
        className="art-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            setRequested(query.trim());
            setAttempt((n) => n + 1);
          }
        }}
      >
        <div className="field">
          <label htmlFor="mpc-search-name">Card name</label>
          <input
            id="mpc-search-name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button className="secondary-button" disabled={!query.trim()}>
          <Search size={16} aria-hidden="true" /> Search
        </button>
      </form>
      {requested.toLowerCase() !== faceName(card).toLowerCase() && (
        <p className="replace-note">
          Choosing one changes the artwork only. The card keeps its name,{" "}
          {card.name}.
        </p>
      )}
      <ScopeFieldset
        card={card}
        options={options}
        scope={scope}
        replaces={replaces}
        onChange={onScopeChange}
      />
      <MpcFillResults
        key={`${requested}:${attempt}`}
        type="card"
        query={requested}
        selectedId={selectedId}
        onChoose={choose}
      />
    </>
  );
}
