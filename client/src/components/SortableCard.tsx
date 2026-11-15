import { memo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Hourglass,
  MoreHorizontal,
  RotateCw,
  ImagePlus,
  TriangleAlert,
} from "lucide-react";
import {
  useArtworkModalStore,
  useSettingsStore,
  useCardsStore,
  usePreviewStore,
  useUiStore,
} from "../store";
import { makeUploadedFileToken } from "../helpers/ImageHelper";
import { errorMessage, notify } from "../store/notifications";
import { deckEdit, UNDO_NOTICE_TAG, undoFromUser } from "../store/undo";
import { copyUpload } from "../helpers/uploads";
import { cornerGuideLines } from "../helpers/printGuides";
import { GuideOverlay } from "./GuideOverlay";
import type { CardOption } from "../types/Card";

export type CardState = "ready" | "loading" | "missing" | "failed";

const STATE_TEXT: Record<Exclude<CardState, "ready">, string> = {
  loading: "Loading artwork…",
  missing: "No artwork found",
  failed: "Couldn't load this image",
};

type Props = {
  card: CardOption;
  globalIndex: number;
  imageSrc: string;
  state: CardState;
  located: boolean;
  onRetry: (card: CardOption) => Promise<void>;
  totalCardWidth: number;
  totalCardHeight: number;
  viewMode: "front" | "back";
  disableBackPageGuides: boolean;
};
const SortableCard = memo(function SortableCard({
  card,
  globalIndex,
  imageSrc,
  state,
  located,
  onRetry,
  totalCardWidth,
  totalCardHeight,
  viewMode,
  disableBackPageGuides,
}: Props) {
  const highlighted = useUiStore((s) => s.highlightedCardId === card.uuid);
  const {
    useCornerGuides,
    guideWidth,
    guideColor,
    roundedCornerGuides,
    cornerGuideOffsetMm,
    bleedEdgeWidth,
  } = useSettingsStore(
    useShallow((s) => ({
      useCornerGuides: s.useCornerGuides,
      guideWidth: s.guideWidth,
      guideColor: s.guideColor,
      roundedCornerGuides: s.roundedCornerGuides,
      cornerGuideOffsetMm: s.cornerGuideOffsetMm,
      bleedEdgeWidth: s.bleedEdgeWidth,
    }))
  );
  const shouldShowGuides =
    useCornerGuides && !(viewMode === "back" && disableBackPageGuides);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.uuid });
  const menu = useRef<HTMLDetailsElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const art = useRef<HTMLButtonElement>(null);
  const currentIndex = () =>
    useCardsStore.getState().cards.findIndex((c) => c.uuid === card.uuid);
  const flip = () => {
    const index = (card.currentFaceIndex ?? 0) === 0 ? 1 : 0;
    const state = useCardsStore.getState();
    const face = card.faces?.[index];
    if (!face) return;
    deckEdit(`flip ${card.name}`, () => {
      state.updateCard(currentIndex(), { currentFaceIndex: index });
      state.appendOriginalSelectedImages({ [card.uuid]: face.imageUrl });
      state.clearSelectedImage(card.uuid);
      state.clearSelectedBackFaceImage(card.uuid);
    });
  };
  const duplicate = () =>
    deckEdit(`duplicate ${card.name}`, () =>
      useCardsStore.getState().duplicateCardAt(currentIndex())
    );
  const moveTo = (target: (from: number, count: number) => number) => {
    const store = useCardsStore.getState();
    const from = currentIndex();
    const to = target(from, store.cards.length);
    if (from < 0 || to < 0 || to >= store.cards.length || to === from) return;
    const cards = [...store.cards];
    const [selected] = cards.splice(from, 1);
    cards.splice(to, 0, selected);
    if (menu.current) menu.current.open = false;
    deckEdit(`move ${card.name}`, () => store.setCards(cards));
    requestAnimationFrame(() =>
      menu.current?.querySelector("summary")?.focus()
    );
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${totalCardWidth}mm`,
    height: `${totalCardHeight}mm`,
  };
  const highlight = (on: boolean) => {
    const ui = useUiStore.getState();
    if (on) ui.setHighlightedCardId(card.uuid);
    else if (ui.highlightedCardId === card.uuid) ui.setHighlightedCardId(null);
  };
  const stateId = `card-state-${card.uuid}`;
  const last = useCardsStore((s) => s.cards.length) - 1;
  return (
    <div
      ref={setNodeRef}
      className="sortable-card"
      style={style}
      data-card-id={card.uuid}
      data-highlighted={highlighted || undefined}
      data-located={located || undefined}
      onPointerEnter={() => highlight(true)}
      onPointerLeave={() => highlight(false)}
      onFocus={() => highlight(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) highlight(false);
      }}
    >
      <button
        ref={art}
        className="card-art"
        aria-label={
          state === "missing"
            ? `${card.name}, find artwork`
            : `${card.name}, change artwork`
        }
        aria-describedby={state === "ready" ? undefined : stateId}
        onContextMenu={(e) => {
          e.preventDefault();
          if (menu.current) menu.current.open = true;
        }}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) duplicate();
          else
            useArtworkModalStore.getState().openModal({
              card,
              index: currentIndex(),
              autoFetchPrints: true,
            });
        }}
      >
        {state === "ready" ? (
          <img src={imageSrc} alt={card.name} draggable={false} />
        ) : (
          <span className={`card-state ${state}`}>
            {state === "loading" ? (
              <Hourglass className="card-state-icon" aria-hidden="true" />
            ) : (
              <TriangleAlert className="card-state-icon" aria-hidden="true" />
            )}
            <strong>{card.name}</strong>
            <span id={stateId}>{STATE_TEXT[state]}</span>
            {state === "missing" && (
              <span className="card-state-action">Find artwork</span>
            )}
          </span>
        )}
      </button>
      {state === "failed" && (
        <button
          className="card-retry"
          aria-label={`Retry ${card.name}`}
          onClick={() => {
            art.current?.focus();
            void onRetry(card);
          }}
        >
          Retry
        </button>
      )}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="card-control drag-handle"
        aria-label={`Reorder ${card.name}`}
        title="Drag to reorder, or press Space and use arrow keys"
      >
        <GripVertical size={17} />
      </button>
      {(card.faces?.length ?? 0) > 1 && (
        <button
          className="card-control flip-card"
          aria-label={`Flip ${card.name}`}
          onClick={flip}
        >
          <RotateCw size={16} />
        </button>
      )}
      <details
        ref={menu}
        className="card-menu"
        name="card-actions"
        onToggle={(e) => {
          const details = e.currentTarget;
          if (!details.open) return;
          const panel = details.querySelector("div");
          const scroller = details.closest(".sheet-scroller");
          if (!panel || !scroller) return;
          const bounds = scroller.getBoundingClientRect();
          const left = Math.max(8, bounds.left + 8);
          const right = Math.min(innerWidth - 8, bounds.right - 8);
          const top = Math.max(8, bounds.top + 8);
          const bottom = Math.min(innerHeight - 8, bounds.bottom - 8);
          panel.style.transform = "";
          panel.style.maxHeight = `${Math.max(32, bottom - top)}px`;
          const rect = panel.getBoundingClientRect();
          const x = Math.max(left - rect.left, Math.min(0, right - rect.right));
          const y = Math.max(top - rect.top, Math.min(0, bottom - rect.bottom));
          panel.style.transform = `translate(${x}px, ${y}px)`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            if (menu.current) {
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }
        }}
      >
        <summary aria-label={`Actions for ${card.name}`}>
          <MoreHorizontal size={18} />
        </summary>
        <div>
          <strong>{card.name}</strong>
          {(card.faces?.length ?? 0) > 1 && (
            <button
              onClick={() => {
                flip();
                if (menu.current) menu.current.open = false;
              }}
            >
              Flip card
            </button>
          )}
          {card.isUserUpload && (
            <button
              onClick={() => {
                fileInput.current?.click();
                if (menu.current) menu.current.open = false;
              }}
            >
              Upload back image
            </button>
          )}
          <button
            onClick={() => {
              duplicate();
              if (menu.current) menu.current.open = false;
            }}
          >
            Duplicate
          </button>
          <button disabled={globalIndex === 0} onClick={() => moveTo(() => 0)}>
            Move to start
          </button>
          <button
            disabled={globalIndex === 0}
            onClick={() => moveTo((from) => from - 1)}
          >
            Move earlier
          </button>
          <button
            disabled={globalIndex === last}
            onClick={() => moveTo((from) => from + 1)}
          >
            Move later
          </button>
          <button
            disabled={globalIndex === last}
            onClick={() => moveTo((_, count) => count - 1)}
          >
            Move to end
          </button>
          <button
            className="danger"
            onClick={() => {
              const entry = deckEdit(`remove ${card.name}`, () =>
                useCardsStore.getState().removeCardAt(currentIndex())
              );
              if (!entry) return;
              usePreviewStore.getState().forget([card.uuid]);
              notify(`Removed ${card.name}.`, "info", {
                label: "Undo",
                tag: UNDO_NOTICE_TAG,
                run: () => undoFromUser(entry) !== null,
              });
            }}
          >
            Remove card
          </button>
        </div>
      </details>
      {card.isUserUpload && (
        <>
          <button
            className="card-control back-upload"
            aria-label={`Upload back for ${card.name}`}
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus size={16} />
          </button>
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-label={`Back image for ${card.name}`}
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (
                !/^image\/(png|jpeg|webp)$/.test(file.type) ||
                file.size > 30 * 1024 * 1024
              ) {
                notify(
                  "Choose a PNG, JPEG or WebP back image up to 30 MB.",
                  "error"
                );
                return;
              }
              try {
                const copied = await copyUpload(file);
                const state = useCardsStore.getState();
                if (state.cards.find((c) => c.uuid === card.uuid) !== card) {
                  notify(
                    "Back image not added: the card changed while the file was loading. Choose the image again."
                  );
                  return;
                }
                deckEdit(`add back for ${card.name}`, () => {
                  state.appendUploadedBackFiles({ [card.uuid]: copied });
                  state.appendOriginalSelectedBackImages({
                    [card.uuid]: makeUploadedFileToken(card.uuid),
                  });
                  state.clearSelectedBackFaceImage(card.uuid);
                  state.updateCard(currentIndex(), {
                    hasBackImage: true,
                    backHasBakedBleed: false,
                  });
                });
                notify(
                  "Back image added. Upload a standard image without baked bleed.",
                  "success"
                );
              } catch (error) {
                notify(errorMessage(error), "error");
              }
            }}
          />
        </>
      )}
      {shouldShowGuides && (
        <GuideOverlay
          lines={cornerGuideLines(
            bleedEdgeWidth,
            roundedCornerGuides,
            cornerGuideOffsetMm
          )}
          width={totalCardWidth}
          height={totalCardHeight}
          color={guideColor}
          strokeWidth={(guideWidth * 25.4) / 96}
        />
      )}
    </div>
  );
});
export default SortableCard;
