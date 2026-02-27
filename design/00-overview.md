# Game Flow — Overview

This folder holds **human-readable game design documents** — one per scenario — so we can design and debug the Flow separately for each variant. The app is complex and scenario-specific logic is spread across `flow-engine.js`, `flow-ui.js`, and `index.html`; these docs are the single source of truth for *intended* behavior.

---

## Global flow (all scenarios)

The Flow tool advances through a linear sequence of **phases**:

1. **Intro Day** (`intro_day`) — Optional; run once (e.g. “everyone opens eyes”).
2. **Intro Night** (`intro_night`) — Optional; run once (e.g. roles wake in order, no kills).
3. **Day 1 → Night 1 → Day 2 → Night 2 → …** — Main loop.
4. **Chaos** (`chaos`) — Optional; some scenarios have a chaos phase.
5. **Winner** (`winner`) — Game over; show winning side.

Many scenarios don’t have only **Day** and **Night**: they also have a **Mid-Day Nap** (خواب نیم‌روز) as one or more **steps inside the Day**. So the order is: **Day** (discussion, then optionally Mid-Day Nap steps, then vote/elim) → **Night**. Whether a scenario has a Mid-Day Nap (and what happens in it) is **scenario-dependent**.

Within each **Day**, the full list of steps (including any Mid-Day Nap steps) is **scenario-dependent** (see `flow-engine.js` for custom step lists and `scenarios.js` → `dayPhaseConfig.steps`). Examples:

- **Classic**: No mid-day. Day = `day_vote` → `day_elim` only.
- **Bazras**: Day includes **Mid-day** step: Interrogation → **Mid-day** (Cancel/Continue) → Forced Vote → `day_vote` → `day_elim`.
- **Kabo**: Day 1 can include **Mid-day Sleep** (چرت روز): Trust Vote → Suspects → **Mid-day Sleep** (Capo sets real bullet) → Defense & Shoot.
- **Zodiac**: No mid-day nap; Day = `day_guns` → `day_gun_expiry` → `day_vote` → `day_elim`.

Within each **Night**, the app currently uses **one page per night** where all role choices (mafia shot, doctor save, etc.) are collected; resolution runs when moving to the next day. The **target design** is to split each night into **one page per role wake-up** (e.g. “Night 1 – Mafia team”, “Night 1 – Magician”, “Night 1 – Doctor”, …), then at the **end** of all Night 1 steps run resolution once and record results for Status Check. See **[00-night-phases-and-status-check.md](00-night-phases-and-status-check.md)** for the full spec, including:

- Night as multiple steps (one per role from the scenario’s wake order).
- Storing per-step selections so they **persist** when God goes back/forward.
- Running resolution only **after the last night step**; Status Check shows those results.
- **Back/forward:** Selections on phase pages stay saved; Status Check and applied game state only include results **up to the current flow position** (going back removes “future” recorded values from Status Check and reverts those effects).

---

## Vote thresholds (defense and elimination)

**Eligible voters** = alive players minus the person being voted on (they cannot vote for themselves). Thresholds are expressed relative to this number.

Many scenarios use **more than half** of eligible voters for both:

- **Defense:** Minimum votes to be *eligible to defend* (enter the defense list).
- **Elimination:** Minimum votes to *be eliminated* (vote-out).

Some scenarios use different rules, for example:

- **Half (not more than half):** Exactly half of eligible voters is enough for defense and/or elimination (e.g. 5 out of 10 eligible).
- **Mixed:** e.g. half for defense (to enter the list) but **more than half** for elimination (to be voted out).

Each scenario design doc should state explicitly:

- **Defense threshold:** “more than half” or “half” (or other rule).
- **Elimination threshold:** “more than half” or “half” (or other rule).

The app currently implements **more than half** for both everywhere (`flow-ui.js`: `Math.floor(eligibleVoters/2) + 1`). Per-scenario threshold config can be added later; the design docs are the source of truth for intended behavior.

---

## How scenarios plug in

- **Config** (`scenarios.js`): `allowedRoles`, `defaultToggles`, `wakeOrder`, `dayPhaseConfig.steps`, `features`, `roleOverrides`, `eliminationCards`.
- **Flow configs** (`flow-configs/*.js`): Per-scenario phase and sub-step definitions. Single source of truth for flow navigation. See `flow-configs/` — one file per scenario (or `standard.js` for shared config).
- **Flow engine** (`flow-engine.js`): Uses `getFlowConfig(scenario)` and `getDrawScenarioForFlow()` to build step lists. Add/remove steps by editing the scenario’s flow-config file.
- **Flow UI** (`flow-ui.js`): Renders different steps and panels per scenario (e.g. bazras interrogation/forced vote, kabo trust/suspects).

When fixing bugs or adding features, check the **design doc for that scenario** first, then align code with the doc.

---

## Scenario design files (index)

| Scenario ID     | Design file        | Notes |
|-----------------|--------------------|--------|
| classic         | [classic.md](classic.md)     | Standard day vote + elim; mafia, doctor, detective. |
| bazras          | [bazras.md](bazras.md)      | **Mid-Day Nap.** Inspector interrogation → Mid-day (Cancel/Continue) → forced vote; sniper/mafiaBoss rule, researcher chain. |
| namayande       | [namayande.md](namayande.md)   | (To be written) |
| mozaker         | [mozaker.md](mozaker.md)     | (To be written) |
| takavar         | [takavar.md](takavar.md)     | (To be written) |
| kabo            | [kabo.md](kabo.md)          | **Mid-Day Nap.** Day 1: Trust vote → Suspects → Mid-day Sleep (Capo real bullet) → Defense & Shoot; heir, herbalist, etc. |
| pedarkhande     | [pedarkhande.md](pedarkhande.md) | Godfather, elimination cards. |
| zodiac          | [zodiac.md](zodiac.md)      | Day guns + gun expiry, then vote/elim. |
| meeting_epic    | [meeting_epic.md](meeting_epic.md) | (To be written) |
| pishrafte       | [pishrafte.md](pishrafte.md)   | (To be written) |
| shab_mafia      | [shab_mafia.md](shab_mafia.md)  | Last-move feature, elimination cards. |

Use [template.md](template.md) to add or fill in a scenario.
