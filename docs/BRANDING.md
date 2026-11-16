# Oops, All Proxies identity

The identity is called Gilded Misprint: leather, gold leaf and engraved capitals,
like a deluxe deck box, with one thing gone wrong. The symbol is a hand of three
cards with the last one slipping loose. The card back repeats the joke as a wheel
of twelve cards where two have slipped out of place.

It comes in five colors, used for two separate choices:

- **Color scheme**, from the palette button in the top bar. It changes how the
  site looks: the app colors, the header and the browser icon. It never changes
  what prints.
- **Default card back**, under **Print setup → Card backs**. It is a print
  setting, saved and reset with the others.

| Name | Leather | Cards on the back |
| --- | --- | --- |
| Midnight (default for both) | `#1D2152` | Six gems; the slipped cards are ruby |
| Oxblood | `#5B1A21` | Gold |
| Leather | `#5A3A1F` | Six gems; the slipped cards are ruby |
| Forest | `#1F4A3A` | Gold |
| Black | `#17171A` | Gold |

## Assets

Everything is generated; do not edit these files by hand.

In `client/public/brand/`:

| Asset | Use |
| --- | --- |
| `card-back-<name>.png` | Default card back for printing: opaque RGB, 1512 × 2112 pixels |
| `card-back-<name>.svg` | Vector source of the same back, used for the thumbnails in Print setup |
| `icons/<name>/` | `favicon.svg`, `favicon-32.png`, `favicon.ico` (16/32/48 px) and `apple-touch-icon.png` (180 px) |
| `mark.svg`, `mark.png` | Symbol on its tile, Midnight; the PNG is 1024 × 1024 |
| `logo.svg`, `logo.png` | Horizontal lockup for light surfaces, Midnight |
| `logo-inverse.svg`, `logo-inverse.png` | Horizontal lockup for dark surfaces, Midnight |
| `wordmark.svg`, `wordmark-inverse.svg` | Lettering without the symbol |

The Midnight icons are also copied to `client/public/`, where browsers and
crawlers look for them.

In `client/src/`:

| File | Use |
| --- | --- |
| `styles/schemes.css` | Every color that changes with the scheme, for light and dark themes |
| `schemes.ts` | Scheme ids, labels and browser theme colors |
| `components/shell/BrandMark.tsx`, `BrandWordmark.tsx` | Header symbol and outlined wordmark |

## How the color scheme works

- The choice is saved in `localStorage` under `oops-all-proxies:color-scheme`,
  not with the saved workspace. A short script in `index.html` sets
  `data-scheme` on `<html>` before the first paint, so the app's colors never
  flash the default. The browser icon and theme color follow when the app
  starts, and other open tabs follow a change.
- `schemes.css` defines the app colors for `:root` (Midnight) and for
  `:root[data-scheme="<id>"]`. The side panels follow the system light or dark
  theme. The top bar is the scheme's leather in both themes, with the symbol and
  wordmark in gold and cream.
- The brand colors are also set on any element with `data-scheme`, which is how
  the menu shows each scheme's symbol on its own leather.
- The menu is a native popover. A browser without popover support hides the
  button and stays in Midnight.
- "Reset settings" keeps the scheme. "Reset app data" returns it to Midnight.

## The card back

The chosen design is `cardbackDesign` in the saved print settings. `cardSource`
uses an assigned back first, then the opposite face, then the custom back, then
this design. "Reset settings" returns it to Midnight.

Each back is exactly 63 × 88 mm at 24 pixels per mm (609.6 DPI), with that size
recorded in the PNG's pHYs metadata and in the SVG's millimetre dimensions.

- **No baked bleed** and no rounded transparent corners. The outer 5 mm is one
  solid color; the app extends it as bleed and applies its normal corner shape.
  Upload the PNG elsewhere as an ordinary trimmed card image, not as an image
  with MPC bleed.
- **Black's edge is pure black.** The app treats a near-black edge as a black
  border and extends it as pure black, so any other near-black shows as a seam
  between cards.
