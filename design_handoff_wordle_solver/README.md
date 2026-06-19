# Handoff: Wordle Solver (Shannon entropy)

## Overview
A single-page UI for a Wordle solver that ranks guesses by Shannon entropy. The user
records the guesses they've played and the feedback colors Wordle gave them; the app
shows the optimal opening words (ranked by expected information gain) and aggregate
performance metrics. This handoff covers **the visual design and front-end interactions
only** — the entropy/solver logic already exists in the target codebase.

## About the Design Files
The file in this bundle (`Wordle Solver.dc.html`) is a **design reference created in
HTML** — a working prototype that shows the intended look and front-end behavior. It is
**not production code to copy directly**. The task is to **recreate this design in the
target codebase** using its existing framework, component library, and conventions
(React/Vue/Svelte/etc.). The hardcoded candidate words and metric numbers are placeholder
display data — wire them to the real solver output.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are all specified
below and should be reproduced closely. Recreate using the codebase's existing primitives.

---

## Layout

Single screen, light theme, centered content.

- **Page**: `background:#ffffff`, font family Libre Franklin (see Design Tokens), text `#1a1a1b`.
- **Header**: full-width bar, `max-width:1160px` centered, `padding:18px 40px`,
  `border-bottom:1px solid #e6e7e9`. Flex row, `space-between`, vertically centered.
- **Main**: `max-width:1160px` centered, `padding:38px 40px 64px`. CSS grid,
  `grid-template-columns: 314px 1fr; gap:52px; align-items:start`.
  - **Left column is fixed at 314px** — this exactly matches the width of the 5-tile board
    row (`5 × 58px + 4 × 6px gap = 314px`), so the "Your guesses" header, the board, and the
    "Add a move" controls all share the same width. Do not let them exceed the grid width.
  - **Right column** (`1fr`) is a vertical flex stack, `gap:28px`.

---

## Screens / Views

### Header
- **Logo mark** (left): a 2×2 grid of 12px rounded squares (`gap:2px`, `border-radius:2px`)
  in the four tile states — green `#6aaa64`, yellow `#c9b458`, gray `#787c7e`, and empty
  (white fill, `2px solid #d3d6da` border).
- **Title**: "Wordle Solver", `21px / 800`, `letter-spacing:-0.4px`.
- **Badge**: "Shannon entropy" pill, `12px / 600`, color `#8a8d91`, `background:#f2f2f4`,
  `padding:3px 9px`, `border-radius:20px`.
- **GitHub link** (right): anchor to `https://github.com/P4ST4S`, `target="_blank"`.
  GitHub octocat SVG (19px, `currentColor`) + text "P4ST4S" (`14px / 600`). Container:
  `padding:8px 14px`, `border:1px solid #e0e1e4`, `border-radius:10px`, `gap:9px`.
  Hover: `background:#f7f7f8; border-color:#d3d6da`.

### Left column — the board

**"Your guesses" header row** (flex, space-between):
- Label "YOUR GUESSES": `13px / 700`, uppercase, `letter-spacing:1.4px`, color `#8a8d91`.
- **Reset game** button (right): `13px / 600`, color `#5a5d61`, transparent background,
  `border:1px solid #e0e1e4`, `border-radius:8px`, `padding:6px 12px`. Hover:
  `background:#f7f7f8; color:#1a1a1b; border-color:#d3d6da`. Clears the board to 6 empty rows.

**Board**: always **6 rows × 5 tiles** (fixed Wordle grid). Column is a flex stack with
`gap:6px`; each row is a flex row with `gap:6px`.
- **Tile**: `58×58px`, flex-centered, `font-size:30px / 700`, uppercase, `border:2px solid`,
  `box-sizing:border-box`, `user-select:none`,
  `transition: background .18s, border-color .18s, color .18s`.
- **Tile states** (background / text / border):
  - Empty (unused row): `#ffffff` / — / `#d3d6da`, `cursor:default`, not clickable.
  - Absent (gray): `#787c7e` / `#fff` / `#787c7e`.
  - Present (yellow): `#c9b458` / `#fff` / `#c9b458`.
  - Correct (green): `#6aaa64` / `#fff` / `#6aaa64`.
- **Filled tiles are clickable** and cycle their state on click (see Interactions).

**"Add a move"** (separated by `margin-top:26px; padding-top:22px; border-top:1px solid #ececed`):
- Label "ADD A MOVE": same style as "YOUR GUESSES".
- **Text input**: full width (`width:100%; box-sizing:border-box`), `font-size:17px / 600`,
  `letter-spacing:4px`, uppercase, `padding:12px 15px`, `border:1.5px solid #d3d6da`,
  `border-radius:10px`. Placeholder "Type 5 letters". Focus: `border-color:#6aaa64`.
  Input is sanitized to letters only, force-uppercased, capped at 5 chars.
- **Color preview** (only shown once exactly 5 letters are entered): a flex row (`gap:6px`)
  of 5 tiles, same 58×58 tile style as the board, **defaulting to gray** (absent), each
  clickable to cycle. Below it a caption (`12.5px`, `#9a9ca0`):
  "Tap each tile to cycle gray → yellow → green." (the words colored
  `#787c7e` / `#c9b458` / `#6aaa64` respectively, `700`).
- **Add move** button: full width (314px), `padding:13px 0`, `font-size:15px / 700`,
  white text, `background:#6aaa64`, `border-radius:10px`. Hover: `background:#5d9a57`.
  Commits the previewed (colored) word as the next board row, clears the input/preview.

### Right column — Optimal Opening Moves

