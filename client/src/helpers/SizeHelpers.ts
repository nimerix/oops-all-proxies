import { CARD_H_MM, CARD_W_MM, IN_TO_MM } from "@/constants";
import { useSettingsStore } from "@/store";
import type { CardDimensions } from "@/types/SizeTypes";

export function CardDimensionsInMm() {
  const cardWidthMm = CARD_W_MM;
  const cardHeightMm = CARD_H_MM;
  return { cardWidthMm, cardHeightMm };
}

export function PageDimensionsInMm() {
  const pageWidth = useSettingsStore((state) => state.pageWidth);
  const pageHeight = useSettingsStore((state) => state.pageHeight);
  const pageUnit = useSettingsStore((s) => s.pageSizeUnit);

  const pageWidthMm =
    pageUnit === "mm" ? pageWidth : IN_TO_MM * pageWidth;
  const pageHeightMm =
    pageUnit === "mm" ? pageHeight : IN_TO_MM * pageHeight;

  return { pageWidthMm, pageHeightMm };
}

export function InToMm(inches: number) {
  return inches * IN_TO_MM;
}

export function MmToIn(mm: number) {
  return mm / IN_TO_MM;
}

export function IsCardShaped(width: number, height: number): boolean {
  const referenceAspectRatio = 0.7159090909; // 63mm / 88mm
  const aspectRatio = width / height;
  return IsCloseTo(aspectRatio, referenceAspectRatio, 0.05);
}

export function IsScryfallRatio(width: number, height: number): boolean {
  const aspectRatio = width / height;
  return aspectRatio >= 0.716 && aspectRatio <= 0.717;
}

export function IsCloseTo(source: number, target: number, tolerance = 0.02): boolean {
  return source <= (Math.ceil(target * tolerance + target)) && source >= (Math.floor(target - target * tolerance));
}

export function ClampNumber(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

export function GetDPIandBleedPixels(widthPx: number, heightPx: number): { dpi: number; bleedPx: number } | null {

  if (IsScryfallRatio(widthPx, heightPx)) {
    const mul = widthPx / 745;
    const dpi = Math.round(300 * mul);
    const bleedPx = Math.round((widthPx % 745) / 2);
    if (Math.round((heightPx % 1040) / 2) === bleedPx) {
      return { dpi, bleedPx };
    }
  }
}
// given pixel dimensions, return CardDimensions with baked bleed sizes if applicable.
// match against known stanard sizes, such as scryfall images with or without bleeds.
// otherwise, calculate the card and bleed sizes based on the closest DPI from pixelDPIMap.
export function CalculateCardDimensions(widthPx: number, heightPx: number) : CardDimensions {
  //  scryfall uploads are 300 DPI, 745 px wide, and 1040 px tall
  if (widthPx == 745 && heightPx == 1040) {
    return {
      width: 745,
      height: 1040,
      widthWithBakedBleed: 745,
      heightWithBakedBleed: 1040,
      bleedSize: 0,
    };
  }
  // at 300 DPI, a 3mm bleed is either 35 or 36 pixels, depending on rounding.
  else if ((widthPx == 815 && heightPx == 1140) || (widthPx == 816 && heightPx == 1140)) {
    return {
      width: 745,
      height: 1040,
      widthWithBakedBleed: widthPx,
      heightWithBakedBleed: heightPx,
      bleedSize: widthPx == 815 ? 35 : 36,
    };
  }
  // scryfall uploads at 4x upscale are 2980 px wide and 4160 px tall
  else if (widthPx == 2980 && heightPx == 4160) {
    return {
      width: widthPx,
      height: heightPx,
      widthWithBakedBleed: widthPx,
      heightWithBakedBleed: heightPx,
      bleedSize: 0,
    };
  }
}
