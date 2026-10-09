# Wallpaper Editor: Keyboard Controls Spec

`Ctrl` = `Cmd` on Mac. Shortcuts match the character a key produces, so they work on any layout; a few physical bindings (`event.code`) plus a layout probe cover keys where layouts disagree. All units are canvas pixels (e.g. 1080 × 1920). Saving is automatic (localStorage).

## 1. Scope

**Shapes:** place (via picker), select, move, resize (uniform), rotate, opacity, fill color (8), overlap color (8 + none), layer order, duplicate, delete.

**Background pattern:** switch pattern, intensity (= opacity), pattern size, on/off.

**Global (any focus):** undo, redo, export, panel cycle, background mode, clear, surprise, cheat sheet.

**Not included:** zoom, flip, lock/hide, stroke, per-axis resize, multi-select, copy/paste, grouping, keyboard deselect.

## 2. Focus model

Two zones: the **sidebar** (sliders, inputs, pickers) and the **canvas** (shapes). The canvas is one roving-focus widget that handles `Tab` itself and releases it at either end.

- `Tab` into the canvas selects the last-selected shape (or the first one if none).
- `Tab` / `Shift+Tab` select the next / previous shape (stacking order, bottom to top).
- After the last shape `Tab` moves on to the next zone; before the first, `Shift+Tab` moves to the previous zone.
- `Esc` leaves the canvas to the sidebar **without deselecting**. Returning with `Tab` / `Shift+Tab` lands on the selected shape.
- `F6` / `Shift+F6` switch between canvas and sidebar directly.

Shortcuts are **not** tied to canvas focus. Shape actions (move, resize, rotate, opacity, colors, layer order, duplicate, delete, shuffle) fire whenever a shape is selected, from anywhere — sidebar focus included. Panel, background and global actions work even with nothing selected. Form fields still win: single-key shortcuts never fire while typing in an input, and sliders, radio groups and tabs consume their own arrow keys.

The sidebar edits the _selected_ shape, so selection must survive focus moving there. Deselecting is a mouse action (click empty canvas). Selection outlines are hidden in hidden-panel mode and exports.

## 3. Step sizes

| Modifier | Move  | Rotate | Resize | Shape opacity | Pattern intensity (0–100%) | Pattern size (0.5–8, default 1) |
| -------- | ----- | ------ | ------ | ------------- | -------------------------- | ------------------------------- |
| none     | 1 px  | 1°     | 1 px   | 1%            | 1%                         | 0.1                             |
| `Shift`  | 10 px | 15°    | 10 px  | 10%           | 10%                        | 0.5                             |

- Held keys auto-repeat. Exact values get tuned during implementation.
- `Shift` rotation snaps to multiples of 15° (7° → 15° → 30°).
- Pattern size is clamped to 0.5–8. A multiplicative step (×1.1 / ÷1.1) may feel more even than a linear one, since 0.1 is 20% of 0.5 but \~1% of 8.
- For exact values use the sidebar number fields (`↑/↓` there use the same steps).

## 4. Keybinds

### Shapes

Active whenever a shape is selected, regardless of focus.

| Key                    | Action                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `N`                    | Open shape picker (arrows browse, `Enter` places, `Esc` cancels) |
| `Tab` / `Shift+Tab`    | Next / previous shape                                            |
| `Esc`                  | Leave canvas, selection stays                                    |
| `F6` / `Shift+F6`      | Switch between canvas and sidebar                                |
| `Delete` / `Backspace` | Delete shape                                                     |
| `Ctrl+D`               | Duplicate (offset 16 px right and down, copy is selected)        |
| `M`                    | Randomize the selected shape (new blob path or shape kind)       |

New shapes appear at the canvas center, on top, and selected.

### Transform

| Key                               | Action                  |
| --------------------------------- | ----------------------- |
| `←` `→` `↑` `↓` / `w` `a` `s` `d` | Move                    |
| `,` / `.` / `q` `e`               | Rotate left / right     |
| `R` / `F`                         | Resize bigger / smaller |
| `T` / `G`                         | Opacity up / down       |

### Color