Card: `border:1px solid #ececed`, `border-radius:16px`, `padding:24px 26px`.
- **Heading**: "Optimal Opening Moves", `17px / 800`, `letter-spacing:-0.3px`.
- **Caption** (`13.5px`, `line-height:1.5`, `#8a8d91`): explains the ranking is by expected
  information gain, simulating each candidate against remaining answers to maximize bits resolved.
- **Candidate list**: 10 rows, flex stack `gap:7px`. Each row: flex, `align-items:center`,
  `gap:15px`, `padding:11px 15px`, `border-radius:10px`, `background:#f7f7f8`,
  `position:relative; overflow:hidden`.
  - Rank number: `18px` slot, `13px / 700`, color `#b4b6ba`, centered.
  - Word: `18px / 700`, `letter-spacing:3px`, color `#1a1a1b`.
  - Entropy (right, `margin-left:auto`): value `14px / 700` color `#6aaa64`,
    `font-variant-numeric:tabular-nums`, with a smaller "bits" suffix (`11px / 600`, `#a9c4a6`).
  - Optional entropy bar (see `showEntropyBars` prop): an absolutely-positioned bar behind
    the row, `background:rgba(106,170,100,0.13)`, width ∝ relative entropy.

### Right column — Performance Metrics

Card: same border/radius/padding as above. Heading "Performance Metrics" (`17px / 800`).
3-column grid (`gap:14px`), each stat left-aligned:
- Value `32px / 800`, `letter-spacing:-1px`, `font-variant-numeric:tabular-nums`.
- Label below, `12.5px / 600`, `#8a8d91`.
- Stats (placeholder values): **Avg guesses** `3.54` · **Win rate** `99.6%` (value green `#6aaa64`,
  `%` at `18px`) · **Words remaining** `2,315`.

---

## Interactions & Behavior

- **Tile color cycling (board)**: clicking a filled tile advances its state through a
  4-step cycle: neutral → yellow → green → gray → neutral. (Empty placeholder tiles in
  unused rows are not clickable.)
- **Color preview cycling (add-a-move)**: preview tiles default to **gray** and cycle
  through a 3-step cycle: **gray → yellow → green → gray**.
- **Typing**: the input only accepts A–Z, force-uppercases, and caps at 5 characters. The
  preview row + Add move button appear only when length === 5; they disappear if the user
  deletes below 5. Re-reaching 5 re-initializes the preview to all gray.
- **Add move**: appends the previewed word (with its chosen colors) as the next board row,
  then clears the input and preview. Enter key also triggers Add move. No-op when the board
  already has 6 rows.
- **Reset game**: clears all rows back to 6 empty rows and clears the input/preview.
- Transitions: tile color changes animate over `.18s`; button/border hovers over `.15s`.

## State Management
- `rows`: array of committed guesses, each `{ letters: string[5], states: number[5] }`
  where state codes are `0` neutral, `1` present/yellow, `2` correct/green, `3` absent/gray.
  Rendered as a fixed 6-row board (padded with empty rows).
- `input`: current text in the add-a-move field (sanitized, ≤5, uppercase).
- `pending`: `number[5]` of chosen states for the preview row (init `[3,3,3,3,3]` = all gray).
- Derived: `showPreview = input.length === 5`; preview tiles map `input` + `pending`.
- **Data to fetch from the real solver**: the 10 candidate words + entropy values, and the
  three metric numbers. These are currently hardcoded placeholders.

## Design Tokens

**Colors**
- Text / ink: `#1a1a1b`
- Muted text: `#8a8d91`; lighter muted: `#9a9ca0`; faint: `#b4b6ba`
- Secondary button text: `#5a5d61`
- Borders: `#e6e7e9` (header), `#ececed` (cards/divider), `#e0e1e4` (buttons), `#d3d6da` (empty tile / input)
- Surfaces: `#ffffff` (page/cards), `#f7f7f8` (list rows / hover), `#f2f2f4` (badge), `#ededf0` (faint)
- Tile correct (green): `#6aaa64`; button hover green `#5d9a57`
- Tile present (yellow): `#c9b458`
- Tile absent (gray): `#787c7e`
- Colorblind variant: correct → `#f5793a` (orange), present → `#85c0f9` (blue), absent unchanged

**Typography** — Libre Franklin (Google Fonts), weights 400/500/600/700/800.
Fallback stack: `-apple-system, Helvetica, Arial, sans-serif`.
- Title 21/800 · Card heading 17/800 · Stat value 32/800 · Tile letter 30/700
- Candidate word 18/700 (ls 3px) · Input 17/600 (ls 4px) · Body/caption 13.5–14/400–600
- Section label 13/700 uppercase (ls 1.4px)

**Spacing**: page padding 40px · main grid gap 52px · right stack gap 28px · tile gap 6px ·
card padding 24px 26px.

**Border radius**: tiles 0 (square; logo squares 2px) · buttons/inputs/list rows 8–10px ·
cards 16px · badge 20px.

**Tile geometry**: 58×58px, 2px border, `box-sizing:border-box`. Board width = 314px.

## Tweakable props (optional)
The prototype exposes two booleans you may carry over as options:
- `colorBlindMode` — swaps green→orange `#f5793a`, yellow→blue `#85c0f9`.
- `showEntropyBars` — renders the faint entropy bar behind each candidate row.

## Assets
- **GitHub octocat** logo: inline SVG path (single-color, `currentColor`).
- **Logo mark**: built from 4 CSS squares — no image asset.
- No raster images or icon fonts are used.

## Files
- `Wordle Solver.dc.html` — the full design reference (markup + interaction logic).
