# Prototype drift — proposals for the root specs

Accepted into the specs on this pass: inventory 14, outfit slots, starter clothes, unequip, spot fields, and the deferred swing grant. Replit builds from the root specs.

## Still open
- **Prototype:** two files still write the rock count as the digit 3.
- **Spec:** `ROCKS_PER_FLOOR`
- **Constant:** `ROCKS_PER_FLOOR`
- **Literal:** `src/components/game/map/MineMap.tsx` (`ROCKS` has 3 fixed positions) and `src/game/mockService.ts` (error text "Choose a rock spot from 1 to 3.")
