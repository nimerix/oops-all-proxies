# Proxxied interface revamp: evaluation and design

Date: 2026-11-14. Branch: `ui-revamp`. Status: agreed by both reviewers (see "Consensus"); not yet reviewed by the owner.

The brief was: evaluate the interface and plan improvements or a revamp, with nothing taken as given. This document records what the evaluation found, the direction chosen, and the design a builder can plan from.

## 1. Evaluation

### Scope and method

Scope is the whole client interface: the workspace shell, adding cards, the sheet preview, per-card actions, the artwork picker, print settings, export, feedback (toasts, progress, errors), and the phone layout. The print pipeline (bleed generation, guides, PDF and ZIP output, storage) was reviewed and tested earlier (`docs/REVIEW.md`, `docs/BLEED_REVIEW.md`) and is out of scope.

Stack: React 19, TypeScript, Zustand, hand-written CSS in `client/src/index.css` with a few Tailwind 4 utilities, dnd-kit, native `<dialog>` and `<details>`. No design-system document, `AGENTS.md` or `CLAUDE.md` exists in the repository.

Evidence: every UI source file was read; the app was run against live Scryfall data with a 23-card deck that included a double-faced card, a set-specific printing and one unknown name; 19 screenshots were captured at 1440×900, 1920×1080, 1024×768 and 390×844 in light and dark (`.artifacts/ui-revamp/baseline/`); and a script measured contrast pairs, target sizes, text sizes, reflow at 320 px and the position of the export button.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | All components; 320 px reflow in each panel; target sizes; earlier axe scans in `tests/workspace.spec.ts` | 1 finding (shared with layout, no. 4) |
| Layout | Shell, panels and picker at four viewports; export position measured | 6 findings |
| Writing | Every string in `client/src/components/**` and `App.tsx` | 3 findings |
| Typography | `index.css` type rules; computed sizes; `document.fonts` | 1 finding |
| Colors | Token pairs measured in both themes | 1 finding (raw utility colors) |
| UI polish | Card controls, loading and error states, dialogs | 3 findings |

### Findings

Ranked by user impact. HIGH means it hides a control, misleads, or leaves an error without a way forward.

