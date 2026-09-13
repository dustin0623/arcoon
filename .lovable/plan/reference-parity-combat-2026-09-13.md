# Reference-parity combat

## Goal
Make the `/game` arena use the combat behavior from `/ref/src` as its source of truth, while keeping the current arena map, wave progression, score, and HUD.

## Changes
- Add the reference bow model and use its Wood-tier defaults: 4 damage, 6-tile range, 650 ms fire rate, and 320 px/s arrow speed.
- Match reference firing exactly: discrete click/Space attacks, cursor world-position aiming, facing updated toward the shot, a 10 px forward spawn offset from the character center, and the directional bow animation.
- Match reference projectile handling: pooled arrows, 48×48 frame 0, centered 10×10 hitbox, correct rotation, straight-line velocity, and removal after `rangeTiles × 16 px` traveled.
- Replace tiny-body overlap hits with the reference 18 px center-distance check, consume one arrow per hit, flash the enemy, and keep the arena’s existing kill/score/wave accounting.
- Align combat feedback with the reference: 400 ms player invulnerability, damage/death animation timing, and safe projectile cleanup. Preserve the arena’s current game-over flow rather than introducing the farm game’s persistent inventory, gold, respawn, or bow-upgrade screens.

## Technical details
- Canonical behavior comes from `ref/src/phaser/scenes/FarmScene.ts`, `ref/src/phaser/systems/ProjectileSystem.ts`, `ref/src/phaser/systems/InputSystem.ts`, and `ref/src/features/game/bow.ts`.
- Remove the arena-only fixed arrow constants and continuous hold-to-fire behavior.
- Keep the current map boundary collision so arrows still stop on arena walls.

## Verification
- Check click and Space shots in multiple directions.
- Confirm a Wood arrow travels exactly 96 world pixels (6 tiles), at 320 px/s, and disappears on range, wall, or first enemy hit.
- Confirm damage, fire interval, facing/animation, scoring, waves, and game-over still work.
