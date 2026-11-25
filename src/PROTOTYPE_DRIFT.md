# Prototype drift — proposals for the root specs

Accepted into the specs on this pass: inventory 14, outfit slots, starter clothes, unequip, spot fields, and the deferred swing grant. Replit builds from the root specs.

## Still open
- **Prototype:** the mine map still has 3 fixed rocks, and the mock still says a spot is `1 to 3`.
- **Spec:** v2.0 replaces that layout. Spots, tiles, and the Rattler are in `SCHEMA.md`. There is no `ROCKS_PER_FLOOR` constant.
- **Literal:** `src/components/game/map/MineMap.tsx` and `src/game/mockService.ts`.