| # | Severity | Domain | Location | What happens now | Why it matters |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | Layout | `components/PageSettingsControls.tsx:331`, `LayoutSettings/ExportActions.tsx:71` | The export button sits at y = 969 px in a 900 px viewport at 1440×900. On a phone it is at y ≈ 1000 px inside the third tab, in a panel 1313 px tall. | The one action every session ends with is below the fold at the default laptop size and three taps plus a long scroll away on a phone. |
| 2 | HIGH | Writing | `components/CardCellLazy.tsx:49`, `hooks/useImageProcessing.ts:148`, `components/UploadSection.tsx:120` | A card name Scryfall does not know becomes a grey slot with a red "Load failed · retry" pill drawn over the card name. Retry cannot succeed because there is no image to load. The explanation is a toast that disappears after 8 s. | The error names the wrong problem and the wrong fix, and the only accurate message is gone before a user on sheet 1 can reach the card on sheet 3. |
| 3 | HIGH | UI polish | `components/SortableCard.tsx:124`, `components/CardCellLazy.tsx:45`, `index.css:936` | While artwork loads, every slot reads "Choose artwork" with a spinner drawn over the card name. With reduced motion the spinner is a frozen ring. | The label tells users to act on cards that are fine, the text is partly unreadable, and the loading state depends on motion. |
| 4 | MEDIUM | Layout | `components/PageView.tsx:161` (no list exists anywhere) | The print sheets are the only view of the deck. At 1440×900 the preview shows 730 px of a 1056 px sheet, so 69% of one sheet. A 100-card deck is 12 sheets. | Finding one card, checking that every card resolved, or changing a quantity means scrolling every sheet. |
| 5 | MEDIUM | Layout | `components/UploadSection.tsx:253` | The left 272 px column holds the add-cards form permanently. After the first import it is an empty textarea and three upload controls. | A fifth of the desktop width does nothing for most of the session. |
| 6 | MEDIUM | UI polish | `components/SortableCard.tsx:131`, `index.css:602` | Each card carries two to four white 28 px buttons at its corners at all times. The drag handle covers the mana cost. | The controls hide the thing being checked: whether the artwork is right. |
| 7 | MEDIUM | Layout | `components/PageView.tsx:56`, `:99` | "100%" means "fits the column width", not a scale. There is no way to fit a whole sheet. At 1920 px the sheet stops at 816 px with empty gutters. | The label is inaccurate, and the default view cannot show one complete sheet on a laptop. |
| 8 | MEDIUM | Layout | `components/PageSettingsControls.tsx:87`, `:332` | "Bleed artwork" holds four expert controls and about 25 lines of 12 px helper text. The instruction that decides whether a print is usable (100% scale, which edge to flip on) is 11.2 px muted text below the export buttons. | Rarely needed detail is loud; the critical instruction is the quietest text on the page. |
| 9 | MEDIUM | Layout | `LayoutSettings/CardbackSettings.tsx:72`, `ExportActions.tsx:79` | A checkbox in "Card backs & duplex" decides whether the export area shows one button or two. | The export choice is made in a different section from the export action, with no visible link between them. |
| 10 | MEDIUM | Layout | `components/ArtworkModal.tsx:216`, `:308`, `index.css:817` | The picker shows 8 of 72 printings at once, labelled only "SOS · #113". Thumbnails have no loading state. "Bleed for this card" is an unstyled disclosure above the search that pushes the results 480 px down when opened. | Choosing a printing is the most repeated task after import and it is slow to scan. |
| 11 | MEDIUM | Writing | `components/SortableCard.tsx:227`, `UploadSection.tsx:368`, `PageSettingsControls.tsx:343`, `App.tsx:119` | Removing a single card raises a browser `confirm`. Nothing can be undone. | A frequent, reversible action costs a modal every time, and a mistaken click on any other action cannot be reversed. |
| 12 | MEDIUM | UI polish | `components/UploadSection.tsx:77`, `components/LoadingOverlay.tsx` | A blocking dialog with an indeterminate "Working…" bar appears for an import that takes about a second. | A modal flashes for work that finishes before it can be read. |
| 13 | MEDIUM | Typography | `index.css:4`, `:13`, `:190`, `:459` | 40 visible text nodes are under 12 px in the default view (10.4 px and 11.2 px). The stack names Inter first but no font file is loaded, so every platform shows a different system face. | Small muted text carries real instructions, and the intended typeface never appears. |
| 14 | MEDIUM | Writing | `pages/ProxyBuilderPage.tsx:21`, `UploadSection.tsx:259`, `PageSettingsControls.tsx:39`, `PageView.tsx:123`, `UploadSection.tsx:122` | Taglines carry no instruction ("Your deck. Your table.", "Bring your next deck to the table.", "A little paper. Endless possibilities."). Panels are numbered "01 /" and "03 /" with no 02. "1 need artwork" is built from fragments. | Filler competes with instructions; the numbering implies a sequence that is not there. |
| 15 | LOW | Colors | `components/CardCellLazy.tsx:46`, `:53` | The spinner and retry pill use raw Tailwind greys and `red-600` instead of the project tokens. | Two styling idioms for one state; the red does not follow the theme. |

### What was checked and holds

- Contrast: every text and control pair built from the tokens passes its WCAG 2.2 AA threshold in both themes (lowest text pair measured 5.7:1; control border on white 4.4:1 against a 3:1 requirement).
- Reflow: no horizontal overflow at 320 px or 390 px in any of the three panels.
- Target sizes: card controls 28×28, zoom buttons 30×30, summaries 54 px tall. All meet the 24 px AA minimum; none reach the 44 px touch recommendation.
- Keyboard: native buttons, dialogs and details throughout; drag has menu alternatives ("Move earlier", "Move later").
- Not verified: screen-reader output on real devices, and artwork-picker thumbnail timing on a slow connection (first run showed 8 blank thumbnails after 4 s; a second run had 44 of 72 loaded at 2 s).

Verdict: **Block**. Three HIGH findings remain. None is a styling problem. Findings 1, 4, 5, 7 and 9 come from the same cause: the layout is organised around the order of first use (add, preview, settings) instead of around what a user looks at and does for most of a session.

## 2. Intent

People come to Proxxied with a decklist and leave with paper. The work in between is checking: did every card resolve, is this the printing I want, will this sheet cut cleanly. The revamp makes that checking fast and makes the last step, export, impossible to miss.

### Goals

