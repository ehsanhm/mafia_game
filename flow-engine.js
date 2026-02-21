        function ensureFlow() {
          if (!appState.god) appState.god = {};
          if (!appState.god.flow || typeof appState.god.flow !== "object") {
            appState.god.flow = {
              day: 1,
              phase: "day", // day | night
              step: 0,
              bombActive: false,
              guns: {}, // idx -> { type: "real"|"fake", used: boolean, givenAt }
              events: [], // { at, phase, day, kind, data }
              draft: { challengeUsedByDay: {} }, // ui-only scratch (not required but persisted ok)
            };
          }
          if (!Array.isArray(appState.god.flow.events)) appState.god.flow.events = [];
          if (!appState.god.flow.guns || typeof appState.god.flow.guns !== "object") appState.god.flow.guns = {};
          if (typeof appState.god.flow.day !== "number" || appState.god.flow.day < 1) appState.god.flow.day = 1;
          // Mid-day step was removed; migrate older saves.
          if (appState.god.flow.phase === "midday") {
            appState.god.flow.phase = "day";
            appState.god.flow.step = 0;
          }
          if (!["day", "night"].includes(appState.god.flow.phase)) appState.god.flow.phase = "day";
          if (typeof appState.god.flow.step !== "number" || appState.god.flow.step < 0) appState.god.flow.step = 0;
          if (typeof appState.god.flow.bombActive !== "boolean") appState.god.flow.bombActive = false;
          if (!appState.god.flow.draft || typeof appState.god.flow.draft !== "object") appState.god.flow.draft = {};
          return appState.god.flow;
        }

        function getDrawScenarioForFlow() {
          return (appState.draw && appState.draw.uiAtDraw && appState.draw.uiAtDraw.scenario)
            ? appState.draw.uiAtDraw.scenario
            : getScenario();
        }

        function getPlayerNamesForFlow() {
          const draw = appState.draw;
          const n = (draw && draw.players) ? draw.players.length : (appState.ui && appState.ui.nPlayers) ? appState.ui.nPlayers : 0;
          const names = [];
          for (let i = 0; i < n; i++) {
            const nm = (appState.ui.playerNames && appState.ui.playerNames[i]) ? appState.ui.playerNames[i] : t("common.playerN", { n: i + 1 });
            names.push(nm);
          }
          return names;
        }

        // ── Back-navigation helpers ───────────────────────────────────────────

        // Revert all deaths that were applied when transitioning from Night nightDayNum
        // to Day nightDayNum+1 (i.e. undo the effects of that night's resolution).
        function revertNightDeaths(f, nightDayNum) {
          try {
            const dayKey = String(nightDayNum);
            const d = f.draft || {};
            // Mafia shot
            if (d.nightMafiaAppliedByDay && d.nightMafiaAppliedByDay[dayKey]) {
              const rec = d.nightMafiaAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              // Also revert researcher chain kill (if researcher was the mafia target)
              if (Number.isFinite(Number(rec.chainKilled)) && rec.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.chainKilled, 10), { alive: true }); } catch {}
              }
              d.nightMafiaAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Zodiac shot
            if (d.nightZodiacAppliedByDay && d.nightZodiacAppliedByDay[dayKey]) {
              const rec = d.nightZodiacAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightZodiacAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Ocean eliminated itself
            if (d.nightOceanAppliedByDay && d.nightOceanAppliedByDay[dayKey]) {
              const rec = d.nightOceanAppliedByDay[dayKey];
              if (rec.killedOcean === true && Number.isFinite(Number(rec.oceanIdx)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.oceanIdx, 10), { alive: true }); } catch {}
              }
              d.nightOceanAppliedByDay[dayKey] = { oceanIdx: null, targets: [], killedOcean: false, prevAlive: null };
            }
            // Professional shot
            if (d.nightProAppliedByDay && d.nightProAppliedByDay[dayKey]) {
              const rec = d.nightProAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightProAppliedByDay[dayKey] = { killed: null, prevAlive: null, result: null, shooter: null, target: null };
            }
            // Sniper shot
            if (d.nightSniperAppliedByDay && d.nightSniperAppliedByDay[dayKey]) {
              const rec = d.nightSniperAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightSniperAppliedByDay[dayKey] = { killed: null, prevAlive: null, result: null, shooter: null, target: null };
              // Revert sniperShotUsed if this night had a shot
              if (rec.target !== null && rec.target !== undefined) {
                d.sniperShotUsed = false;
              }
            }
            // Once-per-game "used" flags set during the night being reverted.
            // Reporter
            if (d.reporterResultByNight && d.reporterResultByNight[dayKey]) {
              d.reporterResultByNight[dayKey] = null;
              d.reporterUsed = Object.values(d.reporterResultByNight).some((r) => r !== null && r !== undefined);
            }
            // NATO
            if (d.natoUsedNight != null && Number(d.natoUsedNight) === nightDayNum) {
              d.natoUsedNight = null;
            }
            // Minemaker
            if (d.minemakerUsedOnNight != null && Number(d.minemakerUsedOnNight) === nightDayNum) {
              d.minemakerUsed = false;
              d.minemakerUsedOnNight = null;
              d.minemakerMine = null;
            }
            // Lawyer
            if (d.lawyerUsedOnNight != null && Number(d.lawyerUsedOnNight) === nightDayNum) {
              d.lawyerUsed = false;
              d.lawyerUsedOnNight = null;
            }
            // Armorsmith self-armor
            if (d.armorsmithSelfUsedOnNight != null && Number(d.armorsmithSelfUsedOnNight) === nightDayNum) {
              d.armorsmithSelfUsed = false;
              d.armorsmithSelfUsedOnNight = null;
            }
            // Herbalist cycle complete (set during night→day for the night after poisoning)
            if (d.nightHerbalistAppliedByDay && d.nightHerbalistAppliedByDay[dayKey]) {
              const hRec = d.nightHerbalistAppliedByDay[dayKey];
              if (hRec && (hRec.killed !== null || hRec.prevAlive !== null)) {
                d.herbalistCycleComplete = false;
              }
            }
            // Hard John first-survival flag
            if (d.hardJohnSurvivedOnNight != null && Number(d.hardJohnSurvivedOnNight) === nightDayNum) {
              d.hardJohnSurvivedMafiaShotOnce = false;
              d.hardJohnSurvivedOnNight = null;
            }
            // Negotiator conversion
            if (d.nightNegotiatorAppliedByDay && d.nightNegotiatorAppliedByDay[dayKey]) {
              const rec = d.nightNegotiatorAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              d.nightNegotiatorAppliedByDay[dayKey] = { converted: null, prevRoleId: null, succeeded: false };
            }
            // Investigator targets
            if (d.investigatorTargetsByNight) {
              d.investigatorTargetsByNight[dayKey] = null;
            }
            // Sodagari conversion + sacrifice
            if (d.nightSodagariAppliedByDay && d.nightSodagariAppliedByDay[dayKey]) {
              const rec = d.nightSodagariAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              if (Number.isFinite(Number(rec.sacrifice)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.sacrifice, 10), { alive: true }); } catch {}
              }
              d.nightSodagariAppliedByDay[dayKey] = { converted: null, prevRoleId: null, sacrifice: null, prevAlive: null, succeeded: false };
            }
            if (d.sodagariUsedOnNight != null && Number(d.sodagariUsedOnNight) === nightDayNum) {
              d.sodagariUsed = false;
              d.sodagariUsedOnNight = null;
            }
            // Soldier kills (namayande)
            if (d.nightSoldierAppliedByDay && d.nightSoldierAppliedByDay[dayKey]) {
              const rec = d.nightSoldierAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.soldierKilled)) && rec.soldierPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.soldierKilled, 10), { alive: true }); } catch {}
              }
              if (Number.isFinite(Number(rec.gunShotKilled)) && rec.gunShotPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.gunShotKilled, 10), { alive: true }); } catch {}
              }
              d.nightSoldierAppliedByDay[dayKey] = { soldierKilled: null, soldierPrevAlive: null, gunShotKilled: null, gunShotPrevAlive: null };
            }
            // Neutralized shot once-per-game flag
            if (d.neutralizedShotUsedOnNight != null && Number(d.neutralizedShotUsedOnNight) === nightDayNum) {
              d.neutralizedShotUsed = false;
              d.neutralizedShotUsedOnNight = null;
            }
            // Bomb planted that night (stored in bombByDay[nightDayNum+1])
            const nextDayKey = String(nightDayNum + 1);
            if (d.bombByDay && d.bombByDay[nextDayKey]) {
              const bomb = d.bombByDay[nextDayKey];
              if (bomb && Number(bomb.plantedNight) === nightDayNum) {
                delete d.bombByDay[nextDayKey];
              }
            }
            f.bombActive = false;
            f.draft = d;
          } catch {}
        }

        // Returns true if any alive player has an unused real gun.
        function hasUnfiredRealGuns() {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players || !draw.players.length) return false;
            const f = (appState.god && appState.god.flow) ? appState.god.flow : null;
            const guns = (f && f.guns) ? f.guns : null;
            if (!guns || typeof guns !== "object") return false;
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              const g = guns[idx];
              if (g && !g.used && g.type === "real") return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        // Kill all alive players who hold an unused real gun; track in draft.gunExpiryAppliedByDay.
        function applyGunExpiryForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.gunExpiryAppliedByDay || typeof f.draft.gunExpiryAppliedByDay !== "object") f.draft.gunExpiryAppliedByDay = {};
            const guns = f.guns || {};
            const killed = [];
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const g = guns[idx];
              if (!g || g.used || g.type !== "real") continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              try { setPlayerLife(idx, { alive: false, reason: "gun_expiry" }); } catch {}
              killed.push({ idx, prevAlive: true });
            }
            f.draft.gunExpiryAppliedByDay[dayKey] = { killed };
            saveState(appState);
          } catch {}
        }

        // Revert deaths applied by applyGunExpiryForDay for the current day.
        function revertGunExpiryForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            if (!d.gunExpiryAppliedByDay || !d.gunExpiryAppliedByDay[dayKey]) return;
            const rec = d.gunExpiryAppliedByDay[dayKey];
            for (const { idx, prevAlive } of (rec.killed || [])) {
              if (prevAlive) try { setPlayerLife(idx, { alive: true }); } catch {}
            }
            d.gunExpiryAppliedByDay[dayKey] = { killed: [] };
            f.draft = d;
          } catch {}
        }

        // ─────────────────────────────────────────────────────────────────────

        function addFlowEvent(kind, data) {
          const f = ensureFlow();
          const SNAPSHOT_KINDS = new Set(["day_vote", "day_elim", "night_actions", "bomb_toggle", "detective_query", "bomb_resolve"]);
          // For snapshot-like events, keep only the latest per (kind, phase, day).
          if (SNAPSHOT_KINDS.has(kind)) {
            try {
              if (Array.isArray(f.events) && f.events.length) {
                for (let i = f.events.length - 1; i >= 0; i--) {
                  const e = f.events[i];
                  if (!e) continue;
                  if (e.kind === kind && e.phase === f.phase && e.day === f.day) {
                    e.at = Date.now();
                    e.data = data || null;
                    saveState(appState);
                    return;
                  }
                }
              }
            } catch {}
          }
          // For idempotent-ish events, upsert by a stable key to avoid duplicates.
          // - gun_give: one record per recipient per night
          // - gun_shot: one record per shooter per day
          // - day_elim_draw: one record per day
          // - day_elim_out: one record per day (out can change when correcting)
          const canUpsert =
            kind === "gun_give" ||
            kind === "gun_shot" ||
            kind === "day_elim_draw" ||
            kind === "day_elim_out";
          if (canUpsert) {
            try {
              const match = (e) => {
                if (!e || e.kind !== kind || e.phase !== f.phase || e.day !== f.day) return false;
                const a = e.data || null;
                const b = data || null;
                if (kind === "gun_give") return a && b && a.to === b.to;
                if (kind === "gun_shot") return a && b && a.shooter === b.shooter;
                if (kind === "day_elim_draw") return true;
                if (kind === "day_elim_out") return true;
                return false;
              };
              for (let i = (f.events || []).length - 1; i >= 0; i--) {
                const e = f.events[i];
                if (!match(e)) continue;
                e.at = Date.now();
                e.data = data || null;
                saveState(appState);
                return;
              }
            } catch {}
          }
          // Dedupe: avoid saving identical consecutive events (common during re-renders / repeated clicks).
          try {
            const now = Date.now();
            const last = (f.events && f.events.length) ? f.events[f.events.length - 1] : null;
            const a = (last && last.data !== undefined) ? last.data : null;
            const b = (data !== undefined) ? data : null;
            if (
              last &&
              last.kind === kind &&
              last.phase === f.phase &&
              last.day === f.day &&
              (now - (last.at || 0)) < 800 &&
              JSON.stringify(a) === JSON.stringify(b)
            ) {
              return;
            }
          } catch {}
          f.events.push({
            at: Date.now(),
            phase: f.phase,
            day: f.day,
            kind,
            data: data || null,
          });
          // keep event log bounded
          try {
            const MAX_EVENTS = 300;
            if (Array.isArray(f.events) && f.events.length > MAX_EVENTS) {
              f.events.splice(0, f.events.length - MAX_EVENTS);
            }
          } catch {}
          saveState(appState);
        }

        // Apply Mafia shot resolution immediately (with reversible preview).
        // Rule: if MafiaShot is set and DoctorSave is NOT the same target => target is out (shot).
        // If DoctorSave matches MafiaShot, the target stays alive.
        // Role immunities (from scenario/role descriptions): Zodiac, Invulnerable, Armored cannot be killed by mafia night shot.
        // Hard John survives the first mafia shot only.
        function applyNightMafiaFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightMafiaAppliedByDay || typeof f.draft.nightMafiaAppliedByDay !== "object") f.draft.nightMafiaAppliedByDay = {};
            const rec = (f.draft.nightMafiaAppliedByDay[dayKey] && typeof f.draft.nightMafiaAppliedByDay[dayKey] === "object")
              ? f.draft.nightMafiaAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            const ms = (payload.mafiaShot === null || payload.mafiaShot === undefined) ? null : parseInt(payload.mafiaShot, 10);
            const ds = (payload.doctorSave === null || payload.doctorSave === undefined) ? null : parseInt(payload.doctorSave, 10);
            const ls = (payload.lecterSave === null || payload.lecterSave === undefined) ? null : parseInt(payload.lecterSave, 10);

            // NATO rule: if NATO made a role guess this night, mafia cannot shoot.
            // If the guess was correct, NATO's target dies instead.
            const natoTgt = (payload.natoTarget === null || payload.natoTarget === undefined) ? null : parseInt(payload.natoTarget, 10);
            const natoGuess = (payload.natoRoleGuess != null && String(payload.natoRoleGuess).trim()) ? String(payload.natoRoleGuess).trim() : null;
            const natoMadeGuess = Number.isFinite(natoTgt) && natoTgt >= 0 && natoTgt < draw.players.length && natoGuess !== null;

            let desiredKill = (Number.isFinite(ms) && ms >= 0 && ms < draw.players.length && ms !== ds && ms !== ls) ? ms : null;
            // NATO blocks the mafia shot entirely when a guess was made.
            if (natoMadeGuess) desiredKill = null;

            // If NATO's guess was correct, kill that target (subject to same immunities as mafia shot).
            if (natoMadeGuess && natoTgt !== ds && natoTgt !== ls) {
              const actualRole = (draw.players[natoTgt] && draw.players[natoTgt].roleId) ? draw.players[natoTgt].roleId : "citizen";
              if (natoGuess === actualRole) desiredKill = natoTgt;
            }

            if (desiredKill !== null) {
              const targetRole = (draw.players[desiredKill] && draw.players[desiredKill].roleId) ? draw.players[desiredKill].roleId : "citizen";
              if (targetRole === "zodiac" || targetRole === "invulnerable") {
                desiredKill = null;
              } else if (targetRole === "armored" && !f.draft.armoredVoteUsed) {
                // Armored is immune to night shots until their armor has been spent by a vote-out.
                desiredKill = null;
              } else if (targetRole === "hardJohn") {
                if (!f.draft.hardJohnSurvivedMafiaShotOnce) {
                  f.draft.hardJohnSurvivedMafiaShotOnce = true;
                  f.draft.hardJohnSurvivedOnNight = f.day || 1;
                  desiredKill = null;
                }
              }
            }

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill) return false;

            // revert previous applied kill (only if we killed someone who was alive before)
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }
            // revert previous researcher chain kill
            if (Number.isFinite(Number(rec.chainKilled)) && rec.chainPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.chainKilled, 10), { alive: true }); } catch {}
            }
            rec.chainKilled = null;
            rec.chainPrevAlive = null;

            // apply new kill
            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;

              // Researcher chain kill: if mafia killed the Researcher, also kill their linked player.
              try {
                if ((draw.players[desiredKill] || {}).roleId === "researcher") {
                  const nightActions = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[dayKey]) || null;
                  const linkedIdxRaw = nightActions ? nightActions.researcherLink : null;
                  const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                  if (linkedIdx !== null && draw.players[linkedIdx]) {
                    const linkedRoleId = draw.players[linkedIdx].roleId || "citizen";
                    const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                    const scenario = getDrawScenarioForFlow();
                    const chainApplies = scenario === "bazras"
                      ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                      : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                    if (chainApplies) {
                      const chainWasAlive = draw.players[linkedIdx].alive !== false;
                      if (chainWasAlive) {
                        try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {}
                      }
                      rec.chainKilled = linkedIdx;
                      rec.chainPrevAlive = chainWasAlive;
                    }
                  }
                }
              } catch {}
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            f.draft.nightMafiaAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Zodiac shot resolution immediately (with reversible preview).
        // Rule: if Zodiac shot is set, the target dies (including Mafia).
        // Exception: when Zodiac shoots the Guard, the Zodiac dies instead (Guard survives).
        function applyNightZodiacFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightZodiacAppliedByDay || typeof f.draft.nightZodiacAppliedByDay !== "object") f.draft.nightZodiacAppliedByDay = {};
            const rec = (f.draft.nightZodiacAppliedByDay[dayKey] && typeof f.draft.nightZodiacAppliedByDay[dayKey] === "object")
              ? f.draft.nightZodiacAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            const zs = (payload.zodiacShot === null || payload.zodiacShot === undefined) ? null : parseInt(payload.zodiacShot, 10);
            const targetIdx = (Number.isFinite(zs) && zs >= 0 && zs < draw.players.length) ? zs : null;
            let desiredKill = null;
            if (targetIdx !== null) {
              const targetRole = (draw.players[targetIdx] && draw.players[targetIdx].roleId) ? draw.players[targetIdx].roleId : "citizen";
              if (targetRole === "guard") {
                const zodiacIdx = (() => {
                  for (let i = 0; i < draw.players.length; i++) {
                    if (draw.players[i] && draw.players[i].roleId === "zodiac") return i;
                  }
                  return null;
                })();
                desiredKill = zodiacIdx;
              } else {
                desiredKill = targetIdx;
              }
            }

            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill) return false;

            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            f.draft.nightZodiacAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Ocean wake resolution immediately (with reversible preview).
        // Rule (as requested): if Ocean wakes Mafia or Zodiac => Ocean is out.
        // If Ocean wakes a Citizen => no one dies (and they can chat for ~20s).
        function applyNightOceanFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightOceanAppliedByDay || typeof f.draft.nightOceanAppliedByDay !== "object") f.draft.nightOceanAppliedByDay = {};
            const rec = (f.draft.nightOceanAppliedByDay[dayKey] && typeof f.draft.nightOceanAppliedByDay[dayKey] === "object")
              ? f.draft.nightOceanAppliedByDay[dayKey]
              : { oceanIdx: null, targets: [], killedOcean: false, prevAlive: null };

            const oceanIdx = (() => {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && p.roleId === "ocean") return i;
                }
              } catch {}
              return null;
            })();

            const targets = (() => {
              try {
                const v = payload.oceanWake;
                const arr = Array.isArray(v) ? v : (v === null || v === undefined ? [] : [v]);
                const out = arr
                  .map((x) => parseInt(x, 10))
                  .filter((x) => Number.isFinite(x) && x >= 0 && x < draw.players.length);
                // unique + stable order
                return Array.from(new Set(out)).sort((a, b) => a - b);
              } catch {
                return [];
              }
            })();

            const isBadPick = (() => {
              try {
                for (const target of targets) {
                  const targetRole = (draw.players[target] && draw.players[target].roleId) ? draw.players[target].roleId : "citizen";
                  const teamFa = (roles[targetRole] && roles[targetRole].teamFa) ? roles[targetRole].teamFa : "شهر";
                  if (teamFa === "مافیا" || targetRole === "zodiac") return true;
                }
                return false;
              } catch {
                return false;
              }
            })();
            const desiredKillOcean = !!(oceanIdx !== null && isBadPick);

            // no change
            const sameTargets = (() => {
              try {
                const a = Array.isArray(rec.targets) ? rec.targets.slice().sort((x, y) => x - y) : [];
                if (a.length !== targets.length) return false;
                for (let i = 0; i < a.length; i++) if (a[i] !== targets[i]) return false;
                return true;
              } catch {
                return false;
              }
            })();
            if ((rec.killedOcean === false || rec.killedOcean === null || rec.killedOcean === undefined) && desiredKillOcean === false && sameTargets) return false;
            if (rec.killedOcean === true && desiredKillOcean === true && sameTargets) return false;

            // revert previous applied ocean death (only if ocean was alive before)
            if (rec.killedOcean === true && Number.isFinite(Number(rec.oceanIdx))) {
              const prevOceanIdx = parseInt(rec.oceanIdx, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevOceanIdx, { alive: true }); } catch {}
              }
            }

            // apply new ocean death if needed
            if (desiredKillOcean === true && Number.isFinite(Number(oceanIdx))) {
              const oi = parseInt(oceanIdx, 10);
              const op = draw.players[oi];
              const wasAlive = op ? (op.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(oi, { alive: false, reason: "ocean" }); } catch {}
              }
              rec.oceanIdx = oi;
              rec.targets = targets;
              rec.killedOcean = true;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.oceanIdx = oceanIdx;
              rec.targets = targets;
              rec.killedOcean = false;
              rec.prevAlive = null;
            }

            f.draft.nightOceanAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Professional shot resolution immediately (with reversible preview).
        // Rule: if Professional shoots Mafia => target is out.
        // If shoots Zodiac => no effect.
        // If shoots a non-mafia (citizen/independent) => Professional is out.
        function applyNightProfessionalFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightProAppliedByDay || typeof f.draft.nightProAppliedByDay !== "object") f.draft.nightProAppliedByDay = {};
            const rec = (f.draft.nightProAppliedByDay[dayKey] && typeof f.draft.nightProAppliedByDay[dayKey] === "object")
              ? f.draft.nightProAppliedByDay[dayKey]
              : { killed: null, prevAlive: null, result: null, shooter: null, target: null };

            const proIdx = (function () {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && (p.roleId === "professional" || p.roleId === "leon") && p.alive !== false) return i;
                }
              } catch {}
              return null;
            })();

            const tIdxRaw = (payload.professionalShot === null || payload.professionalShot === undefined) ? null : parseInt(payload.professionalShot, 10);
            const tIdx = (Number.isFinite(tIdxRaw) && tIdxRaw >= 0 && tIdxRaw < draw.players.length) ? tIdxRaw : null;

            const desired = (() => {
              try {
                if (proIdx === null || tIdx === null) return { killIdx: null, result: null, shooter: proIdx, target: tIdx };
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                if (tr === "zodiac") return { killIdx: null, result: "no_effect", shooter: proIdx, target: tIdx };
                if (teamFa === "مافیا") return { killIdx: tIdx, result: "killed_mafia", shooter: proIdx, target: tIdx };
                return { killIdx: proIdx, result: "killed_self", shooter: proIdx, target: tIdx };
              } catch {
                return { killIdx: null, result: null, shooter: proIdx, target: tIdx };
              }
            })();

            const desiredKill = desired.killIdx;
            const desiredResult = desired.result;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null && rec.result === desiredResult && rec.target === desired.target) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill && rec.result === desiredResult && rec.target === desired.target) return false;

            // revert previous applied kill (only if that player was alive before)
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null && Number.isFinite(Number(desiredKill))) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }
            rec.result = desiredResult;
            rec.shooter = desired.shooter;
            rec.target = desired.target;

            f.draft.nightProAppliedByDay[dayKey] = rec;

            // log (upsert via snapshot night_actions already; this is a dedicated event)
            try {
              if (desiredResult === "killed_mafia" || desiredResult === "killed_self") {
                addFlowEvent("pro_shot", { shooter: desired.shooter, target: desired.target, result: desiredResult });
              }
            } catch {}

            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Sniper shot resolution immediately (with reversible preview).
        // Rule: if Sniper shoots Mafia => target dies (city doctor save can protect target but sniper lives).
        //       if Sniper shoots a non-mafia => Sniper dies (regardless of doctor save).
        //       Sniper has one shot total — tracked via d.sniperShotUsed.
        function applyNightSniperFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSniperAppliedByDay || typeof f.draft.nightSniperAppliedByDay !== "object") f.draft.nightSniperAppliedByDay = {};
            const rec = (f.draft.nightSniperAppliedByDay[dayKey] && typeof f.draft.nightSniperAppliedByDay[dayKey] === "object")
              ? f.draft.nightSniperAppliedByDay[dayKey]
              : { killed: null, prevAlive: null, result: null, shooter: null, target: null };

            const sniperIdx = (function () {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && p.roleId === "sniper" && p.alive !== false) return i;
                }
              } catch {}
              return null;
            })();

            const tIdxRaw = (payload.sniperShot === null || payload.sniperShot === undefined) ? null : parseInt(payload.sniperShot, 10);
            const tIdx = (Number.isFinite(tIdxRaw) && tIdxRaw >= 0 && tIdxRaw < draw.players.length) ? tIdxRaw : null;

            const desired = (() => {
              try {
                if (sniperIdx === null || tIdx === null) return { killIdx: null, result: null, shooter: sniperIdx, target: tIdx };
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                if (tr === "zodiac") return { killIdx: null, result: "no_effect", shooter: sniperIdx, target: tIdx };
                // bazras special rule: shooting mafiaBoss kills nobody
                if (tr === "mafiaBoss" && getDrawScenarioForFlow() === "bazras") return { killIdx: null, result: "no_effect_boss", shooter: sniperIdx, target: tIdx };
                if (teamFa === "مافیا") return { killIdx: tIdx, result: "killed_mafia", shooter: sniperIdx, target: tIdx };
                // Shot a citizen/independent → sniper dies
                return { killIdx: sniperIdx, result: "killed_self", shooter: sniperIdx, target: tIdx };
              } catch {
                return { killIdx: null, result: null, shooter: sniperIdx, target: tIdx };
              }
            })();

            const desiredKill = desired.killIdx;
            const desiredResult = desired.result;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null && rec.result === desiredResult && rec.target === desired.target) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill && rec.result === desiredResult && rec.target === desired.target) return false;

            // revert previous applied kill
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null && Number.isFinite(Number(desiredKill))) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }
            rec.result = desiredResult;
            rec.shooter = desired.shooter;
            rec.target = desired.target;

            f.draft.nightSniperAppliedByDay[dayKey] = rec;

            // Mark shot as used (once per game)
            if (tIdx !== null) {
              f.draft.sniperShotUsed = true;
            }

            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Constantine revive immediately (with reversible preview).
        // Rule: Constantine can revive one previously-eliminated player per game.
        // If the moderator changes or clears the selection within the same night, the previous revival is undone.
        function applyNightConstantineFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightConstantineAppliedByDay || typeof f.draft.nightConstantineAppliedByDay !== "object") f.draft.nightConstantineAppliedByDay = {};
            const rec = (f.draft.nightConstantineAppliedByDay[dayKey] && typeof f.draft.nightConstantineAppliedByDay[dayKey] === "object")
              ? f.draft.nightConstantineAppliedByDay[dayKey]
              : { revived: null, prevAlive: null };

            const cr = (payload.constantineRevive === null || payload.constantineRevive === undefined) ? null : parseInt(payload.constantineRevive, 10);
            const desiredRevive = (Number.isFinite(cr) && cr >= 0 && cr < draw.players.length) ? cr : null;

            // no change
            if ((rec.revived === null || rec.revived === undefined) && desiredRevive === null) return false;
            if (Number.isFinite(Number(rec.revived)) && desiredRevive !== null && parseInt(rec.revived, 10) === desiredRevive) return false;

            // revert previous revival (set player dead again if they were dead before)
            if (Number.isFinite(Number(rec.revived))) {
              const prevIdx = parseInt(rec.revived, 10);
              if (rec.prevAlive === false) {
                try { setPlayerLife(prevIdx, { alive: false, reason: "eliminated" }); } catch {}
              }
            }

            // apply new revival
            if (desiredRevive !== null) {
              const p = draw.players[desiredRevive];
              const wasAlive = p ? (p.alive !== false) : false;
              if (!wasAlive) {
                try { setPlayerLife(desiredRevive, { alive: true }); } catch {}
              }
              rec.revived = desiredRevive;
              rec.prevAlive = wasAlive;
            } else {
              rec.revived = null;
              rec.prevAlive = null;
            }

            f.draft.nightConstantineAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Herbalist poison-kill (with reversible preview).
        // Rule: Herbalist poisons on Night X. On Night X+1, if no antidote given → poisoned player dies.
        // Herbalist has one poison + one antidote total per game (tracked via d.herbalistCycleComplete).
        function applyNightHerbalistFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            const prevNightKey = String((f.day || 1) - 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            if (!d.nightHerbalistAppliedByDay || typeof d.nightHerbalistAppliedByDay !== "object") d.nightHerbalistAppliedByDay = {};
            const rec = (d.nightHerbalistAppliedByDay[dayKey] && typeof d.nightHerbalistAppliedByDay[dayKey] === "object")
              ? d.nightHerbalistAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            // Read previous night's poison from saved night actions.
            const prevActions = (d.nightActionsByNight && d.nightActionsByNight[prevNightKey]) ? d.nightActionsByNight[prevNightKey] : null;
            const prevPoisonRaw = prevActions ? prevActions.herbalistPoison : null;
            const prevPoison = (prevPoisonRaw !== null && prevPoisonRaw !== undefined && Number.isFinite(parseInt(prevPoisonRaw, 10)))
              ? parseInt(prevPoisonRaw, 10) : null;

            // No active poison from previous night — nothing to kill.
            if (prevPoison === null) return false;

            // Antidote check: if herbalistAntidote matches the poisoned player, they live.
            const haRaw = payload.herbalistAntidote;
            const antidoteGiven = (haRaw !== null && haRaw !== undefined &&
              Number.isFinite(parseInt(haRaw, 10)) && parseInt(haRaw, 10) === prevPoison);
            const desiredKill = antidoteGiven ? null : prevPoison;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null) {
              // Cycle complete (antidote given) — mark abilities used.
              d.herbalistCycleComplete = true;
              f.draft = d;
              saveState(appState);
              return false;
            }
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill) return false;

            // revert previous kill
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : false;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "poison" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            // Mark cycle complete (both poison and antidote decision used).
            d.herbalistCycleComplete = true;
            d.nightHerbalistAppliedByDay[dayKey] = rec;
            f.draft = d;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Negotiator role-conversion immediately (with reversible preview).
        // Succeeds only when target is a plain citizen (roleId === "citizen")
        // or an armored player who still has armor (!f.draft.armoredVoteUsed).
        // On success the target's roleId becomes "mafia". Reversible via back-nav.
        function applyNightNegotiatorFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightNegotiatorAppliedByDay || typeof f.draft.nightNegotiatorAppliedByDay !== "object") f.draft.nightNegotiatorAppliedByDay = {};
            const rec = (f.draft.nightNegotiatorAppliedByDay[dayKey] && typeof f.draft.nightNegotiatorAppliedByDay[dayKey] === "object")
              ? f.draft.nightNegotiatorAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null, succeeded: false };

            const ntRaw = (payload.negotiatorTarget === null || payload.negotiatorTarget === undefined) ? null : parseInt(payload.negotiatorTarget, 10);
            const desiredTarget = (Number.isFinite(ntRaw) && ntRaw >= 0 && ntRaw < draw.players.length) ? ntRaw : null;

            // no change
            if ((rec.converted === null || rec.converted === undefined) && desiredTarget === null) return false;
            if (Number.isFinite(Number(rec.converted)) && desiredTarget !== null && parseInt(rec.converted, 10) === desiredTarget) return false;

            // revert previous conversion
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const p = draw.players[prevIdx];
              if (p) p.roleId = rec.prevRoleId;
            }
            rec.converted = null;
            rec.prevRoleId = null;
            rec.succeeded = false;

            // apply new conversion
            if (desiredTarget !== null) {
              const p = draw.players[desiredTarget];
              const targetRole = (p && p.roleId) ? p.roleId : "citizen";
              const isEligible = (targetRole === "citizen") ||
                (targetRole === "armored" && !f.draft.armoredVoteUsed);
              if (isEligible && p) {
                rec.prevRoleId = targetRole;
                p.roleId = "mafia";
                rec.converted = desiredTarget;
                rec.succeeded = true;
              } else {
                // target not eligible — record attempt but don't convert
                rec.converted = desiredTarget;
                rec.prevRoleId = null;
                rec.succeeded = false;
              }
            }

            f.draft.nightNegotiatorAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Store investigator's two nightly targets (bazras scenario).
        // No kills here — just records for status display.
        function applyNightInvestigatorFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.investigatorTargetsByNight || typeof f.draft.investigatorTargetsByNight !== "object") f.draft.investigatorTargetsByNight = {};
            const t1Raw = (payload.investigatorT1 === null || payload.investigatorT1 === undefined) ? null : parseInt(payload.investigatorT1, 10);
            const t2Raw = (payload.investigatorT2 === null || payload.investigatorT2 === undefined) ? null : parseInt(payload.investigatorT2, 10);
            const t1 = (Number.isFinite(t1Raw) && t1Raw >= 0 && t1Raw < draw.players.length) ? t1Raw : null;
            const t2 = (Number.isFinite(t2Raw) && t2Raw >= 0 && t2Raw < draw.players.length) ? t2Raw : null;
            if (t1 === null && t2 === null) {
              f.draft.investigatorTargetsByNight[dayKey] = null;
              return false;
            }
            f.draft.investigatorTargetsByNight[dayKey] = { t1, t2 };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply sodagari (bazras mafiaBoss trade): converts an eligible citizen/invulnerable to mafia
        // and eliminates the mafia-member sacrifice. Reversible via back-nav.
        function applyNightSodagariFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const scenario = getDrawScenarioForFlow();
            if (scenario !== "bazras") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSodagariAppliedByDay || typeof f.draft.nightSodagariAppliedByDay !== "object") f.draft.nightSodagariAppliedByDay = {};
            const rec = (f.draft.nightSodagariAppliedByDay[dayKey] && typeof f.draft.nightSodagariAppliedByDay[dayKey] === "object")
              ? f.draft.nightSodagariAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null, sacrifice: null, prevAlive: null, succeeded: false };

            const sacRaw = (payload.sodagariSacrifice === null || payload.sodagariSacrifice === undefined) ? null : parseInt(payload.sodagariSacrifice, 10);
            const tgtRaw = (payload.sodagariTarget === null || payload.sodagariTarget === undefined) ? null : parseInt(payload.sodagariTarget, 10);
            const desiredSac = (Number.isFinite(sacRaw) && sacRaw >= 0 && sacRaw < draw.players.length) ? sacRaw : null;
            const desiredTgt = (Number.isFinite(tgtRaw) && tgtRaw >= 0 && tgtRaw < draw.players.length) ? tgtRaw : null;

            // no change
            if (rec.sacrifice === desiredSac && rec.converted === desiredTgt) return false;

            // revert previous conversion
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const p = draw.players[prevIdx];
              if (p) p.roleId = rec.prevRoleId;
            }
            // revert previous sacrifice kill
            if (Number.isFinite(Number(rec.sacrifice)) && rec.prevAlive === true) {
              const prevSacIdx = parseInt(rec.sacrifice, 10);
              try { setPlayerLife(prevSacIdx, { alive: true }); } catch {}
            }
            rec.converted = null; rec.prevRoleId = null; rec.sacrifice = null; rec.prevAlive = null; rec.succeeded = false;

            if (desiredSac !== null || desiredTgt !== null) {
              // Apply sacrifice elimination
              if (desiredSac !== null) {
                const sp = draw.players[desiredSac];
                rec.sacrifice = desiredSac;
                rec.prevAlive = (sp && sp.alive !== false) ? true : false;
                if (sp && sp.alive !== false) {
                  try { setPlayerLife(desiredSac, { alive: false }); } catch {}
                }
              }
              // Apply conversion
              if (desiredTgt !== null) {
                const tp = draw.players[desiredTgt];
                const targetRole = (tp && tp.roleId) ? tp.roleId : "citizen";
                const isEligible = (targetRole === "citizen") || (targetRole === "invulnerable");
                if (isEligible && tp) {
                  rec.prevRoleId = targetRole;
                  tp.roleId = "mafia";
                  rec.converted = desiredTgt;
                  rec.succeeded = true;
                } else {
                  rec.converted = desiredTgt;
                  rec.prevRoleId = null;
                  rec.succeeded = false;
                }
              }
              f.draft.sodagariUsed = true;
            }

            f.draft.nightSodagariAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Soldier night bullet: if given to mafia → soldier dies;
        // if given to citizen and citizen fired → apply gun-shot kill rule.
        function applyNightSoldierFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (getDrawScenarioForFlow() !== "namayande") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSoldierAppliedByDay || typeof f.draft.nightSoldierAppliedByDay !== "object") f.draft.nightSoldierAppliedByDay = {};
            const rec = (f.draft.nightSoldierAppliedByDay[dayKey] && typeof f.draft.nightSoldierAppliedByDay[dayKey] === "object")
              ? f.draft.nightSoldierAppliedByDay[dayKey]
              : { soldierKilled: null, soldierPrevAlive: null, gunShotKilled: null, gunShotPrevAlive: null };

            const tgtRaw = (payload.soldierTarget === null || payload.soldierTarget === undefined) ? null : parseInt(payload.soldierTarget, 10);
            const gsRaw = (payload.soldierGunShot === null || payload.soldierGunShot === undefined) ? null : parseInt(payload.soldierGunShot, 10);
            const desiredTgt = (Number.isFinite(tgtRaw) && tgtRaw >= 0 && tgtRaw < draw.players.length) ? tgtRaw : null;
            const desiredGs = (Number.isFinite(gsRaw) && gsRaw >= 0 && gsRaw < draw.players.length) ? gsRaw : null;

            // no change
            if (rec.soldierTgt === desiredTgt && rec.gunShotTgt === desiredGs) return false;

            // revert previous kills
            if (Number.isFinite(Number(rec.soldierKilled)) && rec.soldierPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.soldierKilled, 10), { alive: true }); } catch {}
            }
            if (Number.isFinite(Number(rec.gunShotKilled)) && rec.gunShotPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.gunShotKilled, 10), { alive: true }); } catch {}
            }
            rec.soldierKilled = null; rec.soldierPrevAlive = null;
            rec.gunShotKilled = null; rec.gunShotPrevAlive = null;
            rec.soldierTgt = desiredTgt; rec.gunShotTgt = desiredGs;

            if (desiredTgt !== null) {
              const tp = draw.players[desiredTgt];
              const tgtRoleId = (tp && tp.roleId) ? tp.roleId : "citizen";
              const tgtTeamFa = (roles[tgtRoleId] && roles[tgtRoleId].teamFa) ? roles[tgtRoleId].teamFa : "شهر";
              if (tgtTeamFa === "مافیا") {
                // bullet given to mafia → soldier dies
                const soldierIdx = (() => {
                  for (let i = 0; i < draw.players.length; i++) {
                    if (draw.players[i] && draw.players[i].roleId === "soldier" && draw.players[i].alive !== false) return i;
                  }
                  return null;
                })();
                if (soldierIdx !== null) {
                  const wasAlive = draw.players[soldierIdx].alive !== false;
                  if (wasAlive) { try { setPlayerLife(soldierIdx, { alive: false, reason: "soldier_gave_mafia" }); } catch {} }
                  rec.soldierKilled = soldierIdx;
                  rec.soldierPrevAlive = wasAlive;
                }
              } else if (desiredGs !== null) {
                // bullet given to citizen; citizen shot
                const gsp = draw.players[desiredGs];
                const gsRoleId = (gsp && gsp.roleId) ? gsp.roleId : "citizen";
                const gsTeamFa = (roles[gsRoleId] && roles[gsRoleId].teamFa) ? roles[gsRoleId].teamFa : "شهر";
                if (gsRoleId === "don") {
                  // shot at Don → nobody dies
                } else if (gsTeamFa === "مافیا") {
                  // shot at mafia → mafia dies
                  const wasAlive = gsp ? gsp.alive !== false : false;
                  if (wasAlive) { try { setPlayerLife(desiredGs, { alive: false, reason: "soldier_gun_shot" }); } catch {} }
                  rec.gunShotKilled = desiredGs;
                  rec.gunShotPrevAlive = wasAlive;
                } else {
                  // shot at citizen → recipient (bullet holder = desiredTgt) dies
                  const rp = draw.players[desiredTgt];
                  const wasAlive = rp ? rp.alive !== false : false;
                  if (wasAlive) { try { setPlayerLife(desiredTgt, { alive: false, reason: "soldier_gun_citizen" }); } catch {} }
                  rec.gunShotKilled = desiredTgt;
                  rec.gunShotPrevAlive = wasAlive;
                }
              }
            }

            f.draft.nightSoldierAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply day elimination (vote-out) immediately (with reversible preview).
        function applyDayElimFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.dayElimAppliedByDay || typeof f.draft.dayElimAppliedByDay !== "object") f.draft.dayElimAppliedByDay = {};
            const rec = (f.draft.dayElimAppliedByDay[dayKey] && typeof f.draft.dayElimAppliedByDay[dayKey] === "object")
              ? f.draft.dayElimAppliedByDay[dayKey]
              : { out: null, prevAlive: null };

            const desiredOutRaw = (payload.out === null || payload.out === undefined) ? null : parseInt(payload.out, 10);
            const desiredOut = (Number.isFinite(desiredOutRaw) && desiredOutRaw >= 0 && desiredOutRaw < draw.players.length) ? desiredOutRaw : null;

            // no change
            if ((rec.out === null || rec.out === undefined) && desiredOut === null) return false;
            if (Number.isFinite(Number(rec.out)) && desiredOut !== null && parseInt(rec.out, 10) === desiredOut) return false;

            // revert previous applied out
            if (Number.isFinite(Number(rec.out))) {
              const prevIdx = parseInt(rec.out, 10);
              if (rec.armoredAbsorbed) {
                // Armor absorbed the vote — just clear the used flag on revert
                f.draft.armoredVoteUsed = false;
              } else if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }
            // revert previous researcher chain kill
            if (Number.isFinite(Number(rec.chainOut))) {
              if (rec.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.chainOut, 10), { alive: true }); } catch {}
              }
            }
            rec.chainOut = null;
            rec.chainPrevAlive = null;
            rec.armoredAbsorbed = false;

            // apply new out
            if (desiredOut !== null) {
              const p = draw.players[desiredOut];
              const wasAlive = p ? (p.alive !== false) : null;
              const isArmored = (p && p.roleId === "armored");
              const armorAbsorbs = isArmored && !f.draft.armoredVoteUsed;

              if (armorAbsorbs) {
                // Armored survives the first vote-out; armor is now spent.
                f.draft.armoredVoteUsed = true;
                rec.armoredAbsorbed = true;
                rec.out = desiredOut;
                rec.prevAlive = null;
              } else {
                if (wasAlive) {
                  try { setPlayerLife(desiredOut, { alive: false, reason: "vote" }); } catch {}
                }
                rec.armoredAbsorbed = false;
                rec.out = desiredOut;
                rec.prevAlive = wasAlive === true;

                // researcher chain kill: if voted-out player is Researcher linked to eligible role
                try {
                  if ((draw.players[desiredOut] || {}).roleId === "researcher") {
                    const prevNightKey = String((f.day || 1) - 1);
                    const prevNightActions = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) || null;
                    const linkedIdxRaw = prevNightActions ? prevNightActions.researcherLink : null;
                    const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                    if (linkedIdx !== null && draw.players[linkedIdx]) {
                      const linkedRoleId = draw.players[linkedIdx].roleId || "citizen";
                      const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                      const scenario = getDrawScenarioForFlow();
                      const chainApplies = scenario === "bazras"
                        ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                        : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                      if (chainApplies) {
                        const chainWasAlive = draw.players[linkedIdx].alive !== false;
                        if (chainWasAlive) {
                          try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {}
                        }
                        rec.chainOut = linkedIdx;
                        rec.chainPrevAlive = chainWasAlive;
                      }
                    }
                  }
                } catch {}
              }
            } else {
              rec.out = null;
              rec.prevAlive = null;
            }

            f.draft.dayElimAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        function flowPhaseTitle(f) {
          if (f.phase === "day") return t("tool.flow.phase.day", { n: f.day });
          if (f.phase === "midday") return t("tool.flow.phase.midday", { n: f.day });
          return t("tool.flow.phase.night", { n: f.day });
        }

        function hasUsableDayGuns() {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players || !draw.players.length) return false;
            const f = (appState.god && appState.god.flow) ? appState.god.flow : null;
            const guns = (f && f.guns) ? f.guns : null;
            if (!guns || typeof guns !== "object") return false;
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              const g = guns[idx];
              if (g && !g.used) return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        function getFlowSteps(f) {
          if (f.phase === "day") {
            // Namayande scenario: unique day steps that depend on the day number.
            if (getDrawScenarioForFlow() === "namayande") {
              if ((f.day || 1) === 1) {
                return [{ id: "namayande_rep_election", title: appLang === "fa" ? "انتخاب نماینده" : "Representative Election" }];
              } else {
                return [
                  { id: "namayande_rep_action", title: appLang === "fa" ? "صحبت و انتخاب هدف" : "Rep Speeches & Targets" },
                  { id: "namayande_cover",      title: appLang === "fa" ? "انتخاب کاور"        : "Cover Selection" },
                  { id: "namayande_defense",    title: appLang === "fa" ? "دفاعیه"             : "Final Defense" },
                  { id: "namayande_vote",        title: appLang === "fa" ? "رأی‌گیری"          : "Vote" },
                ];
              }
            }
            // If a day-start snapshot exists, use it so mid-day deaths don't shrink the step list.
            const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[String(f.day)]))
              ? f.draft.dayStepsByDay[String(f.day)]
              : null;
            if (snapshotIds) {
              const stepTitles = {
                "day_bomb": t("tool.flow.bomb.active"),
                "day_guns": t("tool.flow.day.guns"),
                "day_gun_expiry": t("tool.flow.day.gunExpiry"),
                "day_kane_reveal": t("tool.flow.kane.revealTitle"),
                "day_vote": t("tool.flow.day.vote"),
                "day_elim": t("tool.flow.day.eliminate"),
              };
              return snapshotIds.map((id) => ({ id, title: stepTitles[id] || id }));
            }

            // Determine which steps are allowed by the scenario config.
            const scenario = getDrawScenarioForFlow();
            const cfg = getScenarioConfig(scenario);
            const allowed = (cfg.dayPhaseConfig && Array.isArray(cfg.dayPhaseConfig.steps))
              ? cfg.dayPhaseConfig.steps
              : ["day_guns", "day_vote", "day_elim"]; // legacy default for saves without config

            const steps = [];
            // Guns & Bomb step: combined on one page — shown when there are usable guns or an active bomb.
            const hasBombForStep = (() => {
              try {
                const d = f.draft || {};
                const rec = (d.bombByDay && d.bombByDay[String(f.day)]) ? d.bombByDay[String(f.day)] : null;
                return !!(f.bombActive || (rec && rec.target !== null && rec.target !== undefined));
              } catch { return !!f.bombActive; }
            })();
            if ((allowed.includes("day_guns") || allowed.includes("day_bomb")) && (hasUsableDayGuns() || hasBombForStep)) {
              steps.push({ id: "day_guns", title: t("tool.flow.day.guns") });
            }
            // Gun-expiry step: only when at least one alive player has an unused REAL gun.
            if (allowed.includes("day_gun_expiry") && hasUnfiredRealGuns()) {
              steps.push({ id: "day_gun_expiry", title: t("tool.flow.day.gunExpiry") });
            }
            // Kane reveal step: shown if Kane marked a Mafia player the previous night.
            const kaneRevealIdx = (() => {
              try {
                const prevNight = (f.day || 1) - 1;
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNight && e.data);
                const payload = ev && ev.data ? ev.data : null;
                if (!payload) return null;
                const raw = payload.kaneMark;
                const idx = (raw !== null && raw !== undefined && Number.isFinite(parseInt(raw, 10))) ? parseInt(raw, 10) : null;
                if (idx === null) return null;
                const draw = appState.draw;
                if (!draw || !draw.players) return null;
                const p = draw.players[idx];
                if (!p) return null;
                const rid = p.roleId || "citizen";
                const teamFa = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
                return teamFa === "مافیا" ? idx : null;
              } catch { return null; }
            })();
            if (kaneRevealIdx !== null) {
              steps.push({ id: "day_kane_reveal", title: t("tool.flow.kane.revealTitle") });
            }
            steps.push({ id: "day_vote", title: t("tool.flow.day.vote") });
            steps.push({ id: "day_elim", title: t("tool.flow.day.eliminate") });
            return steps;
          }
          return [
            { id: "night_run", title: t("tool.flow.night.run") },
          ];
        }

        function nextFlowStep() {
          const f = ensureFlow();
          const steps = getFlowSteps(f);
          const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
          if (f.step < steps.length - 1) {
            // Apply step-specific effects before advancing.
            if (curStep.id === "day_guns") {
              // Resolve pending gun shots now that we are leaving this step.
              try {
                const dayKey = String(f.day || 1);
                const d2 = f.draft || {};
                const rec = (d2.gunShotAppliedByDay && d2.gunShotAppliedByDay[dayKey]) || null;
                if (rec && Array.isArray(rec.shots) && rec.shots.length) {
                  for (const shot of rec.shots) {
                    if (shot.type === "real" && shot.targetPrevAlive) {
                      try { setPlayerLife(shot.target, { alive: false, reason: "shot" }); } catch {}
                    }
                    // Re-add gun_shot event (upserts by shooter, so no duplicates).
                    try { addFlowEvent("gun_shot", { shooter: shot.shooter, target: shot.target, type: shot.type }); } catch {}
                  }
                  rec.applied = true;
                  d2.gunShotAppliedByDay[dayKey] = rec;
                  f.draft = d2;
                  try { renderCast(); } catch {}
                }
              } catch {}
            }
            if (curStep.id === "day_gun_expiry") {
              applyGunExpiryForDay(f);
              try { renderCast(); } catch {}
            }
            f.step++;
            saveState(appState);
            showFlowTool();
            return;
          }
          // phase transition
          if (f.phase === "day") {
            // End of all day steps → go to night.
            // Clear guns from the just-finished day — they were only valid for that day.
            f.guns = {};
            f.phase = "night";
            f.step = 0;
            // Kane auto-death: if Kane successfully identified a Mafia member the previous night,
            // they are killed by "invisible bullet" (تیر غیب) at the start of this night.
            try {
              const draw = appState.draw;
              if (draw && draw.players) {
                const prevNightDay = (f.day || 1) - 1;
                const kaneEv = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNightDay && e.data);
                const kanePayload = kaneEv && kaneEv.data ? kaneEv.data : null;
                if (kanePayload) {
                  const kaneMarkRaw = kanePayload.kaneMark;
                  const kaneMarkIdx = (kaneMarkRaw !== null && kaneMarkRaw !== undefined && Number.isFinite(parseInt(kaneMarkRaw, 10))) ? parseInt(kaneMarkRaw, 10) : null;
                  if (kaneMarkIdx !== null) {
                    const markedPlayer = draw.players[kaneMarkIdx];
                    if (markedPlayer) {
                      const markedRid = markedPlayer.roleId || "citizen";
                      const markedTeam = (roles[markedRid] && roles[markedRid].teamFa) ? roles[markedRid].teamFa : "شهر";
                      if (markedTeam === "مافیا") {
                        const kaneIdx = draw.players.findIndex((p) => p && p.roleId === "citizenKane");
                        if (kaneIdx !== -1 && draw.players[kaneIdx].alive !== false) {
                          setPlayerLife(kaneIdx, { alive: false, reason: "invisible_bullet" });
                          try { renderCast(); } catch {}
                        }
                      }
                    }
                  }
                }
              }
            } catch {}
          } else {
            // Apply night resolution BEFORE moving to next day.
            // Note: Night actions are considered simultaneous; being shot does NOT prevent acting that same night.
            // Disables (e.g., Magician) can still block actions that night.
            try {
              const draw = appState.draw;
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
              const payload0 = ev && ev.data ? { ...ev.data } : null;
              if (payload0 && draw && draw.players) {
                // Determine who is disabled tonight (Magician).
                const disabledIdx = (payload0.magicianDisable !== null && payload0.magicianDisable !== undefined && Number.isFinite(Number(payload0.magicianDisable)))
                  ? parseInt(payload0.magicianDisable, 10)
                  : null;
                const findIdxByRole = (roleIds) => {
                  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
                  for (let i = 0; i < (draw.players || []).length; i++) {
                    const p = draw.players[i];
                    if (!p) continue;
                    if (ids.includes(p.roleId)) return i;
                  }
                  return null;
                };
                const doctorIdx = findIdxByRole(["doctor", "watson"]);
                const lecterIdx = findIdxByRole(["doctorLecter"]);
                const detIdx = findIdxByRole(["detective"]);
                const proIdx = findIdxByRole(["professional"]);
                const bomberIdx = findIdxByRole(["bomber"]);
                const oceanIdx = findIdxByRole(["ocean"]);
                const zodiacIdx = findIdxByRole(["zodiac"]);
                const sniperIdx2 = findIdxByRole(["sniper"]);
                // If a role is disabled, its action is ignored for resolution.
                if (disabledIdx !== null) {
                  if (doctorIdx !== null && disabledIdx === doctorIdx) payload0.doctorSave = null;
                  if (lecterIdx !== null && disabledIdx === lecterIdx) payload0.lecterSave = null;
                  if (detIdx !== null && disabledIdx === detIdx) payload0.detectiveQuery = null;
                  if (proIdx !== null && disabledIdx === proIdx) payload0.professionalShot = null;
                  if (bomberIdx !== null && disabledIdx === bomberIdx) { payload0.bombTarget = null; payload0.bombCode = null; }
                  if (oceanIdx !== null && disabledIdx === oceanIdx) payload0.oceanWake = null;
                  if (zodiacIdx !== null && disabledIdx === zodiacIdx) payload0.zodiacShot = null;
                  if (sniperIdx2 !== null && disabledIdx === sniperIdx2) payload0.sniperShot = null;
                  // Persist disable so Day N+1 can reference it (e.g., for informational notes).
                  if (!f.draft || typeof f.draft !== "object") f.draft = {};
                  if (!f.draft.disabledByNight || typeof f.draft.disabledByNight !== "object") f.draft.disabledByNight = {};
                  f.draft.disabledByNight[String(f.day)] = disabledIdx;
                }

                // Constantine revives first (restores a previously-dead player before shots resolve).
                try { applyNightConstantineFromPayload(f, payload0); } catch {}
                // Herbalist poison-kill: if no antidote given on the night after a poison, the victim dies.
                try { applyNightHerbalistFromPayload(f, payload0); } catch {}
                // Apply professional/sniper/ocean first so they still act even if mafia shot them.
                try { applyNightProfessionalFromPayload(f, payload0); } catch {}
                try { applyNightSniperFromPayload(f, payload0); } catch {}
                try { applyNightOceanFromPayload(f, payload0); } catch {}
                try { applyNightZodiacFromPayload(f, payload0); } catch {}
                // Negotiator converts a citizen/armored to mafia (role conversion, not a kill).
                try { applyNightNegotiatorFromPayload(f, payload0); } catch {}
                // Investigator records 2 targets (bazras scenario).
                try { applyNightInvestigatorFromPayload(f, payload0); } catch {}
                // Sodagari (bazras): mafiaBoss sacrifice + citizen conversion.
                try { applyNightSodagariFromPayload(f, payload0); } catch {}
                // Soldier (namayande): gives bullet to a player.
                try { applyNightSoldierFromPayload(f, payload0); } catch {}
                // Apply mafia last (uses doctorSave + lecterSave, possibly cleared by disable).
                try { applyNightMafiaFromPayload(f, payload0); } catch {}
                try { renderCast(); } catch {}
                try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
                try { saveState(appState); } catch {}
              }
            } catch {}
            // Bomb is planted at night and becomes active on the NEXT day.
            try {
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
              const payload = ev && ev.data ? ev.data : null;
              const planted = !!(payload && payload.bombTarget !== null && payload.bombTarget !== undefined && Number.isFinite(Number(payload.bombTarget)));
              f.bombActive = planted;
              if (planted) {
                if (!f.draft || typeof f.draft !== "object") f.draft = {};
                if (!f.draft.bombByDay || typeof f.draft.bombByDay !== "object") f.draft.bombByDay = {};
                const nextDay = Math.max(1, (f.day || 1) + 1);
                const target = parseInt(payload.bombTarget, 10);
                const code = (payload.bombCode != null) ? String(payload.bombCode).trim() : "";
                f.draft.bombByDay[String(nextDay)] = {
                  target: Number.isFinite(target) ? target : null,
                  code: code || null,
                  plantedNight: Number(f.day || 1),
                  at: Date.now(),
                };
              }
            } catch {}
            // night -> next day
            f.phase = "day";
            f.day = Math.max(1, (f.day || 1) + 1);
            f.step = 0;
            // Snapshot the step list for this day so mid-day deaths (e.g. bomb kills gun-holder)
            // cannot remove steps that were valid at day start.
            try {
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.dayStepsByDay || typeof f.draft.dayStepsByDay !== "object") f.draft.dayStepsByDay = {};
              f.draft.dayStepsByDay[String(f.day)] = getFlowSteps(f).map((s) => s.id);
            } catch {}
          }
          saveState(appState);
          showFlowTool();
        }

        function prevFlowStep() {
          const f = ensureFlow();
          if (f.step > 0) {
            const steps = getFlowSteps(f);
            const leavingStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
            // Revert deaths applied by certain steps when going backward.
            if (leavingStep.id === "day_elim" || leavingStep.id === "namayande_vote") {
              // Revert the voted-out player so they are alive on the previous step.
              try { applyDayElimFromPayload(f, { out: null }); } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_gun_expiry") {
              // Gun expiry deaths are only applied when clicking Next from this step,
              // so on the way BACK through this step we revert them as well.
              try { revertGunExpiryForDay(f); } catch {}
              try { renderCast(); } catch {}
            }
            f.step--;
            saveState(appState);
            showFlowTool();
            return;
          }
          // go back to previous phase end
          if (f.phase === "night") {
            // Night → last day step (day_elim).
            // Revert day_elim death so it is live-editable when landing back on it.
            try { applyDayElimFromPayload(f, { out: null }); } catch {}
            try { renderCast(); } catch {}
            // Restore f.guns from this day's night gives (night N-1 gave guns for day N).
            try {
              const d = f.draft || {};
              const prevNightKey = String((f.day || 1) - 1);
              const nightGives = Array.isArray(d.nightGunGivesByNight && d.nightGunGivesByNight[prevNightKey])
                ? d.nightGunGivesByNight[prevNightKey] : [];
              const usedShooters = new Set(
                ((d.gunShotAppliedByDay && d.gunShotAppliedByDay[String(f.day)]) || { shots: [] }).shots
                  .filter((s) => s).map((s) => parseInt(s.shooter, 10))
              );
              f.guns = {};
              for (const g of nightGives) {
                const to = parseInt(g.to, 10);
                if (!Number.isFinite(to)) continue;
                f.guns[to] = { type: g.type || "real", used: usedShooters.has(to), givenAt: g.at || 0 };
              }
            } catch {}
            f.phase = "day";
            f.step = Math.max(0, getFlowSteps({ ...f, phase: "day" }).length - 1);
          } else {
            // Day step 0 → previous night's last step.
            if ((f.day || 1) > 1) {
              // Clear the day step snapshot for this day — it will be recomputed on next forward.
              try {
                if (f.draft && f.draft.dayStepsByDay && typeof f.draft.dayStepsByDay === "object") {
                  delete f.draft.dayStepsByDay[String(f.day)];
                }
              } catch {}
              // Revert all deaths that were applied when that night transitioned to this day.
              const prevNight = (f.day || 1) - 1;
              try { revertNightDeaths(f, prevNight); } catch {}
              try { renderCast(); } catch {}
              f.day = Math.max(1, f.day - 1);
              f.phase = "night";
              f.step = Math.max(0, getFlowSteps({ ...f, phase: "night" }).length - 1);
            }
          }
          saveState(appState);
          showFlowTool();
        }

        function resetFlow() {
          if (!appState.god) appState.god = {};
          appState.god.flow = null;
          saveState(appState);
          showFlowTool();
        }

        function applyBombResultFromForm() {
          try {
            const f = ensureFlow();
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const d = f.draft || {};
            if (!d.bombByDay || typeof d.bombByDay !== "object") d.bombByDay = {};
            if (!d.bombResolveByDay || typeof d.bombResolveByDay !== "object") d.bombResolveByDay = {};
            const rec = d.bombByDay[String(f.day)] || null;
            const targetIdx = (rec && rec.target !== null && rec.target !== undefined && Number.isFinite(Number(rec.target))) ? parseInt(rec.target, 10) : null;
            const code = (rec && rec.code != null) ? String(rec.code).trim() : "";
            const guardIdx = (() => {
              try {
                // Pending real-gun shots in this day phase (deaths not yet committed).
                const dayKey = String(f.day || 1);
                const pendingRec = (d.gunShotAppliedByDay && d.gunShotAppliedByDay[dayKey]) || null;
                const pendingDeadIdxs = new Set(
                  (pendingRec && Array.isArray(pendingRec.shots))
                    ? pendingRec.shots.filter((s) => s && s.type === "real" && s.targetPrevAlive).map((s) => s.target)
                    : []
                );
                for (let i = 0; i < (draw.players || []).length; i++) {
                  const p = draw.players[i];
                  if (!p) continue;
                  const rid = p.roleId || "citizen";
                  if (roles[rid] && roles[rid].canSacrificeForBomb && p.alive !== false && !pendingDeadIdxs.has(i)) return i;
                }
              } catch {}
              return null;
            })();
            const guardSac = !!(document.getElementById("fl_bomb_guard") && document.getElementById("fl_bomb_guard").checked && guardIdx !== null);
            const guardGuess = String(((document.getElementById("fl_bomb_guard_guess") || {}).value) || "").trim();
            const targetGuess = String(((document.getElementById("fl_bomb_target_guess") || {}).value) || "").trim();
            const guess = guardSac ? guardGuess : targetGuess;
            if (!code || targetIdx === null || guess === "") return false;
            const ok = (guess === code);
            let outcome = null;
            let killed = null;
            if (guardSac) {
              outcome = ok ? "neutralized_guard" : "guard_died";
              killed = ok ? null : guardIdx;
            } else {
              outcome = ok ? "neutralized_target" : "target_died";
              killed = ok ? null : targetIdx;
            }
            try {
              if (!d.bombAppliedByDay || typeof d.bombAppliedByDay !== "object") d.bombAppliedByDay = {};
              const key = String(f.day || 1);
              const prev = (d.bombAppliedByDay[key] && typeof d.bombAppliedByDay[key] === "object")
                ? d.bombAppliedByDay[key]
                : { killed: null, prevAlive: null };
              const desired = (killed !== null && Number.isFinite(Number(killed))) ? parseInt(killed, 10) : null;
              if (prev.killed !== null && Number.isFinite(Number(prev.killed))) {
                const pi = parseInt(prev.killed, 10);
                if (prev.prevAlive === true) {
                  try { setPlayerLife(pi, { alive: true }); } catch {}
                }
              }
              if (desired !== null) {
                const p = draw.players[desired];
                const wasAlive = p ? (p.alive !== false) : null;
                if (wasAlive) {
                  try { setPlayerLife(desired, { alive: false, reason: "bomb" }); } catch {}
                }
                prev.killed = desired;
                prev.prevAlive = wasAlive === true;
              } else {
                prev.killed = null;
                prev.prevAlive = null;
              }
              d.bombAppliedByDay[key] = prev;
            } catch {}
            d.bombResolveByDay[String(f.day)] = { guardSacrifice: guardSac, guardGuess, targetGuess, resolved: true, outcome, ok, killed, at: Date.now() };
            f.draft = d;
            f.bombActive = false;
            addFlowEvent("bomb_resolve", { day: f.day, target: targetIdx, code, guardSacrifice: guardSac, guess, ok, killed, outcome });
            saveState(appState);
            try { renderCast(); } catch {}
            try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
            return true;
          } catch {
            return false;
          }
        }
