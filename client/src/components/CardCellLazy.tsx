import React, { useEffect, memo, useRef } from "react";
import { useOnScreen } from "../hooks/useOnScreen";
import type { CardOption } from "../types/Card";

type Props = {
  card: CardOption;
  hasImage: boolean;
  hasSource: boolean;
  ensureProcessed: (card: CardOption) => Promise<void>;
  children: React.ReactNode;
};

const CardCellLazy = memo(function CardCellLazy({
  card,
  hasImage,
  hasSource,
  ensureProcessed,
  children,
}: Props) {
  const { ref, visible } = useOnScreen<HTMLDivElement>("400px");
  const attemptedRef = useRef(false);
  const prevHasImageRef = useRef(hasImage);

  useEffect(() => {
    attemptedRef.current = false;
  }, [card, ensureProcessed]);

  // Reset attemptedRef when hasImage changes from true to false (image was cleared)
  useEffect(() => {
    if (prevHasImageRef.current && !hasImage) {
      attemptedRef.current = false;
    }
    prevHasImageRef.current = hasImage;
  }, [hasImage]);

  useEffect(() => {
    // Only attempt to process once - don't retry automatically when in error state
    if (visible && hasSource && !hasImage && !attemptedRef.current) {
      attemptedRef.current = true;
      void ensureProcessed(card);
    }
  }, [visible, card, ensureProcessed, hasImage, hasSource]);

  return (
    <div ref={ref} className="card-cell">
      {children}
    </div>
  );
});

export default CardCellLazy;