1. Export is visible at all times on every screen size.
2. The deck is a list you can read, search and edit, with problems listed where they stay until fixed.
3. A whole sheet is visible by default, at an honest scale, with nothing covering the artwork until you reach for it.
4. Everyday print choices (paper, bleed, guides, backs) are separated from expert edge-repair controls.
5. Choosing a printing shows many options at once, labelled with set names.
6. Mistakes can be undone. Confirmation is kept for actions that destroy the whole workspace.
7. The interface has a look that belongs to a print-and-cut tool.

### Non-goals

- Any change to bleed generation, guide geometry, PDF or ZIP output, or the server.
- Any change to the IndexedDB format beyond adding settings keys with defaults.
- A component library, a Tailwind migration, routing, accounts or translation infrastructure.
- A manual light/dark switch. The app keeps following the system setting.
- Replacing an existing card's artwork by upload from inside the picker. It does not exist today and is a separate feature.
- Selecting several cards for bulk actions. Quantity buttons, scoped artwork changes, move commands and undo cover common work. They do not replace arbitrary multi-select removal or editing, which is a follow-up.
- Dragging a card by its whole face. The second reviewer showed it can swallow clicks on the card's own controls and interfere with touch scrolling. The handle stays; whole-card drag is a follow-up with its own tests.

### Anti-goals

- A wizard. Users go back and forth between deck, sheet and settings; a stepped flow would fight that.
- Tests that pass because their output assertions were loosened. Tests may change how they reach a control. They may not change what they assert about PDFs, pixels, ZIP contents or saved data.
- Decoration that adds reading work: taglines, numbered eyebrows, uppercase labels above headings.

## 3. Approaches considered

**A. Polish in place.** Keep the three columns and fix what the findings name: sticky export, hover-only card controls, shorter copy, an undo toast. Cheapest and least likely to break tests. It leaves findings 4 and 5 standing, because the left column would still be a form and there would still be no deck list.

**B. Restructure around the deck (chosen).** The left column becomes the deck: a list with quantities, status and search, with adding cards as an action inside it. The centre is a sheet at page scale. The right column is print setup. Export moves to the top bar and opens a short dialog holding the output choices and the print instructions. Same stack, same print pipeline, most components rewritten, browser tests updated to reach the new controls.

**C. Guided steps (add, arrange, print).** Simple for a first visit. Rejected: it hides the sheet while adding and hides the deck while printing, and every correction means stepping backwards.

**D. Canvas with floating panels.** Maximum room for sheets. Rejected: it turns three fixed places into things to open, move and find again, for a tool people use for ten minutes at a time.

B is chosen because the three HIGH findings and most MEDIUM ones are structural, and it resolves them without touching the tested core. The owner asked for a revamp and delegated the choice; this is the reviewer's call, not something the owner picked from options.

## 4. Design

### 4.1 Layout

Wide (1180 px and up):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ proxxied      23 cards, 3 sheets            Saved in this browser  [ Export… ] │
├─────────────────┬────────────────────────────────────────────┬────────────────┤
│ Deck  +Add Undo⋯│ Fronts|Backs      ‹ Sheet 1 of 3 ›     − Fit page ▾ +       │ Print setup    │
│ 22 ready,       │                                            │ Paper          │
│ 1 needs artwork │        ┌──────────────────────┐            │  Letter ▾      │
│           Show  │        │                      │            │  Portrait|Land │
│ Filter deck     │        │   one whole sheet    │            │  3 × 3  Auto   │
│ 1  Sol Ring   ⋯ │        │   on the mat         │            │ Sides          │
│ 1  Arcane S…  ⋯ │        │                      │            │  One | Two     │
│ 4  Island  − +  │        └──────────────────────┘            │ Cutting        │
│ …               │                                            │  Bleed Spacing │
│ 23 of 1,000     │                                            │ ▸ Advanced     │
└─────────────────┴────────────────────────────────────────────┴────────────────┘
      300 px                       fluid                            320 px