- **Reads the same upside down.** Every one-way element, including the
  lettering, is drawn with its half-turn, so a back fed either way round
  matches the others.
- **Fine detail starts 6.2 mm inside the trim**, so small duplex misalignment
  on a home printer does not clip the frame.
- **Faint leather grain** covers the field. It also hides inkjet banding.
- A proxy must not pass for a real card from the back. The design uses no
  Wizards of the Coast marks, symbols, lettering or card-back layout, and the
  name is on it twice.

The file name is part of the cache key. Rename a back, for example
`card-back-forest-v2.png`, whenever its artwork changes, and update
`defaultCardbackUrl` in `client/src/constants.ts`. The old `/logo.png` and
`/cardback.png` are kept for saved legacy URLs and test fixtures.

## Usage

- Keep the full name **Oops, All Proxies**, including the comma.
- Keep the symbol on its leather tile, or on a surface of the same color as
  the header does. The cards are separated by an outline in the surface color,
  so the bare symbol does not work on an arbitrary background.
- Small icons (16 and 32 px) show two cards; larger ones show three.
- Gold is for the symbol, lettering on leather and the header's main button.
  Body text on light surfaces is ink `#1E1A14`.
- Do not add Magic's mana, tap or set symbols, or the five-color set of white,
  blue, black, red and green, to any brand artwork.

## Changing or adding a color

All colors are in `scripts/brand/schemes.mjs`: one entry per name with its
leather, card-back palette, symbol colors, and the light and dark app colors.
The first entry is the default. To add one, add an entry and run:

```sh
npm ci
npm run brand:build
```

`scripts/brand/generate.mjs` then writes every asset, `schemes.css`,
`schemes.ts` and both header components. It stops with an error if:

- a back is not exactly 63:88, is not fully opaque, or its outer 5 mm is not
  the single edge color;
- a back differs from its own half-turn by more than antialiasing;
- a text, control or symbol color falls below WCAG contrast on its surface
  (4.5:1 for text, 3:1 for controls and the symbol).

The final PNG is made identical under a 180-degree turn by copying the top
half onto its rotated partner. `resvg`, `opentype.js` and `pngjs` are
development tools only and do not enter the application bundle.

Lettering is Cinzel Black, bundled as `scripts/brand/Cinzel-Black.ttf` under
the SIL Open Font License (`scripts/brand/OFL.txt`), from the
[Cinzel project](https://github.com/NDISCOVER/Cinzel). The generator outlines
the text, so nothing downloads or installs the font.

## Design collaboration

The direction was worked out with Claude Opus 5.5 over several rounds. Its
recommendations that were applied:

- Keep materials and depth (leather, gold, grain) on the card back; keep the
  header nearly flat and draw the small icons separately with solid shapes.
- Use small cards and dots as ornaments. Playing-card diamonds read as poker
  and four-point sparkles as generic.
- Leave out a brown frame with a large oval, which would pass for the real
  back in a sleeve, and the five-color wheel.
- On a green field keep every card gold: red on green reads as Christmas. Keep
  the green dark and bluish, away from card-table felt.
- Do not use green as a page-wide accent on a light page. In Forest's light
  theme, green is the leather bar, the mat and filled controls; selections
  use a neutral tint.

## Open questions

- None of the backs has been test-printed. Printer color, ink coverage on the
  dark fields and duplex registration need a test print on the intended
  printer. Dark blue-greens are the most likely to shift on an inkjet.
- Opus 5.5's final review found the card-back medallion close to a roulette
  wheel or casino chip: the ring of tick marks, the cards fanned round a hub,
  and a hub letter that reads as "0". It suggested dropping the tick ring and
  putting the three-card symbol in the hub. It also read the riveted corner
  plates as art-deco fans. Neither has been changed.
- The six gems include red, green and blue. They are not Magic's five-color
  set, which needs white and black, but they are close enough to keep in mind.
