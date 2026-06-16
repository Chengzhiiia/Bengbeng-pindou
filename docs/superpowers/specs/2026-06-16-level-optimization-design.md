# Level Optimization Design

## Goal

Make level 1 stay simple as a gameplay tutorial, then increase difficulty from level 2 onward by using more gems and warmer household-themed patterns.

## Scope

- Keep the game at six levels.
- Keep level 1 as the easiest introduction level.
- Replace levels 2-6 with "family small objects" themed pixel patterns.
- Increase gem counts gradually after level 1:
  - Level 2: about 26 gems
  - Level 3: about 30 gems
  - Level 4: about 34 gems
  - Level 5: about 38 gems
  - Level 6: about 42 gems
- Keep every level color-balanced: each target color count must match the starting gem count for that color.

## Pattern Direction

The chosen visual direction is a family small objects series. Patterns should feel warm and recognizable while still fitting the existing coordinate-grid level format.

Suggested topics:

- Level 2: small house or window
- Level 3: teacup or mug
- Level 4: table lamp
- Level 5: gift or framed photo
- Level 6: combined household scene

## Data Model

Use the existing `src/levels.ts` data structure:

- `targetColor` defines the final pixel-art pattern.
- `gemColor` defines the starting misplaced gem.
- Empty `gemColor` remains allowed only if the level design intentionally starts with blanks, but each color must remain balanced.

No new runtime model is required.

## Testing

Add focused level tests before changing production data:

- Level 1 has fewer gems than level 2.
- Levels 2-6 have increasing gem counts.
- Levels 2-6 use at least four colors, with later levels using all five colors where practical.
- Every level passes `validateLevel`.

After the data change, run the full test suite and build.