```

Medium (760 to 1179 px): two columns. One side panel, 320 px, with a two-way switch at its top (Deck, Print setup), and the mat.

Narrow (under 760 px): one region at a time, switched by a bottom bar with three buttons (Deck, Sheets, Print setup). The top bar keeps the brand, the count and Export.

```
┌──────────────────────────┐
│ proxxied  23·3  [Export…]│
├──────────────────────────┤
│                          │
│   current region         │
│                          │
├──────────────────────────┤
│  Deck   Sheets   Print   │
└──────────────────────────┘
```

Breakpoints are where the layout stops fitting, not device presets: three columns need 300 + 320 + about 560 for a readable sheet.

The top bar is 48 px. It contains the brand, the deck summary ("23 cards, 3 sheets"), the save status (the existing strings, unchanged: "Saved in this browser", "Saving workspace…", "Changes not saved", "Temporary workspace · saving disabled"), and the Export button. The tagline goes.

### 4.2 Deck panel

Replaces the Add cards panel.

**Header.** "Deck", an "Add cards" button, an Undo button, and a menu holding Copy decklist, Download decklist and Clear deck. Under it, a one-line summary once the deck has cards: "22 ready, 1 needs artwork".

**Add cards.** One form, shown two ways. While the deck is empty it fills the Deck panel, so a first visit can paste and go without opening anything. Once the deck has cards, the "Add cards" button opens the same form in a dialog about 560 px wide, where a long decklist line does not wrap. The form holds the Decklist textarea, Card language and "Add to deck", then "Your own images" with two file buttons (Card images; Images with MPC bleed) and the MPCFill XML or text input. The heading "Add cards" and the accessible names "Decklist", "Card language", "Add to deck", "Upload card images", "Upload MPC images" and "MPCFill XML or text" are kept. A successful add closes the dialog.

**Needs-attention line.** Shown when any card has no artwork or failed to load: "1 card needs artwork" with a Show button that filters the list to those cards. It stays until the count is zero. This replaces the toast as the record of what went wrong; the toast still appears as the immediate confirmation.

**List.** One row per distinct card, in sheet order of first appearance. Two copies share a row only when everything that reaches the printed page matches: name, front artwork source, current face, back source, and bleed overrides. Uploaded images are never merged with each other. Each row has the quantity with minus and plus buttons, the name, the set and collector number or "Your image", a status icon with text when something is wrong, and a menu. Rows for Scryfall cards may show the small Scryfall thumbnail the API already returns (`faces[].thumbUrl`); uploads show an icon. A filter field narrows rows by name.

**What a row action touches.** A row can stand for several copies, so each action states its target:

| Action | Target |
| --- | --- |
| Plus | Duplicates the last copy in the row, placed directly after it |
| Minus | Removes the last copy in the row |
| Change artwork | Opens the picker for the row, with its scope preset to the copies in this row (see 4.6) |
| Flip card | Every copy in the row, so they stay one row |
| Upload back image (uploaded cards) | Every copy in the row |
| Move to start, Move to end | Every copy in the row, keeping their order |
| Remove all copies | Every copy in the row |

Everything a card's own menu on the sheet can do is available from its row, so no task depends on hitting a small target on a large sheet. The check for this is A1 paper at Fit page.

**Linking to the sheet.** Selecting a row scrolls the mat to its first copy and rings it. Selecting the same row again moves to the next copy, and the row says which one ("copy 2 of 4"). Hovering or focusing a card on the mat marks its row. Neither opens anything.

**Footer.** "23 of 1,000 cards".

**Undo.** A stack of the last 20 deck changes: add, remove, duplicate, quantity, reorder, artwork change, flip, back upload, per-card bleed change, clear.

- One entry per completed user action. An action such as a flip makes several store writes; all of them sit inside one transaction, and the snapshot is taken before the first write. Nothing is recorded by watching the store.
- An entry is a snapshot of the persisted deck slice (`cards`, the two original-image maps, the two uploaded-file maps). It shares structure with the live state, so it is cheap.
- Restoring is one write to the persisted store, which saves through the existing IndexedDB write queue. Cached previews and bleed reports are dropped for cards that changed or no longer exist. A preview that finishes late for a state that no longer exists is discarded by the existing identity check in `useImageProcessing`.
- History lasts for the session only and is cleared by Reset app data.
- Undo is the header button and Ctrl/Cmd+Z when focus is not in a text field. The button's accessible name says what it will undo ("Undo: remove Sol Ring"). Redo is optional.

### 4.3 The mat

The centre region is drawn as a cutting mat: a deep, subdued green surface with a faint grid whose squares are 10 mm of the document, drawn at whatever scale the sheet is currently rendered. The grid tracks the sheet in every zoom mode, so it always agrees with the paper. It shows proportion, not calibrated size: a screen is not a ruler. The paper stays white in both themes. This is the one place the design spends its boldness; panels and controls stay quiet.

**Toolbar.** Fronts/Backs switch; "Sheet 1 of 3" with previous and next; zoom out, a zoom menu, zoom in.

**Zoom.** Three modes: Fit page (default), Fit width, and a fixed scale. The percentage shown is the scale of the document in CSS pixels, where 100% is 96 CSS px per inch. It is honest about the layout and makes no claim about physical size on a given monitor. The menu offers Fit page, Fit width, 50%, 100%, 200%; the buttons step through 25, 33, 50, 67, 75, 100, 125, 150, 200, 300. Settings gain `zoomMode`, which must be one of "page", "width" or "custom"; anything else, or a workspace saved before the revamp, opens in Fit page. `zoom` is reinterpreted as the fixed scale.

**Cards at rest.** On devices that hover, the drag handle, flip button, back-upload button and menu button appear when the card is hovered or contains focus. On touch devices the menu button stays visible, as today. Dragging stays on the handle, exactly as now. The card menu gains "Move to start" and "Move to end" beside "Move earlier" and "Move later", so a card can cross many sheets in one action.

**Card states.**

| State | Shown | Action |
| --- | --- | --- |
| Loading | A tinted block with the card name and "Loading artwork…". A slow pulse when motion is allowed, static otherwise. | None needed |
| Needs artwork (no image source) | Dashed amber outline, warning icon, the name, "No artwork found" | "Find artwork" opens the picker. No preview is attempted and no retry is offered. |
| Load failed | Warning icon, the name, "Couldn't load this image" | "Retry", and the card still opens the picker |
| Ready | The artwork, nothing over it | Click opens the picker |

**Empty deck.** One blank sheet on the mat with a short message: a heading "No cards yet" and "Paste a decklist in the Deck panel, or drop card images anywhere." On narrow screens it includes an "Add cards" button that switches to the Deck region. No hero, no feature list.

**Dropping files.** Dragging files over the window shows two targets: "Card images, trimmed to the card edge" and "Images with 3 mm bleed (MPC)". Dropping an XML or text file on either imports it as MPCFill. The upload and MPC import functions move out of the panel component into a shared helper so the buttons and the drop targets call the same code.

### 4.4 Print setup panel

Short groups under plain headings, ordered from intent to mechanics. Paper, Sides and Cutting are always open; expert controls are collapsed.

- **Paper.** Paper size (options show dimensions, for example "Letter, 8.5 × 11 in"). Orientation as two buttons, Portrait and Landscape. Columns and Rows with "Fit maximum cards" and a note of the result ("9 cards per sheet").
- **Sides.** Two buttons: One-sided, Two-sided. This is a new saved setting, `twoSided`, default off. A saved `twoSided` value always wins. Only when the key is absent, as in a workspace saved before the revamp, does it fall back to the saved `exportCollated`. So a user who chooses One-sided keeps it across reloads even though `exportCollated` is still on underneath, and a one-sided export produces fronts only. Choosing Two-sided opens the Card backs group below it and shows the flip instruction for the current orientation. The Fronts/Backs switch on the mat stays available either way.
- **Card backs** (open when two-sided, collapsed otherwise). Custom cardback, its preview, "Image includes 3 mm MPC bleed", "Remove custom cardback", "Hide cutting guides on backs".
- **Cutting.** Bleed (mm), Spacing (mm), one line explaining bleed. Show cutting guides, then colour, width, rounded corner guides and corner offset when guides are on.
- **Advanced: artwork edges** (collapsed). Border bleed, Image edges, Image corner radius, Shadow removal. Each keeps its label and gets one line of help. The longer explanations move into a "How edge cleanup works" disclosure in the same group, so nothing is lost and nothing is in the way.
- **Advanced: preview** (collapsed). Sharper previews.
- **Footer.** Reset settings, Reset app data, and the GitHub and support links.

Existing labels are kept wherever the control survives ("Paper size", "Columns", "Rows", "Bleed (mm)", "Spacing (mm)", "Border bleed", "Image edges", "Image corner radius (mm)", "Shadow removal (mm)", "Custom cardback", "Width (px)").

### 4.5 Export dialog

The Export button in the top bar opens a dialog. This puts the output choices and the print instructions at the moment they matter.

- **Summary.** One line of what will be produced: "23 cards on 3 Letter sheets, one-sided, 2 mm bleed."
- **Two-sided output** (only when Sides is Two-sided). Two radio buttons: "One file, fronts and backs alternating" for printers that duplex automatically, and "Two files, fronts and backs" for flipping the stack by hand. This reads and writes the existing `exportCollated` setting and replaces the "Collate fronts and backs in one PDF" checkbox.
- **Quality.** Resolution, "Split PDF into smaller files", Pages per file.
- **Before you print.** At body size, not as a footnote: "Print at 100% (actual size)." When two-sided: "Flip on the long edge." (short edge in landscape). "Print one sheet first to check alignment."
- **Buttons.** One-sided: "Export fronts PDF". Two-sided, one file: "Export collated PDF". Two-sided, two files: "Export fronts PDF" as the primary and "Export backs PDF" beside it. These are the existing button names.
- **Other downloads.** "Download original images · ZIP" with its three filename options behind a disclosure; "Copy list"; "Download list".

Starting an export closes this dialog and shows the existing progress dialog with Cancel.

### 4.6 Artwork picker

A wider dialog (up to 1040 px) with two tabs under the card name: **Printings** and **Bleed for this card**.

**Printings.** Today one dialog chooses a printing, replaces the card with a different one, and applies to every copy, under a title that promises only the first. The tab separates them. The heading reads "Printings of Sol Ring" and the set filter sits beside it, pinned at the top of the scrolling area. Replacing the card is a second, clearly named control: "Replace with a different card" reveals the "Find a card" search. It starts revealed when the card has no artwork, because correcting the name is the fix. While results are for another name, a line above the grid says so: "Printings of Lightning Bolt. Choosing one replaces Sol Ring."

**Which cards a choice changes.** Today the "apply to every" option changes every card with the same name, including copies that use a different printing, and discards their uploaded fronts and backs, without saying so. The picker now names the target set and shows only the options that differ:

| Option | Changes | Shown when |
| --- | --- | --- |
| "This copy" | The one card the picker was opened for | Always, and the default when opened from the sheet |
| "The 4 copies in this row" | The cards that share its deck row | The row has more than one copy; the default when opened from a deck row |
| "All 6 cards named Island, across printings" | Every card with that name | More cards share the name than share the row |

When the chosen set includes uploaded images or assigned backs, a line under the options says what will be replaced: "This replaces 2 uploaded images and 1 custom back." The set is computed by one pure function with unit tests covering same-name cards that differ by front, back and override, and the single-copy path.

The grid uses `repeat(auto-fill, minmax(132px, 1fr))`, about six across. Each choice shows the set name on one line and "C21 #263, 2021" on the next; the year comes from `released_at`, which the sets endpoint already returns. The selected choice has a ring, a check mark and the word "Selected". Thumbnails show a tinted placeholder until they load and "Image unavailable" if they fail.

**Bleed for this card.** The live preview on one side, the four overrides on the other, a "Reset to print settings" button, the detected-edges line and the suggested shadow removal. For uploaded images it adds "Image includes 3 mm MPC bleed", so a wrongly categorised upload can be corrected without uploading again. Preview status moves from props threaded through `PageView` into a small store so this tab and the deck list can both read it.

### 4.7 Feedback

- **Confirmation.** A small in-app dialog replaces `window.confirm`. It is used for Clear deck, Reset settings, Reset app data and deleting saved data at startup. The title names the action and object ("Clear all 23 cards?"), the body says what is lost, the buttons are a verb plus object and Cancel. Removing a single card no longer asks; it happens and can be undone.
- **Toasts.** May carry one action button ("Removed Sol Ring. Undo"). Errors stay until dismissed. Success and information messages time out as now.
- **Progress.** The task dialog appears only if a task runs longer than 300 ms. Buttons are disabled immediately, as now.

### 4.8 Visual system

**Colour.** Named roles, defined once for light and once for dark, and the only values components use.

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg-panel` | `#f3f4f1` | `#18201d` | Top bar and side panels |
| `--bg-raised` | `#ffffff` | `#212b27` | Inputs, menus, dialogs |
| `--bg-mat` | `#2f4b41` | `#16241f` | The mat |
| `--mat-grid` | `#ffffff1f` | `#ffffff14` | 10 mm grid lines |
| `--paper` | `#ffffff` | `#ffffff` | Sheets, always white |
| `--text` | `#17211d` | `#eef3ef` | Body text |
| `--text-muted` | `#4f5f58` | `#b3c2b9` | Secondary text |
| `--border` | `#d9ddd6` | `#35443c` | Dividers |
| `--border-control` | `#7d8a82` | `#76897d` | Input and button outlines |
| `--accent` | `#17604a` | `#9fdcb9` | The primary button, selection |
| `--warn` | `#8a5300` | `#f2c46d` | Needs-artwork state |
| `--danger` | `#a82a2d` | `#ffadae` | Destructive actions, load failures |
| `--focus` | `#1f6fd1` | `#8fbcff` | Focus ring |

