# Effect Registry

**Purpose:** Centralize apply/revert logic for flow steps so fixes don't create new bugs elsewhere.

## Problem

Flow effects (deaths, revivals, conversions, etc.) were implemented ad-hoc across `flow-engine.js`. Each step had its own `applyXxx` / `revertXxx` called from different places. Fixing one bug often broke another scenario or step.

## Solution

**Effect registry** — each step that changes game state registers a single `{ apply, revert }` pair. The flow engine calls `applyEffect(stepId, ctx)` and `revertEffect(stepId, ctx)` instead of direct function calls.

## API

```javascript
registerEffect(stepId, { apply: (ctx) => ..., revert: (ctx) => ... });
applyEffect(stepId, ctx);  // ctx = { f, payload, ... }
revertEffect(stepId, ctx); // ctx = { f }
hasEffect(stepId);
```

## Registered Effects

| Step ID | Apply | Revert |
|---------|-------|--------|
| night_resolution | resolveNightFromPayload | revertNightDeaths |
| day_elim | applyDayElimFromPayload | applyDayElimFromPayload(f, { out: null }) |
| namayande_vote | applyDayElimFromPayload | same |
| kabo_shoot | (in UI) | applyDayElimFromPayload(f, { out: null }) |
| bazras_forced_vote | applyBazrasInterrogationFromPayload | same with outcome: null |
| day_gun_expiry | (in step) | revertGunExpiryForDay |
| day_guns | (in step) | revertGunShotsForDay |
| day_kane_reveal | (in step) | revertKaneRevealForDay |
| day_end_card_action | (in step) | revertEndCardActionForDay |

## Adding a New Effect

1. In `effect-registry.js`, add:
   ```javascript
   window.registerEffect("my_step", {
     apply: (ctx) => myApplyFn(ctx.f, ctx.payload),
     revert: (ctx) => myRevertFn(ctx.f),
   });
   ```
2. In `flow-engine.js`, replace direct `myApplyFn`/`myRevertFn` calls with:
   ```javascript
   if (typeof revertEffect === "function" && hasEffect("my_step")) {
     revertEffect("my_step", { f });
   } else {
     myRevertFn(f);  // fallback if registry not loaded
   }
   ```

## Testing

- **tests/run.html** — Open in browser to run effect registry tests.
- **Regression workflow:** When fixing a bug, add a test in `tests/effect-registry.test.js` (or a new test file) that reproduces it, then fix. The test prevents regressions.

## Night Resolution

**night_resolution** applies all night effects in order at dawn (Constantine → Herbalist → Pro/Sniper/Ocean/Zodiac → Negotiator → Saul → Investigator → Sodagari → Soldier → Mafia → Heir). Revert calls `revertNightDeaths(f, nightDayNum)` when going back from Day N+1 to Night N.