| Key             | Action                            |
| --------------- | --------------------------------- |
| `1`–`8`         | Fill color 1–8                    |
| `Shift+1`–`8`   | Overlap color 1–8                 |
| `Shift+0`       | Overlap: none (top shape's color) |
| `C` / `Shift+C` | Cycle fill color next / previous  |

Show each color's number on its swatch in the sidebar.

### Layer order

| Key                   | Action                        |
| --------------------- | ----------------------------- |
| `U` / `J`             | Bring forward / send backward |
| `Shift+U` / `Shift+J` | Bring to front / send to back |

Same pattern as the other value keys: top key = more (up), bottom key = less (down), `Shift` = bigger jump (here: all the way). Overlap color depends on stacking, so announce the new position ("layer 3 of 7").

### Background mode

`B` toggles the mode from anywhere (visible indicator; shape shortcuts are paused while it is on). `B`, or `Esc` while the canvas has focus, exits it.

| Key                        | Action                                           |
| -------------------------- | ------------------------------------------------ |
| `↑` / `↓`                  | Previous / next pattern                          |
| `←` / `→` or `T` / `G`     | Intensity stronger / lighter (`T` up, `G` down)  |
| `R` / `F`                  | Pattern size larger / smaller                    |
| `Shift` + any of the above | Coarse step                                      |
| `Shift+B`                  | Pattern on / off (works in and outside the mode) |

### Global

Work with or without a selection, from any focus.

| Key                                             | Action                                  |
| ----------------------------------------------- | --------------------------------------- |
| `Ctrl+Z` / `Ctrl+Shift+Z` (`Ctrl+Y` on Windows) | Undo / redo                             |
| `Ctrl+S`                                        | Export image / json (opens export menu) |
| `P`                                             | Cycle sidebar full → mini → hidden      |
| `X`                                             | Clear everything (press twice)          |
| `I`                                             | Surprise: randomize everything (twice)  |
| `?` / `F1`                                      | Shortcut cheat sheet                    |

## 5. Sidebar

Standard web behavior:

- Sliders: `←/→` step, `Shift` coarse step, `Home/End` min/max
- Color swatches: radio group (one tab stop, arrows move, `Space` selects)
- Shape picker: grid with arrow navigation
- Number inputs: `↑/↓` use the section 3 steps
- Shortcuts are not limited to the canvas: shape actions (letters, digits, arrows) fire whenever a shape is selected, and panel / background / global shortcuts work even with nothing selected. Single-key shortcuts never fire while typing in an input, and sliders, radio groups and tabs consume their own arrow keys.

## 6. Technical and accessibility notes

- `preventDefault()` only for keys that resolve to an active binding: shape keys while a shape is selected, global keys always, and never inside form fields.
- Visible focus outline on the selected shape, plus an ARIA live region ("Triangle, rotated 45°, fill color 3, opacity 80%").
- Every shortcut needs a sidebar/mouse equivalent.
- Show shortcuts in tooltips; `?` opens the cheat sheet.

## 7. Keyboard layout robustness

Rules for choosing keys:

- **No punctuation keys for shortcuts.** `[ ] \ + = -` need `AltGr` or `Shift` on many layouts (German, Nordic, Spanish, etc.) and `+` needs `Shift` on US, which would collide with `Shift` = coarse step. The only exceptions are `,` `.` (optional aliases for `Q` `E`, present unshifted on nearly all layouts) and `?` (matched by character, with `F1` as a layout-independent fallback).
- **Documented exceptions (user-requested):** `P` cycles the sidebar (full → mini → hidden) and `M` randomizes the selected shape, even though they break the punctuation / avoid-`M` rules above. `X` (clear everything) and `I` (surprise) are two-step: the first press only shows a toast hint, the second press within 2 s performs the action.
- **Prefer letters that are the same on QWERTY, QWERTZ and AZERTY:** `R F T G U J N C B P` (and `D`, `S`). Avoid `Y Z A Q W M` for single keys because these swap places between layouts.
- **Physical binding (`event.code`) for clusters:** `W A S D` and `Q E` are bound by position so they keep their ergonomic shape on AZERTY (where they are labeled `Z Q S D` and `A E`). Show the correct label in the cheat sheet via the layout probe (`navigator.keyboard.getLayoutMap()`, Chromium only; fall back to US labels).
- **Digits by `event.code`** (`Digit1`–`Digit8`), including with `Shift`, so overlap color works regardless of what `Shift+1` prints. On AZERTY the unshifted digit row prints symbols, but the physical keys still work.
- **Match letters case-insensitively** so `Shift+C`, `Shift+U` and the coarse-step `Shift` work with Caps Lock on.
- **Shortcut layout**: `R F` (size), `T G` (opacity) and `U J` (layer order) are vertical pairs: top key = more, bottom key = less.