These are starting values. The builder measures every text pair (4.5:1) and every control boundary and focus ring (3:1) on the background it is drawn on, adjusts lightness where one fails, and records the measured table in the review notes. Controls that sit on the mat or over artwork use a two-tone ring (light inside, dark outside) so they hold 3:1 against any background. Only the Export button is filled with the accent.

**Type.** The platform's own interface face, chosen on purpose: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. The stack stops naming Inter, which was never loaded, and `font-synthesis: none` is removed. No font is downloaded. Weights are limited to 400, 500, 600 and 700, which every one of those faces ships. Sizes in rem: 16 px panel titles, 14 px body and controls, 13 px secondary, 12 px captions. Nothing is smaller than 12 px. Inputs are 16 px on touch layouts. Quantities, dimensions and percentages use tabular figures. No uppercase eyebrow labels, no numbered section markers, no monospace for data labels, no arrows appended to link text.

**Shape and depth.** Controls 6 px radius, menus and dialogs 10 px, paper square. Panels are flat regions separated by a divider. Shadows are used only for things that float: paper on the mat, menus, dialogs, toasts.

**Motion.** State changes on hover and press are transitions of 150 ms or less on named properties. Movement, scale and blur run only under `prefers-reduced-motion: no-preference`; otherwise opacity. Hover styling stays inside `@media (hover: hover)`.

