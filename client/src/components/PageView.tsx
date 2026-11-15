import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useShallow } from "zustand/react/shallow";
import CardCellLazy from "./CardCellLazy";
import EdgeCutLines from "./FullPageGuides";
import SortableCard, { type CardState } from "./SortableCard";
import { MatToolbar } from "./mat/MatToolbar";
import { useImageProcessing } from "../hooks/useImageProcessing";
import {
  scrollBehavior,
  useCurrentSheet,
  useFocusRequest,
  useScrollerSize,
  useSheetLabelHeight,
} from "../hooks/useSheetView";
import {
  useCardsStore,
  usePreviewStore,
  useSettingsStore,
  useUiStore,
} from "../store";
import { deckEdit } from "../store/undo";
import { pageSlots, printLayout } from "../helpers/printLayout";
import { cardSource } from "../helpers/cardSources";
import { needsArtwork } from "../helpers/deckGroups";
import { mmToPx, sheetScale } from "../helpers/sheetScale";
const ArtworkModal = lazy(() =>
  import("./ArtworkModal").then((module) => ({ default: module.ArtworkModal }))
);

const COMPACT_CARD_PX = 96;

export function PageView() {
  const s = useSettingsStore();
  const cards = useCardsStore((state) => state.cards);
  const indices = useMemo(
    () => new Map(cards.map((card, index) => [card.uuid, index])),
    [cards]
  );
  const images = useCardsStore(
    useShallow((state) => ({
      selectedImages: state.selectedImages,
      selectedBackFaceImages: state.selectedBackFaceImages,
      originalSelectedImages: state.originalSelectedImages,
      originalSelectedBackImages: state.originalSelectedBackImages,
      uploadedFiles: state.uploadedFiles,
      uploadedBackFiles: state.uploadedBackFiles,
    }))
  );
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const size = useScrollerSize(scroller);
  const layout = printLayout(s);
  const capacity = s.columns * s.rows;
  const pageCount = Math.ceil(cards.length / capacity);
  const labelHeight = useSheetLabelHeight(scroller, pageCount);
  const scale = sheetScale({
    mode: cards.length ? s.zoomMode : "page",
    zoom: s.zoom,
    containerWidth: size.width,
    containerHeight: size.height,
    pageWidthPx: mmToPx(layout.pageWidthMm),
    pageHeightPx: mmToPx(layout.pageHeightMm),
    labelHeight,
  });
  const back = s.viewMode === "back";
  useCurrentSheet(scroller, pageCount);
  const located = useFocusRequest(scroller, scale);
  const previewStatus = usePreviewStore((state) => state.status);
  const { ensureProcessed, ensureBackFaceProcessed } = useImageProcessing({
    unit: "mm",
    bleedEdgeWidth: s.bleedEdgeWidth,
  });
  const ensure = back ? ensureBackFaceProcessed : ensureProcessed;
  const hasSource = (card: (typeof cards)[number]) =>
    back
      ? !!cardSource(
          card,
          images,
          true,
          s.customCardbackUrl,
          s.customCardbackHasBleed
        ).source
      : !needsArtwork(card, images);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const showSheet = useCallback(
    (index: number) => {
      const frames = scroller?.querySelectorAll(".sheet-frame");
      frames?.[index]?.scrollIntoView({
        block: "start",
        behavior: scrollBehavior(),
      });
    },
    [scroller]
  );
  const pageStyle = {
    zoom: scale,
    width: `${layout.pageWidthMm}mm`,
    height: `${layout.pageHeightMm}mm`,
    "--control-zoom": 1 / scale,
  } as CSSProperties;
  const frameWidth = mmToPx(layout.pageWidthMm) * scale;
  return (
    <section
      id="preview-panel"
      className="preview-panel"
      aria-label="Print preview"
    >
      {cards.length > 0 && (
        <MatToolbar
          scale={scale}
          sheetCount={pageCount}
          onShowSheet={showSheet}
        />
      )}
      {cards.length > 0 && back && (
        <p className="back-hint">
          Backs are mirrored by column to align with the fronts.
        </p>
      )}
      <div
        className="sheet-scroller"
        ref={setScroller}
        style={{ "--sheet-scale": scale } as CSSProperties}
        /* A card can miss its own pointer leave; this clears what it left. */
        onPointerLeave={() => {
          const ui = useUiStore.getState();
          const id = ui.highlightedCardId;
          if (!id || id === located) return;
          const focused = document.activeElement
            ?.closest("[data-card-id]")
            ?.getAttribute("data-card-id");
          if (focused !== id) ui.setHighlightedCardId(null);
        }}
        data-compact={
          mmToPx(layout.cardWidthMm) * scale < COMPACT_CARD_PX || undefined
        }
      >
        {!cards.length ? (
          <div className="sheet-frame" style={{ width: frameWidth }}>
            <div className="proxy-page empty-sheet" style={pageStyle}>
              <div className="empty-sheet-message">
                <h2>No cards yet</h2>
                <p>
                  Paste a decklist in the Deck panel, or drop card images
                  anywhere.
                </p>
                <button
                  className="empty-sheet-add"
                  onClick={() => useUiStore.getState().setRegion("deck")}
                >
                  Add cards
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              const current = useCardsStore.getState().cards;
              const from = current.findIndex((c) => c.uuid === active.id),
                to = current.findIndex((c) => c.uuid === over.id);
              if (from >= 0 && to >= 0)
                deckEdit(`move ${current[from].name}`, () =>
                  useCardsStore
                    .getState()
                    .setCards(arrayMove(current, from, to))
                );
            }}
          >
            <SortableContext
              items={cards.map((c) => c.uuid)}
              strategy={rectSortingStrategy}
            >
              {Array.from({ length: pageCount }, (_, pageIndex) => (
                <div
                  className="sheet-frame"
                  key={pageIndex}
                  style={{ width: frameWidth }}
                >
                  <div className="sheet-label">
                    Sheet {pageIndex + 1}
                    <span>{back ? "Back" : "Front"}</span>
                  </div>
                  <div className="proxy-page" style={pageStyle}>
                    <div
                      className="card-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${s.columns}, ${layout.cardWidthMm}mm)`,
                        gridTemplateRows: `repeat(${s.rows}, ${layout.cardHeightMm}mm)`,
                        gap: `${s.cardSpacingMm}mm`,
                      }}
                    >
                      {pageSlots(
                        cards.slice(
                          pageIndex * capacity,
                          (pageIndex + 1) * capacity
                        ),
                        s.columns,
                        s.rows,
                        back
                      ).map((card, slot) => {
                        if (!card)
                          return (
                            <div key={`empty-${slot}`} aria-hidden="true" />
                          );
                        const imageSrc =
                          (back
                            ? images.selectedBackFaceImages
                            : images.selectedImages)[card.uuid] || "";
                        const source = hasSource(card);
                        const state: CardState = imageSrc
                          ? "ready"
                          : !source
                            ? "missing"
                            : previewStatus[`${card.uuid}:${back}`] === "error"
                              ? "failed"
                              : "loading";
                        return (
                          <CardCellLazy
                            key={`${card.uuid}:${s.viewMode}:${s.bleedEdgeWidth}:${s.useHighQualityPreviews}:${s.customCardbackUrl?.length}:${s.customCardbackHasBleed}`}
                            card={card}
                            hasImage={!!imageSrc}
                            hasSource={source}
                            ensureProcessed={ensure}
                          >
                            <SortableCard
                              card={card}
                              globalIndex={indices.get(card.uuid) ?? -1}
                              imageSrc={imageSrc}
                              state={state}
                              located={located === card.uuid}
                              onRetry={ensure}
                              totalCardWidth={layout.cardWidthMm}
                              totalCardHeight={layout.cardHeightMm}
                              viewMode={s.viewMode}
                              disableBackPageGuides={s.disableBackPageGuides}
                            />
                          </CardCellLazy>
                        );
                      })}
                    </div>
                    {!(back && s.disableBackPageGuides) && <EdgeCutLines />}
                  </div>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
      <Suspense fallback={null}>
        <ArtworkModal
          onRetry={(card, back) => {
            void (back ? ensureBackFaceProcessed : ensureProcessed)(card);
          }}
        />
      </Suspense>
    </section>
  );
}