**CSS organisation.** `index.css` becomes an entry file importing `styles/tokens.css`, `base.css`, `shell.css`, `deck.css`, `mat.css`, `print.css`, `dialogs.css` and `feedback.css`. Semantic class names continue; Tailwind stays for utilities only. Component files stop using raw utility colours.

### 4.9 Copy

Sentence case. Buttons start with a verb. Errors say what to do next. Counts use `Intl.PluralRules` through one helper rather than `count === 1 ? "" : "s"`. The taglines and eyebrows listed in finding 14 are deleted, not rewritten.

## 5. Constraints

- The class names `.sheet-scroller`, `.proxy-page`, `.card-grid`, `.card-menu` and `.card-control` are used by tests and by the layout maths. Keep them.
- Card accessible names stay as they are: "{name}, change artwork", "Actions for {name}", "Reorder {name}", "Flip {name}", "Upload back for {name}", "Back image for {name}".
- `npm run check` and `npm run test:e2e` (Chromium and WebKit) pass at the end of every phase.
- New persisted settings are added to `defaultPageSettings` and validated in `restoreSettings`. The legacy-migration test keeps passing.
- No new runtime dependency.
- Card identity, order, face, per-card overrides and original uploads survive every deck-list action. The grouping rule in 4.2 has unit tests for copies that differ only by back, by face and by override.
- Every new dialog, menu and bottom bar restores focus to its opener and is checked for covering focused content on a phone.
- Comments only where a reader would otherwise be misled.

## 6. Acceptance

1. At 1440×900 with the 23-card test deck: Export is visible without scrolling; one whole sheet is visible at the default zoom; no control overlaps artwork until a card is hovered or focused.
2. At 390×844: Export is one tap from every region. At 320 px no region scrolls sideways.
3. An unknown card name appears in the Deck panel's needs-attention line and stays there until fixed. The card offers "Find artwork" and never "retry".
4. Removing a card takes one action and Ctrl/Cmd+Z brings it back, including an uploaded image and its back.
5. The picker shows at least 18 printings at 1440×900, each with a set name, checked against a fixed test fixture of 24 printings.
6. No visible text is under 12 px, and the page requests no font file.
7. Axe scans are clean in light and dark for: empty deck, populated deck, export dialog, artwork picker (both tabs), confirm dialog, at 1440, 768, 390 and 320 px.
8. Every colour pair in section 4.8 is measured and recorded.
9. The existing print-output assertions pass unchanged in substance.
10. New screenshots of the same 19 states are saved beside the baseline for comparison.
11. With A1 paper at Fit page, every per-card action (change artwork, flip, upload back, duplicate, remove, move) can be completed from the Deck panel.
12. A one-sided choice survives a reload while `exportCollated` is still on, and exports fronts only. Each export branch (one-sided; two-sided in one file; two-sided in two files) produces the pages it names.
13. Changing artwork with each scope option changes exactly the named cards and no others.
14. Closing any dialog or menu returns focus to the control that opened it, checked by test for the export dialog, the Add cards dialog, the confirm dialog and the picker.
15. The layout checks run on Letter portrait, Letter landscape and A1, and at 1440, 1024, 390 and 320 px.

## 7. Left to the builder

- Exact spacing, the final colour values after measurement, and icon choices within the existing `lucide-react` set.
- Whether quantity buttons are always visible or appear on row hover and focus, provided they are keyboard reachable and at least 24 px.
- Whether deck rows show thumbnails, depending on how they read at 300 px.
- Whether redo is included.
- Ctrl/Cmd+wheel zoom and pasting a decklist anywhere on the page are welcome if they fall out cheaply and are not required.

## 8. Phases

1. **Foundations.** Tokens, type scale, the CSS split, the confirm dialog, toast actions, the delayed task dialog, and the `ui`, `undo` and `previews` stores.
2. **Shell, export dialog and print setup.** Top bar, the three layouts, bottom bar, the regrouped panel with Sides, the export dialog.
3. **Deck panel.** List, quantities, summary and needs-attention, the add-cards form and dialog, drop targets, undo wiring.
4. **The mat.** Zoom modes, sheet navigator, mat surface, card states, hover controls, empty state.
5. **Artwork picker.** Tabs, dense labelled grid, the scope options, bleed tab, the per-upload bleed switch.
6. **Review.** Screenshots of all states, measurements, an independent review of the result, fixes, and updates to `README.md` and `docs/REVIEW.md`.

Phases run one after another in the same checkout because they share the test file and the build output.

## Consensus

A second reviewer (GPT-6 Astra) evaluated the same interface without sight of this document. Its report is in `.artifacts/ui-revamp/astra-eval.md`.

**Where the two reads agree.** Restructure and keep the stack and print engine. Export needs a permanent place. An unknown card needs a lasting repair path, not a retry. The add-cards column should become a deck roster with quantities, filtering and a needs-artwork view. The sheet should fit the view at an honest scale. Card controls should not sit on the artwork. Print instructions belong at export. The numbered headings and slogans go.

**Adopted from the second reviewer.**

- Adding cards opens a dialog once the deck has cards, instead of a disclosure in a 300 px column.
- A "22 ready, 1 needs artwork" summary on the deck.
- Print setup leads with intent: a Sides choice ahead of bleed and grid, which also simplifies the export dialog.
- The picker separates choosing a printing from replacing the card, and states how many copies a choice affects.
- No font dependency. The earlier draft proposed self-hosting a typeface; the system stack is used instead.
- The grouping rule counts backs, faces and overrides, with tests.

**Three points where the designs differed, and how they were settled.** The second reviewer's reply is in `.artifacts/ui-revamp/astra-consensus.md`.

1. *One workspace or two modes.* It had proposed a Deck mode (card gallery plus inspector) and a Print mode (clean sheet plus setup). It agreed to the single workspace on condition that the roster can do everything the sheet can, that each row action states which copies it touches, and that this is checked on A1 at Fit page. Those conditions are now in 4.2 and acceptance item 11.
2. *The surface behind the paper.* It had proposed neutral grey. It accepted the subdued green mat as the one characterful surface, on condition that the grid and the zoom percentage are described as document scale and not physical size, and that the grid follows the sheet in every zoom mode. 4.3 now says so.
3. *Bulk selection.* It agreed to defer multi-select, provided the design does not claim the other controls replace it. The non-goal is reworded.

**Four blocking objections it raised, all accepted.**

1. *Artwork scope.* "Apply to all copies" was ambiguous between a row and every card of that name, and the existing behaviour silently discards uploads. 4.6 now defines three named target sets and discloses what is replaced.
2. *Undo as transactions.* Recording individual store writes could restore a half-finished flip. 4.2 now requires one entry per user action, with the snapshot taken before the first write.
3. *Settings precedence.* A saved one-sided choice must not revert because `exportCollated` is still on. 4.4 states the precedence and acceptance item 12 tests it.
4. *Whole-card drag.* It can intercept the card's own controls and touch scrolling. The feature is cut from this round; the drag handle stays as it is.

Its smaller suggestions are in the acceptance list: focus-restoration tests, layout checks beyond Letter, and a fixed fixture for the picker count.

**Verdict from the second reviewer:** consensus after the changes above. With those changes made, both reviewers agree the design is ready to build.
