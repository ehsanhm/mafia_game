        function ensureFlow() {
          if (!appState.god) appState.god = {};
          if (!appState.god.flow || typeof appState.god.flow !== "object") {
            appState.god.flow = {
              day: 1,
              phase: "intro_day", // intro_day | intro_night | day | night
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
          if (!["intro_day", "intro_night", "day", "night", "chaos", "winner"].includes(appState.god.flow.phase)) appState.god.flow.phase = "day";
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
              // Leon (pedarkhande): revert bullet consumption when reverting a night that had a Pro/Leon shot.
              if (getDrawScenarioForFlow() === "pedarkhande" && rec.target !== null) {
                d.leonShotsUsed = Math.max(0, (d.leonShotsUsed || 0) - 1);
              }
              if (rec.result === "vest_absorbed") d.godfatherVestUsed = false;
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
            // Herbalist poison-kill (revive the killed player and reset the record)
            if (d.nightHerbalistAppliedByDay && d.nightHerbalistAppliedByDay[dayKey]) {
              const hRec = d.nightHerbalistAppliedByDay[dayKey];
              if (hRec) {
                if (Number.isFinite(Number(hRec.killed)) && hRec.prevAlive === true) {
                  try { setPlayerLife(parseInt(hRec.killed, 10), { alive: true }); } catch {}
                }
                d.herbalistCycleComplete = false;
                d.nightHerbalistAppliedByDay[dayKey] = { killed: null, prevAlive: null };
              }
            }
            // Hard John first-survival flag
            if (d.hardJohnSurvivedOnNight != null && Number(d.hardJohnSurvivedOnNight) === nightDayNum) {
              d.hardJohnSurvivedMafiaShotOnce = false;
              d.hardJohnSurvivedOnNight = null;
            }
            // Leon vest (pedarkhande)
            if (d.leonVestUsedOnNight != null && Number(d.leonVestUsedOnNight) === nightDayNum) {
              d.leonVestUsed = false;
              d.leonVestUsedOnNight = null;
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
            // Saul buy (pedarkhande) conversion revert
            if (d.nightSaulBuyAppliedByDay && d.nightSaulBuyAppliedByDay[dayKey]) {
              const rec = d.nightSaulBuyAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              d.nightSaulBuyAppliedByDay[dayKey] = { converted: null, prevRoleId: null };
            }
            if (d.saulBuyUsedOnNight != null && Number(d.saulBuyUsedOnNight) === nightDayNum) {
              d.saulBuyUsed = false;
              d.saulBuyUsedOnNight = null;
            }
            if (d.kaneInvisibleBulletByNight != null && Number(d.kaneInvisibleBulletByNight) === nightDayNum) {
              const kaneIdx = appState.draw && appState.draw.players ? appState.draw.players.findIndex((p) => p && p.roleId === "citizenKane") : -1;
              if (kaneIdx !== -1) try { setPlayerLife(kaneIdx, { alive: true }); } catch {}
              d.kaneInvisibleBulletByNight = null;
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
            // Sixth Sense (pedarkhande)
            if (d.nightSixthSenseAppliedByDay && d.nightSixthSenseAppliedByDay[dayKey]) {
              const rec = d.nightSixthSenseAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightSixthSenseAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Constantine revive
            if (d.nightConstantineAppliedByDay && d.nightConstantineAppliedByDay[dayKey]) {
              const rec = d.nightConstantineAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.revived)) && rec.prevAlive === false) {
                try { setPlayerLife(parseInt(rec.revived, 10), { alive: false, reason: "eliminated" }); } catch {}
              }
              d.nightConstantineAppliedByDay[dayKey] = { revived: null, prevAlive: null };
            }
            // Heir inheritance (role change)
            if (d.heirInheritedByDay && d.heirInheritedByDay[dayKey]) {
              const rec = d.heirInheritedByDay[dayKey];
              if (Number.isFinite(Number(rec.heirIdx)) && rec.prevRole !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.heirIdx, 10)];
                if (p) p.roleId = rec.prevRole;
              }
              d.heirInheritedByDay[dayKey] = { heirIdx: null, prevRole: null, newRole: null, pickedIdx: null };
            }
            // Neutralized shot once-per-game flag
            if (d.neutralizedShotUsedOnNight != null && Number(d.neutralizedShotUsedOnNight) === nightDayNum) {
              d.neutralizedShotUsed = false;
              d.neutralizedShotUsedOnNight = null;
            }
            // Joker used (array of night numbers)
            if (d.jokerUsed && Array.isArray(d.jokerUsed)) {
              d.jokerUsed = d.jokerUsed.filter((n) => Number(n) !== nightDayNum);
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

        // Revert deaths applied when leaving day_guns step (gun shots).
        function revertGunShotsForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            const rec = (d.gunShotAppliedByDay && d.gunShotAppliedByDay[dayKey]) || null;
            if (!rec || !rec.applied || !Array.isArray(rec.shots)) return;
            for (const shot of rec.shots) {
              if (shot.type === "real" && shot.targetPrevAlive) {
                try { setPlayerLife(shot.target, { alive: true }); } catch {}
              }
              if (Number.isFinite(Number(shot.chainKilled)) && shot.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(shot.chainKilled, 10), { alive: true }); } catch {}
              }
              const shooter = parseInt(shot.shooter, 10);
              if (Number.isFinite(shooter) && f.guns && f.guns[shooter]) {
                f.guns[shooter].used = false;
              }
            }
            rec.applied = false;
            f.draft = d;
            if (Array.isArray(f.events)) {
              f.events = f.events.filter((e) => !(e && e.kind === "gun_shot" && e.phase === f.phase && Number(e.day) === Number(f.day)));
            }
          } catch {}
        }

        // Pedarkhande: when advancing from day_kane_reveal, host reveals the marked mafia's role.
        // The revealed player remains in the game (not eliminated). Kane dies at night by invisible bullet.
        function applyKaneRevealForDay(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return;
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const prevNightDay = (f.day || 1) - 1;
            const kaneEv = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNightDay && e.data);
            const kanePayload = kaneEv && kaneEv.data ? kaneEv.data : null;
            if (!kanePayload) return;
            const kaneMarkRaw = kanePayload.kaneMark;
            const kaneMarkIdx = (kaneMarkRaw !== null && kaneMarkRaw !== undefined && Number.isFinite(parseInt(kaneMarkRaw, 10))) ? parseInt(kaneMarkRaw, 10) : null;
            if (kaneMarkIdx === null) return;
            const markedPlayer = draw.players[kaneMarkIdx];
            if (!markedPlayer || markedPlayer.alive === false) return;
            const markedRid = markedPlayer.roleId || "citizen";
            const markedTeam = (roles[markedRid] && roles[markedRid].teamFa) ? roles[markedRid].teamFa : "شهر";
            if (markedTeam !== "مافیا") return;
            // Reveal only — marked player stays in game. Record for Status Check display.
            const d = f.draft || {};
            if (!d.kaneRevealAppliedByDay || typeof d.kaneRevealAppliedByDay !== "object") d.kaneRevealAppliedByDay = {};
            d.kaneRevealAppliedByDay[String(f.day)] = { idx: kaneMarkIdx, revealed: true };
            f.draft = d;
          } catch {}
        }

        function revertKaneRevealForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            if (!d.kaneRevealAppliedByDay || !d.kaneRevealAppliedByDay[dayKey]) return;
            d.kaneRevealAppliedByDay[dayKey] = { idx: null, revealed: null };
            f.draft = d;
          } catch {}
        }

        // Apply end card action effects when advancing from day_end_card_* step.
        // Reversible via revertEndCardActionForDay.
        function applyEndCardActionForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const d = f.draft || {};
            const dayKey = String(f.day || 1);
            const byDay = appState.god && appState.god.endCards && appState.god.endCards.byDay ? appState.god.endCards.byDay : {};
            const rec = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
            if (!rec || !rec.cardId) return;
            const outIdx = (rec.out !== null && rec.out !== undefined && Number.isFinite(parseInt(rec.out, 10))) ? parseInt(rec.out, 10) : null;
            if (outIdx === null) return;
            const action = (d.endCardActionByDay && d.endCardActionByDay[dayKey]) || {};
            const cardId = String(rec.cardId || "");
            if (!d.endCardActionAppliedByDay || typeof d.endCardActionAppliedByDay !== "object") d.endCardActionAppliedByDay = {};
            const appliedRec = { cardId, out: outIdx, target: null, targets: [], prevState: null };
            if (cardId === "face_change" || cardId === "handcuffs" || cardId === "beautiful_mind") {
              const t = (action.target !== null && action.target !== undefined && Number.isFinite(parseInt(action.target, 10))) ? parseInt(action.target, 10) : null;
              if (t === null) return;
              appliedRec.target = t;
              const pOut = draw.players[outIdx];
              const pTgt = draw.players[t];
              if (!pOut || !pTgt) return;
              if (cardId === "face_change") {
                const prevOutRole = pOut.roleId || "citizen";
                const prevTgtRole = pTgt.roleId || "citizen";
                pOut.roleId = prevTgtRole;
                pTgt.roleId = prevOutRole;
                appliedRec.prevState = { outRole: prevOutRole, tgtRole: prevTgtRole };
              } else if (cardId === "handcuffs") {
                if (!d.handcuffedByDay || typeof d.handcuffedByDay !== "object") d.handcuffedByDay = {};
                d.handcuffedByDay[dayKey] = t;
              } else if (cardId === "beautiful_mind") {
                const isNostradamus = (pTgt.roleId || "") === "nostradamus";
                if (isNostradamus) {
                  const prevOutAlive = pOut.alive !== false;
                  const prevTgtAlive = pTgt.alive !== false;
                  const prevOutRole = pOut.roleId || "citizen";
                  const prevTgtRole = pTgt.roleId || "citizen";
                  // Kill Nostradamus; guesser comes back with their own role (no swap).
                  try { setPlayerLife(t, { alive: false, reason: "beautiful_mind" }); } catch {}
                  try { setPlayerLife(outIdx, { alive: true }); } catch {}
                  // Update day elim record: the "eliminated" for this day is now Nostradamus (t), not voted-out.
                  const dayKey = String(f.day || 1);
                  const prevElim = f.draft.dayElimAppliedByDay && f.draft.dayElimAppliedByDay[dayKey];
                  if (prevElim) {
                    f.draft.dayElimAppliedByDay[dayKey] = {
                      out: t,
                      prevAlive: prevTgtAlive,
                      chainOut: prevElim.chainOut || null,
                      chainPrevAlive: prevElim.chainPrevAlive || null,
                      armoredAbsorbed: prevElim.armoredAbsorbed || false,
                    };
                  }
                  appliedRec.prevState = {
                    outAlive: prevOutAlive,
                    tgtAlive: prevTgtAlive,
                    outRole: prevOutRole,
                    tgtRole: prevTgtRole,
                    dayElimOut: outIdx,
                    dayElimPrevAlive: prevElim ? prevElim.prevAlive : true,
                    dayElimChainOut: prevElim ? prevElim.chainOut : null,
                    dayElimChainPrevAlive: prevElim ? prevElim.chainPrevAlive : null,
                    dayElimArmoredAbsorbed: prevElim ? prevElim.armoredAbsorbed : false,
                  };
                }
              }
            } else if (cardId === "silence_lambs") {
              const tgts = Array.isArray(action.targets) ? action.targets.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x)) : [];
              if (tgts.length === 0) return;
              appliedRec.targets = tgts;
              // Silence affects the NEXT day (cannot defend when voted)
              const affectedDay = String((f.day || 1) + 1);
              appliedRec.silenceAffectedDay = affectedDay;
              if (!d.silencedByDay || typeof d.silencedByDay !== "object") d.silencedByDay = {};
              d.silencedByDay[affectedDay] = tgts;
            }
            d.endCardActionAppliedByDay[dayKey] = appliedRec;
            f.draft = d;
            // Only record event when we applied effects (Beautiful Mind wrong guess has nothing to show)
            const hasEffects = appliedRec.prevState != null || cardId === "handcuffs" || (cardId === "silence_lambs" && appliedRec.targets.length > 0);
            if (hasEffects) {
              addFlowEvent("end_card_action", {
                out: outIdx,
                cardId,
                target: appliedRec.target,
                targets: appliedRec.targets,
              });
            }
          } catch {}
        }

        function revertEndCardActionForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const d = f.draft || {};
            const dayKey = String(f.day || 1);
            const rec = (d.endCardActionAppliedByDay && d.endCardActionAppliedByDay[dayKey]) || null;
            if (!rec) return;
            const cardId = String(rec.cardId || "");
            const outIdx = rec.out;
            const t = rec.target;
            const tgts = rec.targets || [];
            const prev = rec.prevState || {};
            if (cardId === "face_change" && prev.outRole != null && prev.tgtRole != null) {
              const pOut = draw.players[outIdx];
              const pTgt = draw.players[t];
              if (pOut) pOut.roleId = prev.outRole;
              if (pTgt) pTgt.roleId = prev.tgtRole;
            } else if (cardId === "handcuffs") {
              if (d.handcuffedByDay && d.handcuffedByDay[dayKey] != null) delete d.handcuffedByDay[dayKey];
            } else if (cardId === "beautiful_mind" && prev.outAlive != null && prev.tgtAlive != null) {
              if (prev.outAlive) try { setPlayerLife(outIdx, { alive: true }); } catch {}
              else try { setPlayerLife(outIdx, { alive: false }); } catch {}
              if (prev.tgtAlive) try { setPlayerLife(t, { alive: true }); } catch {}
              else try { setPlayerLife(t, { alive: false }); } catch {}
              if (prev.outRole != null && prev.tgtRole != null) {
                const pOut = draw.players[outIdx];
                const pTgt = draw.players[t];
                if (pOut) pOut.roleId = prev.outRole;
                if (pTgt) pTgt.roleId = prev.tgtRole;
              }
              // Restore day elim record.
              if (prev.dayElimOut != null && prev.dayElimPrevAlive != null) {
                const dayKey = String(f.day || 1);
                if (d.dayElimAppliedByDay && d.dayElimAppliedByDay[dayKey]) {
                  d.dayElimAppliedByDay[dayKey] = {
                    out: prev.dayElimOut,
                    prevAlive: prev.dayElimPrevAlive,
                    chainOut: prev.dayElimChainOut ?? null,
                    chainPrevAlive: prev.dayElimChainPrevAlive ?? null,
                    armoredAbsorbed: prev.dayElimArmoredAbsorbed ?? false,
                  };
                }
              }
            } else if (cardId === "silence_lambs") {
              const affectedDay = rec.silenceAffectedDay || String((f.day || 1) + 1);
              if (d.silencedByDay && d.silencedByDay[affectedDay]) delete d.silencedByDay[affectedDay];
            }
            d.endCardActionAppliedByDay[dayKey] = null;
            f.draft = d;
            // Prune end_card_action event for this day
            if (Array.isArray(f.events)) {
              const idx = f.events.findIndex((ev) => ev && ev.kind === "end_card_action" && ev.phase === "day" && ev.day === f.day);
              if (idx >= 0) f.events.splice(idx, 1);
            }
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
                    const steps = getFlowSteps(f);
                    const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
                    e.at = Date.now();
                    e.data = data || null;
                    e.stepIndex = (f.step != null) ? f.step : 0;
                    e.stepId = curStep.id || null;
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
            kind === "day_elim_out" ||
            kind === "end_card_action";
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
                if (kind === "end_card_action") return true;
                return false;
              };
              for (let i = (f.events || []).length - 1; i >= 0; i--) {
                const e = f.events[i];
                if (!match(e)) continue;
                const steps = getFlowSteps(f);
                const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
                e.at = Date.now();
                e.data = data || null;
                e.stepIndex = (f.step != null) ? f.step : 0;
                e.stepId = curStep.id || null;
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
          const steps = getFlowSteps(f);
          const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
          f.events.push({
            at: Date.now(),
            phase: f.phase,
            day: f.day,
            kind,
            data: data || null,
            stepIndex: (f.step != null) ? f.step : 0,
            stepId: curStep.id || null,
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
            // Pedarkhande: no mafia shot when Godfather chose sixth sense or Saul buy (if Saul buy fails, no shot either).
            const scenarioMafia = getDrawScenarioForFlow();
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (scenarioMafia === "pedarkhande" && (godfatherAction === "sixth_sense" || godfatherAction === "saul_buy")) desiredKill = null;
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
              } else if (targetRole === "heir") {
                // Heir is immune to Mafia night shots until they inherit a role
                // (at which point their roleId changes away from "heir").
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
              } else if (targetRole === "leon" && scenarioMafia === "pedarkhande") {
                if (!f.draft.leonVestUsed) {
                  f.draft.leonVestUsed = true;
                  f.draft.leonVestUsedOnNight = f.day || 1;
                  desiredKill = null;
                }
              } else if (targetRole === "nostradamus" && scenarioMafia === "pedarkhande") {
                // Nostradamus has unlimited shields — never dies of night shots.
                desiredKill = null;
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
                  // Prefer payload.researcherLink (always present in night_actions event data),
                  // fall back to nightActionsByNight for older saves.
                  const linkedIdxRaw = (payload.researcherLink !== null && payload.researcherLink !== undefined)
                    ? payload.researcherLink
                    : (() => {
                        const na = f.draft.nightActionsByNight && f.draft.nightActionsByNight[dayKey];
                        return na ? na.researcherLink : null;
                      })();
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

        // Pedarkhande: Sixth Sense — if Godfather guessed correctly, target is eliminated at dawn (end of that night).
        function applyNightSixthSenseFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return false;
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const godfatherAction = (payload.godfatherAction != null) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "sixth_sense") return false;
            const targetRaw = payload.sixthSenseTarget;
            const targetIdx = (targetRaw !== null && targetRaw !== undefined && Number.isFinite(parseInt(targetRaw, 10))) ? parseInt(targetRaw, 10) : null;
            if (targetIdx === null) return false;
            const guessedRole = (payload.sixthSenseRole != null && String(payload.sixthSenseRole).trim()) ? String(payload.sixthSenseRole).trim() : null;
            if (!guessedRole) return false;
            const targetPlayer = draw.players[targetIdx];
            if (!targetPlayer || targetPlayer.alive === false) return false;
            const actualRole = targetPlayer.roleId || "citizen";
            const correct = (guessedRole === actualRole) ||
              (guessedRole === "citizen" && actualRole === "nostradamus") ||
              (guessedRole === "mafia" && actualRole === "citizenKane");
            if (!correct) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSixthSenseAppliedByDay || typeof f.draft.nightSixthSenseAppliedByDay !== "object") f.draft.nightSixthSenseAppliedByDay = {};
            const rec = (f.draft.nightSixthSenseAppliedByDay[dayKey] && typeof f.draft.nightSixthSenseAppliedByDay[dayKey] === "object")
              ? f.draft.nightSixthSenseAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };
            if (rec.killed !== null) return false;
            const prevAlive = targetPlayer.alive !== false;
            setPlayerLife(targetIdx, { alive: false, reason: "sixth_sense" });
            f.draft.nightSixthSenseAppliedByDay[dayKey] = { killed: targetIdx, prevAlive };
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

            let tIdxRaw = (payload.professionalShot === null || payload.professionalShot === undefined) ? null : parseInt(payload.professionalShot, 10);
            let tIdx = (Number.isFinite(tIdxRaw) && tIdxRaw >= 0 && tIdxRaw < draw.players.length) ? tIdxRaw : null;
            // Pedarkhande: Leon has only 2 bullets per game
            const scenarioPro = getDrawScenarioForFlow();
            if (scenarioPro === "pedarkhande" && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
              const d = f.draft || {};
              const used = (d.leonShotsUsed != null && Number.isFinite(Number(d.leonShotsUsed))) ? Number(d.leonShotsUsed) : 0;
              if (used >= 2 && tIdx !== null) tIdx = null;
            }

            const desired = (() => {
              try {
                if (proIdx === null || tIdx === null) return { killIdx: null, result: null, shooter: proIdx, target: tIdx };
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                if (tr === "zodiac") return { killIdx: null, result: "no_effect", shooter: proIdx, target: tIdx };
                // Pedarkhande: Nostradamus — shot from opposite side affects them. Leon (city) vs Nostradamus who chose Mafia = Nostradamus dies.
                if (scenarioPro === "pedarkhande" && tr === "nostradamus") {
                  const nostSide = (f.draft && (f.draft.nostradamusChosenSide === "mafia" || f.draft.nostradamusChosenSide === "citizen")) ? f.draft.nostradamusChosenSide : null;
                  if (nostSide === "mafia") return { killIdx: tIdx, result: "killed_mafia", shooter: proIdx, target: tIdx };
                  if (nostSide === "citizen") return { killIdx: proIdx, result: "killed_self", shooter: proIdx, target: tIdx };
                }
                // Pedarkhande: Godfather has one vest — immune to Leon's first shot.
                if (scenarioPro === "pedarkhande" && (tr === "godfather" || tr === "mafiaBoss") && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
                  const vestUsed = !!(f.draft && f.draft.godfatherVestUsed);
                  if (!vestUsed) return { killIdx: null, result: "vest_absorbed", shooter: proIdx, target: tIdx };
                }
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
            if (desiredResult === "vest_absorbed") {
              if (!f.draft.godfatherVestUsed) f.draft.godfatherVestUsed = true;
            }
            if ((desiredKill !== null || desiredResult === "vest_absorbed") && scenarioPro === "pedarkhande" && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
              if (!f.draft.leonShotsUsed || typeof f.draft.leonShotsUsed !== "number") f.draft.leonShotsUsed = 0;
              f.draft.leonShotsUsed += 1;
            }

            // log (upsert via snapshot night_actions already; this is a dedicated event)
            try {
              if (desiredResult === "killed_mafia" || desiredResult === "killed_self" || desiredResult === "vest_absorbed") {
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
            let desiredRevive = (Number.isFinite(cr) && cr >= 0 && cr < draw.players.length) ? cr : null;
            // Once per game: if Constantine already revived someone in a previous night, block.
            if (desiredRevive !== null) {
              const nc = f.draft.nightConstantineAppliedByDay || {};
              for (const dk of Object.keys(nc)) {
                if (dk === dayKey) continue;
                const r = nc[dk];
                if (r && r.revived != null && Number.isFinite(parseInt(r.revived, 10))) {
                  desiredRevive = null;
                  break;
                }
              }
            }

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

        // Saul buy (pedarkhande): Godfather chose "Saul buy"; once per game, convert one simple citizen to mafia.
        // Only allowed when at least one mafia is dead. Only simple citizen (roleId === "citizen") can be bought;
        // if target is not simple citizen, buy fails and mafia cannot shoot tonight (handled in applyNightMafiaFromPayload).
        function applyNightSaulBuyFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande" || !f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "saul_buy") return false;
            const sbRaw = (payload.saulBuyTarget === null || payload.saulBuyTarget === undefined) ? null : parseInt(payload.saulBuyTarget, 10);
            const desiredTarget = (Number.isFinite(sbRaw) && sbRaw >= 0 && sbRaw < draw.players.length) ? sbRaw : null;
            if (desiredTarget === null) return false;
            const d = f.draft || {};
            const mafiaCount = (draw.players || []).filter((p) => p && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const mafiaAliveCount = (draw.players || []).filter((p) => p && p.alive !== false && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const atLeastOneMafiaDead = mafiaCount > 0 && mafiaAliveCount < mafiaCount;
            if (!atLeastOneMafiaDead) return false;
            const p = draw.players[desiredTarget];
            const targetRole = (p && p.roleId) ? p.roleId : "citizen";
            if (targetRole !== "citizen") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSaulBuyAppliedByDay || typeof f.draft.nightSaulBuyAppliedByDay !== "object") f.draft.nightSaulBuyAppliedByDay = {};
            const rec = (f.draft.nightSaulBuyAppliedByDay[dayKey] && typeof f.draft.nightSaulBuyAppliedByDay[dayKey] === "object")
              ? f.draft.nightSaulBuyAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null };
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const prevP = draw.players[prevIdx];
              if (prevP) prevP.roleId = rec.prevRoleId;
            }
            rec.converted = desiredTarget;
            rec.prevRoleId = "citizen";
            p.roleId = "mafia";
            f.draft.nightSaulBuyAppliedByDay[dayKey] = rec;
            f.draft.saulBuyUsed = true;
            f.draft.saulBuyUsedOnNight = Number(dayKey);
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        /** Returns indices of players that can be shown as Matador disable targets.
         * Excludes the player disabled last night (cannot disable same twice in a row).
         * Returns [] when Matador is dead. Used by flow-ui and tests. */
        function getMatadorDisableTargetIndices(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return [];
            const draw = appState.draw;
            if (!draw || !draw.players) return [];
            const matadorIdx = (draw.players || []).findIndex((p) => p && p.roleId === "matador");
            if (matadorIdx < 0 || !draw.players[matadorIdx] || draw.players[matadorIdx].alive === false) return [];
            const d = (f && f.draft) ? f.draft : {};
            const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
            const prevNight = (d.nightActionsByNight && d.nightActionsByNight[prevNightKey]) ? d.nightActionsByNight[prevNightKey] : null;
            const prevMatadorIdx = (prevNight && prevNight.matadorDisable != null && Number.isFinite(Number(prevNight.matadorDisable))) ? parseInt(prevNight.matadorDisable, 10) : null;
            const excludeSet = prevMatadorIdx !== null ? new Set([prevMatadorIdx]) : new Set();
            return (draw.players || []).map((p, i) => {
              if (!p || p.alive === false) return null;
              return excludeSet.has(i) ? null : i;
            }).filter((x) => x !== null);
          } catch {
            return [];
          }
        }

        /** Returns indices of players that can be shown as Saul Buy targets (all alive non-mafia).
         * Moderator sees all options; only simple citizen succeeds. Used by flow-ui and tests. */
        function getSaulBuyTargetIndices(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return [];
            const draw = appState.draw;
            if (!draw || !draw.players) return [];
            const d = (f && f.draft) ? f.draft : {};
            const saulBuyUsed = !!(d.saulBuyUsed);
            const mafiaCount = (draw.players || []).filter((p) => p && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const mafiaAliveCount = (draw.players || []).filter((p) => p && p.alive !== false && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const atLeastOneMafiaDead = mafiaCount > 0 && mafiaAliveCount < mafiaCount;
            if (saulBuyUsed || !atLeastOneMafiaDead) return [];
            return (draw.players || []).map((p, i) => {
              if (!p || p.alive === false) return null;
              const rid = p.roleId || "citizen";
              const team = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
              return team === "مافیا" ? null : i;
            }).filter((x) => x !== null);
          } catch {
            return [];
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

        // Apply Bazras interrogation forced-vote elimination.
        // payload: { decision: "continue"|"cancel"|null, outcome: idx|"tie"|null }
        // Passing null as payload reverts any current elimination (used when going backward).
        function applyBazrasInterrogationFromPayload(f, payload) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            const dayKey = String(f.day || 1);
            if (!d.bazrasInterrogationByDay || typeof d.bazrasInterrogationByDay !== "object") d.bazrasInterrogationByDay = {};
            const rec = (d.bazrasInterrogationByDay[dayKey] && typeof d.bazrasInterrogationByDay[dayKey] === "object")
              ? d.bazrasInterrogationByDay[dayKey]
              : { decision: null, outcome: null, prevEliminated: null, prevAlive: null };
            const newDecision = payload ? (payload.decision || null) : null;
            const newOutcome = payload ? (payload.outcome !== undefined ? payload.outcome : null) : null;
            // no change
            if (rec.decision === newDecision && rec.outcome === newOutcome) return false;
            // revert previous elimination
            if (Number.isFinite(Number(rec.prevEliminated))) {
              if (rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.prevEliminated, 10), { alive: true }); } catch {}
              }
            }
            rec.prevEliminated = null;
            rec.prevAlive = null;
            rec.decision = newDecision;
            rec.outcome = newOutcome;
            // apply new elimination
            if (newDecision === "continue" && newOutcome !== null && newOutcome !== "tie" && Number.isFinite(Number(newOutcome))) {
              const idx = parseInt(newOutcome, 10);
              const p = draw.players[idx];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(idx, { alive: false, reason: "vote" }); } catch {}
              }
              rec.prevEliminated = idx;
              rec.prevAlive = wasAlive === true;
            }
            d.bazrasInterrogationByDay[dayKey] = rec;
            f.draft = d;
            saveState(appState);
            return true;
          } catch { return false; }
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
          if (f.phase === "intro_day")   return appLang === "fa" ? "روز معارفه" : "Intro Day";
          if (f.phase === "intro_night") return appLang === "fa" ? "شب معارفه"  : "Intro Night";
          if (f.phase === "chaos")  return appLang === "fa" ? "هرج و مرج" : "Chaos";
          if (f.phase === "winner") return appLang === "fa" ? "برنده" : "Winner";
          if (f.phase === "day")   return t("tool.flow.phase.day",   { n: f.day });
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

        // End cards that require a separate action sub-step (pick target(s)).
        // Only cards in the scenario's eliminationCards are valid (e.g. Duel is not in Godfather).
        const END_CARD_ACTION_IDS = ["face_change", "handcuffs", "beautiful_mind", "silence_lambs"];
        function getEndCardActionStepForDay(f) {
          try {
            const scenario = getDrawScenarioForFlow();
            const cfg = getScenarioConfig(scenario);
            if (!cfg.features || !cfg.features.endCards) return null;
            const endCards = cfg.eliminationCards || [];
            const dayKey = String(f.day || 1);
            const byDay = appState.god && appState.god.endCards && appState.god.endCards.byDay ? appState.god.endCards.byDay : {};
            const rec = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
            if (!rec || !rec.cardId) return null;
            // outIdx: prefer day_elim_out event (when committed), else rec.out (card drawn on day_elim before Next)
            const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_elim_out" && e.phase === "day" && e.day === f.day && e.data);
            const outFromEv = ev && ev.data && ev.data.out !== null && ev.data.out !== undefined && Number.isFinite(Number(ev.data.out)) ? parseInt(ev.data.out, 10) : null;
            const outFromRec = rec.out !== null && rec.out !== undefined && Number.isFinite(Number(rec.out)) ? parseInt(rec.out, 10) : null;
            const outIdx = outFromEv !== null ? outFromEv : outFromRec;
            if (outIdx === null) return null;
            if (parseInt(rec.out, 10) !== outIdx) return null;
            if (!END_CARD_ACTION_IDS.includes(rec.cardId)) return null;
            // Beautiful Mind: when Nostradamus draws it, no pick step (host does inquiry; Nostradamus loses shield)
            if (rec.cardId === "beautiful_mind" && scenario === "pedarkhande") {
              const pOut = (appState.draw && appState.draw.players && appState.draw.players[outIdx]) ? appState.draw.players[outIdx] : null;
              if (pOut && (pOut.roleId || "") === "nostradamus") return null;
            }
            const c = endCards.find((x) => x.id === rec.cardId);
            if (!c) return null; // Card not in scenario's eliminationCards (e.g. Duel removed from Godfather)
            const label = appLang === "fa" ? c.fa : c.en;
            return { id: "day_end_card_" + rec.cardId, title: label };
          } catch { return null; }
        }

        // Step title lookup (uses t() where available).
        function getStepTitle(stepId) {
          const titles = {
            intro_day_run: appLang === "fa" ? "روز معارفه" : "Intro Day",
            intro_night_run: appLang === "fa" ? "شب معارفه" : "Intro Night",
            intro_night_nostradamus: appLang === "fa" ? "۱. نوستراداموس" : "1. Nostradamus",
            intro_night_mafia: appLang === "fa" ? "۲. تیم مافیا" : "2. Mafia team",
            intro_night_wake_order: appLang === "fa" ? "۳. واتسون، لئون، کین، کنستانتین" : "3. Watson, Leon, Kane, Constantine",
            chaos_run: appLang === "fa" ? "هرج و مرج" : "Chaos",
            winner_run: appLang === "fa" ? "برنده" : "Winner",
            namayande_rep_election: appLang === "fa" ? "انتخاب نماینده" : "Representative Election",
            namayande_rep_action: appLang === "fa" ? "صحبت و انتخاب هدف" : "Rep Speeches & Targets",
            namayande_cover: appLang === "fa" ? "انتخاب کاور" : "Cover Selection",
            namayande_defense: appLang === "fa" ? "دفاعیه" : "Final Defense",
            namayande_vote: appLang === "fa" ? "رأی‌گیری" : "Vote",
            kabo_trust_vote: appLang === "fa" ? "رأی اعتماد" : "Trust Vote",
            kabo_suspect_select: appLang === "fa" ? "انتخاب مظنون" : "Select Suspects",
            kabo_midday: appLang === "fa" ? "چرت روز" : "Mid-day Sleep",
            kabo_shoot: appLang === "fa" ? "دفاع و شلیک" : "Defense & Shoot",
            bazras_interrogation: appLang === "fa" ? "بازپرسی" : "Interrogation",
            bazras_midday: appLang === "fa" ? "چرت روز" : "Mid-day",
            bazras_forced_vote: appLang === "fa" ? "رأی‌گیری اجباری" : "Forced Vote",
          };
          if (titles[stepId]) return titles[stepId];
          const tKeys = {
            day_bomb: "tool.flow.bomb.active",
            day_guns: "tool.flow.day.guns",
            day_gun_expiry: "tool.flow.day.gunExpiry",
            day_kane_reveal: "tool.flow.kane.revealTitle",
            nostradamus_choose_side: "tool.flow.pedarkhande.nostradamusChooseSide",
            day_vote: "tool.flow.day.vote",
            day_elim: "tool.flow.day.eliminate",
            // Pedarkhande explicit night step titles
            night_mafia_team: "tool.flow.pedarkhande.night.mafiaTeam",
            night_watson: "tool.flow.pedarkhande.night.watson",
            night_leon: "tool.flow.pedarkhande.night.leon",
            night_kane: "tool.flow.pedarkhande.night.kane",
            night_constantine: "tool.flow.pedarkhande.night.constantine",
            // Common night steps (all scenarios)
            night_mafia: "tool.flow.night.mafia",
            night_doctor: "tool.flow.night.doctor",
            night_detective: "tool.flow.night.detective",
            night_researcher: "tool.flow.night.researcher",
            night_swindler: "tool.flow.night.swindler",
            night_sniper: "tool.flow.night.sniper",
            night_inspector: "tool.flow.night.inspector",
            night_negotiator: "tool.flow.night.negotiator",
            night_reporter: "tool.flow.night.reporter",
            night_natasha: "tool.flow.night.natasha",
            night_lecter: "tool.flow.night.lecter",
            night_joker_mafia: "tool.flow.night.joker_mafia",
            night_professional: "tool.flow.night.professional",
            night_magician: "tool.flow.night.magician",
            night_bomber: "tool.flow.night.bomber",
            night_gunslinger: "tool.flow.night.gunslinger",
            night_ocean: "tool.flow.night.ocean",
            night_zodiac: "tool.flow.night.zodiac",
            night_heir: "tool.flow.night.heir",
            night_herbalist: "tool.flow.night.herbalist",
            night_armorsmith: "tool.flow.night.armorsmith",
            night_kadkhoda: "tool.flow.night.kadkhoda",
            night_hacker: "tool.flow.night.hacker",
            night_guide: "tool.flow.night.guide",
            night_bodyguard: "tool.flow.night.bodyguard",
            night_soldier: "tool.flow.night.soldier",
            night_minemaker: "tool.flow.night.minemaker",
            night_lawyer: "tool.flow.night.lawyer",
            night_nostradamus: "tool.flow.night.nostradamus",
            day_end_card_face_change: "tool.flow.endCard.faceOff",
            day_end_card_handcuffs: "tool.flow.endCard.handcuffs",
            day_end_card_beautiful_mind: "tool.flow.endCard.beautifulMind",
            day_end_card_silence_lambs: "tool.flow.endCard.silenceLambs",
          };
          const key = tKeys[stepId];
          return key && typeof t === "function" ? t(key) : stepId;
        }

        /** Returns array of eliminated player indices for Status Check for a given day/phase. */
        function getEliminatedForStatusCheck(f, day, phase) {
          const eliminated = [];
          const seenElim = new Set();
          const addElim = (idx) => {
            if (idx == null) return;
            const i = parseInt(idx, 10);
            if (!Number.isFinite(i) || i < 0 || seenElim.has(i)) return;
            seenElim.add(i);
            eliminated.push(i);
          };
          const dk = String(day || 1);
          if (!f || !f.draft) return eliminated;
          try {
            if (phase === "day" || phase === "midday") {
              const er = f.draft.dayElimAppliedByDay && f.draft.dayElimAppliedByDay[dk];
              if (er && !er.armoredAbsorbed && er.prevAlive === true && er.out != null) addElim(er.out);
              if (er && er.chainPrevAlive === true && er.chainOut != null) addElim(er.chainOut);
              const gr = f.draft.gunShotAppliedByDay && f.draft.gunShotAppliedByDay[dk];
              if (gr && Array.isArray(gr.shots)) {
                for (const s of gr.shots) {
                  if (s && s.type === "real" && s.targetPrevAlive && s.target != null) addElim(s.target);
                  if (s && s.chainPrevAlive && s.chainKilled != null) addElim(s.chainKilled);
                }
              }
              const br = f.draft.bombAppliedByDay && f.draft.bombAppliedByDay[dk];
              if (br && br.prevAlive === true && br.killed != null) addElim(br.killed);
              const xr = f.draft.gunExpiryAppliedByDay && f.draft.gunExpiryAppliedByDay[dk];
              if (xr && Array.isArray(xr.killed)) {
                for (const item of xr.killed) {
                  if (item && item.prevAlive && item.idx != null) addElim(item.idx);
                }
              }
              const irec = f.draft.bazrasInterrogationByDay && f.draft.bazrasInterrogationByDay[dk];
              if (irec && irec.decision === "continue") {
                if (irec.prevAlive === true && irec.prevEliminated != null) addElim(irec.prevEliminated);
                else if (irec.prevEliminated == null && irec.votes) {
                  const prevNK = String(Math.max(0, parseInt(dk, 10) - 1));
                  const invTfv = f.draft.investigatorTargetsByNight && f.draft.investigatorTargetsByNight[prevNK];
                  const ft1 = invTfv && invTfv.t1 != null ? invTfv.t1 : null;
                  const ft2 = invTfv && invTfv.t2 != null ? invTfv.t2 : null;
                  if (ft1 != null && ft2 != null) {
                    const pv1 = Math.max(0, parseInt(irec.votes[ft1] || 0, 10));
                    const pv2 = Math.max(0, parseInt(irec.votes[ft2] || 0, 10));
                    if (pv1 > pv2) addElim(ft1);
                    else if (pv2 > pv1) addElim(ft2);
                  }
                }
              }
              // Kane reveal: role is revealed but player stays in game (not eliminated)
            } else if (phase === "night") {
              const mr = f.draft.nightMafiaAppliedByDay && f.draft.nightMafiaAppliedByDay[dk];
              if (mr && mr.prevAlive === true && mr.killed != null) addElim(mr.killed);
              if (mr && mr.chainPrevAlive === true && mr.chainKilled != null) addElim(mr.chainKilled);
              const zr = f.draft.nightZodiacAppliedByDay && f.draft.nightZodiacAppliedByDay[dk];
              if (zr && zr.prevAlive === true && zr.killed != null) addElim(zr.killed);
              const pr = f.draft.nightProAppliedByDay && f.draft.nightProAppliedByDay[dk];
              if (pr && pr.prevAlive === true && pr.killed != null) addElim(pr.killed);
              const sr = f.draft.nightSniperAppliedByDay && f.draft.nightSniperAppliedByDay[dk];
              if (sr && sr.prevAlive === true && sr.killed != null) addElim(sr.killed);
              const ocr = f.draft.nightOceanAppliedByDay && f.draft.nightOceanAppliedByDay[dk];
              if (ocr && ocr.killedOcean === true && ocr.prevAlive === true && ocr.oceanIdx != null) addElim(ocr.oceanIdx);
              const hr = f.draft.nightHerbalistAppliedByDay && f.draft.nightHerbalistAppliedByDay[dk];
              if (hr && hr.prevAlive === true && hr.killed != null) addElim(hr.killed);
              const sod = f.draft.nightSodagariAppliedByDay && f.draft.nightSodagariAppliedByDay[dk];
              if (sod && sod.prevAlive === true && sod.sacrifice != null) addElim(sod.sacrifice);
              const sixthRec = f.draft.nightSixthSenseAppliedByDay && f.draft.nightSixthSenseAppliedByDay[dk];
              if (sixthRec && sixthRec.prevAlive === true && sixthRec.killed != null) addElim(sixthRec.killed);
              const solRec = f.draft.nightSoldierAppliedByDay && f.draft.nightSoldierAppliedByDay[dk];
              if (solRec && solRec.soldierPrevAlive === true && solRec.soldierKilled != null) addElim(solRec.soldierKilled);
              if (solRec && solRec.gunShotPrevAlive === true && solRec.gunShotKilled != null) addElim(solRec.gunShotKilled);
              // Pedarkhande: Kane invisible bullet (24h after correct mafia reveal)
              if (getDrawScenarioForFlow() === "pedarkhande" && f.draft.kaneInvisibleBulletByNight != null && Number(f.draft.kaneInvisibleBulletByNight) === parseInt(dk, 10)) {
                const kaneIdx = (appState.draw && appState.draw.players) ? appState.draw.players.findIndex((p) => p && p.roleId === "citizenKane") : -1;
                if (kaneIdx !== -1) addElim(kaneIdx);
              }
            }
          } catch {}
          return eliminated;
        }

        /** Returns array of revived player indices for Status Check for a given day/phase. */
        function getRevivedForStatusCheck(f, day, phase) {
          const revived = [];
          const dk = String(day || 1);
          if (!f || !f.draft) return revived;
          try {
            if (phase === "night") {
              const cr = f.draft.nightConstantineAppliedByDay && f.draft.nightConstantineAppliedByDay[dk];
              if (cr && cr.revived != null && Number.isFinite(parseInt(cr.revived, 10))) {
                revived.push(parseInt(cr.revived, 10));
              }
            }
          } catch {}
          return revived;
        }

        /** Returns unified array of role-change entries for Status Check.
         * Each entry: { type: "face_off", out, target, outRole, tgtRole } or { type: "saul_buy", idx, newRole }.
         * Face Off: out got tgtRole, target got outRole. Saul Buy: idx became newRole (mafia). */
        function getChangedRolesForStatusCheck(f, day, phase) {
          const entries = [];
          const dk = String(day || 1);
          if (!f || !f.draft) return entries;
          try {
            if (phase === "day" || phase === "midday") {
              const rec = f.draft.endCardActionAppliedByDay && f.draft.endCardActionAppliedByDay[dk];
              if (rec && rec.cardId === "face_change" && rec.out != null && rec.target != null && rec.prevState) {
                const out = parseInt(rec.out, 10);
                const target = parseInt(rec.target, 10);
                const outRole = rec.prevState.outRole || "citizen";
                const tgtRole = rec.prevState.tgtRole || "citizen";
                if (Number.isFinite(out) && Number.isFinite(target)) {
                  entries.push({ type: "face_off", out, target, outRole, tgtRole });
                }
              }
            }
            if (phase === "night") {
              const sr = f.draft.nightSaulBuyAppliedByDay && f.draft.nightSaulBuyAppliedByDay[dk];
              if (sr && sr.converted != null && Number.isFinite(parseInt(sr.converted, 10))) {
                entries.push({ type: "saul_buy", idx: parseInt(sr.converted, 10), newRole: "mafia" });
              }
            }
          } catch {}
          return entries;
        }

        /** Returns true if Status Check would show playerIdx in the Eliminated list.
         * Replicates the group-creation logic: day groups exist from events OR from
         * sixthSenseAppliedByDay / kaneRevealAppliedByDay (no events yet). */
        function wouldStatusCheckShowEliminated(f, playerIdx) {
          if (!f || !Number.isFinite(parseInt(playerIdx, 10))) return false;
          const idx = parseInt(playerIdx, 10);
          const curFlowDay = f.day || 1;
          const d = f.draft || {};
          try {
            for (const ev of (f.events || [])) {
              if (!ev || !ev.phase || ev.day == null) continue;
              const day = parseInt(ev.day, 10);
              if (!Number.isFinite(day) || day > curFlowDay) continue;
              const phase = String(ev.phase);
              if (!["day", "midday", "night"].includes(phase)) continue;
              const elim = getEliminatedForStatusCheck(f, day, phase);
              if (elim.includes(idx)) return true;
            }
            // Kane reveal: role revealed but player stays in game (not eliminated)
          } catch {}
          return false;
        }

        function getFlowSteps(f) {
          const scenario = String(getDrawScenarioForFlow() || "").toLowerCase();
          const flowCfg = typeof getFlowConfig === "function" ? getFlowConfig(scenario) : null;

          if (f.phase === "intro_day") {
            const ids = (flowCfg && flowCfg.intro_day) ? flowCfg.intro_day : ["intro_day_run"];
            return ids.map((id) => ({ id, title: getStepTitle(id) }));
          }
          if (f.phase === "intro_night") {
            let ids = (flowCfg && flowCfg.intro_night) ? flowCfg.intro_night : ["intro_night_run"];
            // Pedarkhande: nostradamus_choose_side when Nostradamus exists and has picked 3
            if (scenario === "pedarkhande" && ids.includes("nostradamus_choose_side")) {
              const d = (f.draft || {});
              const pick3 = (d.nightActionsByNight && d.nightActionsByNight["0"] && Array.isArray(d.nightActionsByNight["0"].nostPick3)) ? d.nightActionsByNight["0"].nostPick3 : [];
              const has3Picks = pick3.length >= 3;
              const hasNostradamus = (appState.draw && appState.draw.players || []).some((p) => p && p.roleId === "nostradamus");
              if (!hasNostradamus || !has3Picks) {
                ids = ids.filter((id) => id !== "nostradamus_choose_side");
              }
            }
            return ids.map((id) => ({ id, title: getStepTitle(id) }));
          }
          if (f.phase === "chaos")  return [{ id: "chaos_run",  title: getStepTitle("chaos_run") }];
          if (f.phase === "winner") return [{ id: "winner_run", title: getStepTitle("winner_run") }];
          if (f.phase === "day") {
            const dayNum = f.day || 1;
            const dayCfg = flowCfg && flowCfg.day ? flowCfg.day : { base: ["day_vote", "day_elim"] };

            // Namayande: day1 vs default
            if (scenario === "namayande") {
              const ids = (dayNum === 1 && dayCfg.day1) ? dayCfg.day1 : (dayCfg.default || dayCfg.base);
              return ids.map((id) => ({ id, title: getStepTitle(id) }));
            }
            // Kabo: day1 conditional (trust vote → suspect → midday → shoot)
            if (scenario === "kabo") {
              if (dayNum === 1) {
                const hasTrusted = !!(f.draft && f.draft.kaboTrustedByDay && f.draft.kaboTrustedByDay["1"] != null);
                const ids = hasTrusted && dayCfg.day1
                  ? dayCfg.day1
                  : ["kabo_trust_vote"];
                return ids.map((id) => ({ id, title: getStepTitle(id) }));
              }
              // Day 2+: use default
              const ids = dayCfg.default || dayCfg.base;
              return ids.map((id) => ({ id, title: getStepTitle(id) }));
            }
            // Bazras: optional interrogation at start
            if (scenario === "bazras") {
              const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[String(f.day)]))
                ? f.draft.dayStepsByDay[String(f.day)] : null;
              if (snapshotIds) {
                const endCardStep = getEndCardActionStepForDay(f);
                const withoutEndCard = snapshotIds.filter((id) => !id || !String(id).startsWith("day_end_card_"));
                const ids = endCardStep ? [...withoutEndCard, endCardStep.id] : withoutEndCard;
                return ids.map((id) => ({ id, title: (endCardStep && id === endCardStep.id) ? endCardStep.title : getStepTitle(id) }));
              }
              const prevNightKey = String(Math.max(0, dayNum - 1));
              const invTargets = (f.draft && f.draft.investigatorTargetsByNight && f.draft.investigatorTargetsByNight[prevNightKey]) || null;
              const showInterrogation = (() => {
                try {
                  if (!invTargets || invTargets.t1 == null || invTargets.t2 == null) return false;
                  const draw = appState.draw;
                  if (!draw || !draw.players) return false;
                  const p1 = draw.players[invTargets.t1];
                  const p2 = draw.players[invTargets.t2];
                  return !!(p1 && p1.alive !== false && p2 && p2.alive !== false);
                } catch { return false; }
              })();
              let ids = [];
              if (showInterrogation && dayCfg.interrogation) ids = ids.concat(dayCfg.interrogation);
              ids = ids.concat(dayCfg.base || ["day_vote", "day_elim"]);
              const endCardStep = getEndCardActionStepForDay(f);
              if (endCardStep) ids.push(endCardStep.id);
              return ids.map((id) => ({ id, title: (endCardStep && id === endCardStep.id) ? endCardStep.title : getStepTitle(id) }));
            }

            // Generic day: use snapshot if available, else compute from config + conditionals
            const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[String(f.day)]))
              ? f.draft.dayStepsByDay[String(f.day)] : null;
            if (snapshotIds) {
              const endCardStep = getEndCardActionStepForDay(f);
              // Replace any day_end_card_* in snapshot with current day's drawn card (avoids duplicate/wrong card).
              const withoutEndCard = snapshotIds.filter((id) => !id || !String(id).startsWith("day_end_card_"));
              const ids = endCardStep ? [...withoutEndCard, endCardStep.id] : withoutEndCard;
              return ids.map((id) => ({ id, title: (endCardStep && id === endCardStep.id) ? endCardStep.title : getStepTitle(id) }));
            }

            // Compute steps from config + runtime conditionals
            const cfg = getScenarioConfig(scenario);
            const allowed = (cfg.dayPhaseConfig && Array.isArray(cfg.dayPhaseConfig.steps))
              ? cfg.dayPhaseConfig.steps
              : ["day_guns", "day_vote", "day_elim"];
            const steps = [];
            const hasBombForStep = (() => {
              try {
                const d = f.draft || {};
                const rec = (d.bombByDay && d.bombByDay[String(f.day)]) ? d.bombByDay[String(f.day)] : null;
                return !!(f.bombActive || (rec && rec.target !== null && rec.target !== undefined));
              } catch { return !!f.bombActive; }
            })();
            const kaneRevealIdx = (() => {
              try {
                const prevNight = dayNum - 1;
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
            const stepIds = Array.isArray(dayCfg.steps) ? dayCfg.steps : null;
            if (stepIds) {
              for (const rawId of stepIds) {
                const optional = String(rawId).endsWith("?");
                const id = optional ? String(rawId).slice(0, -1) : String(rawId);
                if (id === "day_kane_reveal") {
                  if (kaneRevealIdx !== null) steps.push({ id: "day_kane_reveal", title: getStepTitle("day_kane_reveal") });
                  continue;
                }
                if (id === "end_card_action" || id === "__end_card__") {
                  const endCardStep = getEndCardActionStepForDay(f) || null;
                  if (endCardStep) steps.push(endCardStep);
                  continue;
                }
                if (id === "day_guns" && !(allowed.includes("day_guns") || allowed.includes("day_bomb"))) continue;
                if (id === "day_guns" && !(hasUsableDayGuns() || hasBombForStep)) continue;
                if (id === "day_gun_expiry" && !allowed.includes("day_gun_expiry")) continue;
                if (id === "day_gun_expiry" && !hasUnfiredRealGuns()) continue;
                steps.push({ id, title: getStepTitle(id) });
              }
              return steps;
            }

            if (dayCfg.kaneReveal && kaneRevealIdx !== null) {
              steps.push({ id: "day_kane_reveal", title: getStepTitle("day_kane_reveal") });
            }
            const baseIds = dayCfg.base || ["day_vote", "day_elim"];
            for (const id of baseIds) {
              if (id === "day_guns" && !(allowed.includes("day_guns") || allowed.includes("day_bomb"))) continue;
              if (id === "day_guns" && !(hasUsableDayGuns() || hasBombForStep)) continue;
              if (id === "day_gun_expiry" && !allowed.includes("day_gun_expiry")) continue;
              if (id === "day_gun_expiry" && !hasUnfiredRealGuns()) continue;
              steps.push({ id, title: getStepTitle(id) });
            }
            const endCardStep = (dayCfg.endCards && getEndCardActionStepForDay(f)) || null;
            if (endCardStep) steps.push(endCardStep);
            return steps;
          }
          // Per-role night steps: one step per wake order entry (same order as Wake tool).
          const cfg = getScenarioConfig(scenario);
          const wakeOrder = cfg.wakeOrder || {};
          const lang = (typeof appLang !== "undefined" && appLang === "fa") ? "fa" : "en";
          const wake = (wakeOrder[lang] && wakeOrder[lang].length) ? wakeOrder[lang] : (wakeOrder.en || wakeOrder.fa || []);
          const evenNight = ((f.day || 1) % 2) === 0;
          const bombAlreadyUsed = (() => {
            try {
              const d = f.draft || {};
              if (d.bombByDay && typeof d.bombByDay === "object") {
                for (const day of Object.keys(d.bombByDay)) {
                  const rec = d.bombByDay[day];
                  if (rec && (rec.target !== null && rec.target !== undefined)) return true;
                }
              }
              if (Array.isArray(f.events)) {
                if (f.events.some((e) => e && e.kind === "bomb_resolve")) return true;
              }
              return false;
            } catch { return false; }
          })();
          const labelLower = (w) => String(w || "").toLowerCase();
          const keepZodiac = (w) => {
            const x = labelLower(w);
            return evenNight || (!x.includes("zodiac") && !x.includes("زودیاک"));
          };
          const keepBomber = (w) => {
            const x = labelLower(w);
            const isBomber = x.includes("bomber") || x.includes("بمب");
            return !isBomber || !bombAlreadyUsed;
          };
          const keepNotIntroOnly = (w) => {
            const x = labelLower(w);
            return !x.includes("intro night only") && !x.includes("فقط شب معارفه");
          };
          // Pedarkhande: skip Kane step when Kane is dead (invisible bullet after revealing mafia)
          const keepKaneAlive = (w, stepId) => {
            if (scenario !== "pedarkhande") return true;
            const isKaneStep = (stepId && String(stepId).includes("kane")) || labelLower(w).includes("kane") || labelLower(w).includes("کین");
            if (!isKaneStep) return true;
            const draw = appState.draw;
            if (!draw || !draw.players) return true;
            const kaneIdx = draw.players.findIndex((p) => p && p.roleId === "citizenKane");
            if (kaneIdx === -1) return true;
            return draw.players[kaneIdx].alive !== false;
          };
          // Build kept labels and stepIds in parallel — same filter applied to both so indices stay aligned.
          // Using wake index i for nightStepIds would misalign when middle entries are filtered
          // (e.g. bomber already used, zodiac on odd nights): kept[k] must use the k-th kept stepId.
          const nightStepIds = Array.isArray(flowCfg && flowCfg.night) ? flowCfg.night : null;
          const keptLabels = [];
          const keptStepIds = [];
          for (let i = 0; i < wake.length; i++) {
            const w = wake[i];
            const stepId = (nightStepIds && i < nightStepIds.length) ? String(nightStepIds[i]) : "night_step_" + keptStepIds.length;
            if (keepZodiac(w) && keepBomber(w) && keepNotIntroOnly(w) && keepKaneAlive(w, stepId)) {
              keptLabels.push(w);
              keptStepIds.push(stepId);
            }
          }
          return keptLabels.map((label, k) => ({
            id: keptStepIds[k] || ("night_step_" + k),
            title: getStepTitle(keptStepIds[k]) || label,
          }));
        }

        // Apply Heir role inheritance at the night→day transition.
        // Called AFTER all night kills are applied, so we can see who actually died.
        // If the Heir's picked player is now dead (and Heir hasn't inherited yet),
        // change the Heir's roleId to the inherited role. Reversible via revertNightDeaths.
        function applyHeirInheritanceFromPayload(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            const dayKey = String(f.day || 1);

            // Find the alive Heir player.
            const heirIdx = draw.players.findIndex((p) => p && p.roleId === "heir" && p.alive !== false);
            if (heirIdx === -1) return false;

            // Find heirPick from any night's saved actions.
            const heirPick = (() => {
              if (!d.nightActionsByNight) return null;
              for (const nk of Object.keys(d.nightActionsByNight)) {
                const na = d.nightActionsByNight[nk];
                if (na && na.heirPick !== null && na.heirPick !== undefined) {
                  const idx = parseInt(na.heirPick, 10);
                  if (Number.isFinite(idx)) return idx;
                }
              }
              return null;
            })();
            if (heirPick === null) return false;

            // Check if inheritance was already applied in a previous night.
            if (!d.heirInheritedByDay || typeof d.heirInheritedByDay !== "object") d.heirInheritedByDay = {};
            const alreadyInherited = Object.keys(d.heirInheritedByDay).some((k) => {
              const r = d.heirInheritedByDay[k];
              return r && r.heirIdx === heirIdx && r.newRole !== null;
            });
            if (alreadyInherited) return false;

            // Check if the picked player is now dead.
            const pickedPlayer = draw.players[heirPick];
            if (!pickedPlayer || pickedPlayer.alive !== false) return false;

            // Apply: change Heir's roleId to the picked player's role.
            const newRole = pickedPlayer.roleId || "citizen";
            const prevRole = draw.players[heirIdx].roleId;
            draw.players[heirIdx].roleId = newRole;
            d.heirInheritedByDay[dayKey] = { heirIdx, prevRole, newRole, pickedIdx: heirPick };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Resolve all night effects from payload. Used by effect registry and nextFlowStep.
        // Order: Herbalist → Pro/Sniper/Ocean/Zodiac → Negotiator → Saul → Investigator → Sodagari → Soldier → Mafia → Constantine → SixthSense → Heir.
        // Constantine runs after Mafia/Pro so he can revive players who died this night (e.g. Leon shooting citizen).
        function resolveNightFromPayload(f, payload) {
          try {
            const draw = appState.draw;
            if (!payload || !draw || !draw.players) return false;
            const payload0 = { ...payload };
            const scenario0 = getDrawScenarioForFlow();
            const findIdxByRole = (roleIds) => {
              const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
              for (let i = 0; i < (draw.players || []).length; i++) {
                const p = draw.players[i];
                if (!p) continue;
                if (ids.includes(p.roleId)) return i;
              }
              return null;
            };
            // Who is disabled this night? (Matador: disable lasts 24h = current night only; no carry-over to next night)
            let disabledIdx = null;
            if (scenario0 === "pedarkhande") {
              const matadorIdx = findIdxByRole(["matador"]);
              const matadorAlive = matadorIdx !== null && draw.players[matadorIdx] && draw.players[matadorIdx].alive !== false;
              const matadorV = payload0.matadorDisable;
              if (matadorAlive && matadorV !== null && matadorV !== undefined && Number.isFinite(Number(matadorV))) {
                const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
                const prevNight = (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) ? f.draft.nightActionsByNight[prevNightKey] : null;
                const prevMatadorV = (prevNight && prevNight.matadorDisable != null && Number.isFinite(Number(prevNight.matadorDisable))) ? parseInt(prevNight.matadorDisable, 10) : null;
                const sameAsPrev = prevMatadorV !== null && parseInt(matadorV, 10) === prevMatadorV;
                if (!sameAsPrev) disabledIdx = parseInt(matadorV, 10);
              }
            }
            if (disabledIdx === null && payload0.magicianDisable !== null && payload0.magicianDisable !== undefined && Number.isFinite(Number(payload0.magicianDisable))) {
              disabledIdx = parseInt(payload0.magicianDisable, 10);
            }
            const doctorIdx = findIdxByRole(["doctor", "watson"]);
            const lecterIdx = findIdxByRole(["doctorLecter"]);
            const detIdx = findIdxByRole(["detective"]);
            const proIdx = findIdxByRole(["professional", "leon"]);
            const bomberIdx = findIdxByRole(["bomber"]);
            const oceanIdx = findIdxByRole(["ocean"]);
            const zodiacIdx = findIdxByRole(["zodiac"]);
            const sniperIdx2 = findIdxByRole(["sniper"]);
            const kaneIdx = findIdxByRole(["citizenKane"]);
            const constantineIdx = findIdxByRole(["constantine"]);
            if (disabledIdx !== null) {
              if (doctorIdx !== null && disabledIdx === doctorIdx) payload0.doctorSave = null;
              if (lecterIdx !== null && disabledIdx === lecterIdx) payload0.lecterSave = null;
              if (detIdx !== null && disabledIdx === detIdx) payload0.detectiveQuery = null;
              if (proIdx !== null && disabledIdx === proIdx) payload0.professionalShot = null;
              if (bomberIdx !== null && disabledIdx === bomberIdx) { payload0.bombTarget = null; payload0.bombCode = null; }
              if (oceanIdx !== null && disabledIdx === oceanIdx) payload0.oceanWake = null;
              if (zodiacIdx !== null && disabledIdx === zodiacIdx) payload0.zodiacShot = null;
              if (sniperIdx2 !== null && disabledIdx === sniperIdx2) payload0.sniperShot = null;
              if (kaneIdx !== null && disabledIdx === kaneIdx) payload0.kaneMark = null;
              if (constantineIdx !== null && disabledIdx === constantineIdx) payload0.constantineRevive = null;
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.disabledByNight || typeof f.draft.disabledByNight !== "object") f.draft.disabledByNight = {};
              f.draft.disabledByNight[String(f.day)] = disabledIdx;
            }
            try { applyNightHerbalistFromPayload(f, payload0); } catch {}
            try { applyNightProfessionalFromPayload(f, payload0); } catch {}
            try { applyNightSniperFromPayload(f, payload0); } catch {}
            try { applyNightOceanFromPayload(f, payload0); } catch {}
            try { applyNightZodiacFromPayload(f, payload0); } catch {}
            try { applyNightNegotiatorFromPayload(f, payload0); } catch {}
            try { applyNightSaulBuyFromPayload(f, payload0); } catch {}
            try { applyNightInvestigatorFromPayload(f, payload0); } catch {}
            try { applyNightSodagariFromPayload(f, payload0); } catch {}
            try { applyNightSoldierFromPayload(f, payload0); } catch {}
            try { applyNightMafiaFromPayload(f, payload0); } catch {}
            try { applyNightConstantineFromPayload(f, payload0); } catch {}
            try { applyNightSixthSenseFromPayload(f, payload0); } catch {}
            try { applyHeirInheritanceFromPayload(f); } catch {}
            try { renderCast(); } catch {}
            try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
            try { saveState(appState); } catch {}
            return true;
          } catch {
            return false;
          }
        }

        // ── End-condition helpers ─────────────────────────────────────────────

        // Encodes a phase+day into a monotonically-increasing integer so we can
        // compare "before" vs "after" positions in the game timeline.
        function flowLogicalTime(phase, day) {
          if (phase === "intro_day")   return 0;
          if (phase === "intro_night") return 1;
          const d = Number(day) || 1;
          if (phase === "day")         return 2 + (d - 1) * 2;
          if (phase === "night")       return 2 + (d - 1) * 2 + 1;
          return 999999; // chaos, winner — always kept
        }

        // Remove events that belong to phases/days "after" the current position.
        // Called during back-navigation to keep the timeline accurate.
        function pruneEventsForward(f) {
          try {
            const cutoff = flowLogicalTime(f.phase, f.day);
            f.events = (f.events || []).filter((ev) => {
              if (!ev) return false;
              return flowLogicalTime(ev.phase, ev.day) <= cutoff;
            });
          } catch {}
        }

        // After any phase transition, check alive-player counts and auto-redirect
        // to Chaos or Winner if a game-end condition is detected.
        // backPhase/backDay/backStep describe where we came from so the user can
        // press Prev to return there.
        function checkAndAutoNavigate(f, backPhase, backDay, backStep) {
          try {
            if (!["day", "night", "intro_day", "intro_night"].includes(f.phase)) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const alive = draw.players
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p && p.alive !== false);
            const nostSide = (f.draft && (f.draft.nostradamusChosenSide === "mafia" || f.draft.nostradamusChosenSide === "citizen")) ? f.draft.nostradamusChosenSide : null;
            const getTeam = (p) => {
              if ((p && p.roleId) === "nostradamus" && nostSide && getDrawScenarioForFlow() === "pedarkhande") {
                return nostSide === "mafia" ? "مافیا" : "شهر";
              }
              const r = roles[p && p.roleId];
              return r ? r.teamFa : "شهر";
            };
            const nMafia   = alive.filter(({ p }) => getTeam(p) === "مافیا").length;
            const nIndep   = alive.filter(({ p }) => getTeam(p) === "مستقل").length;
            const nCitizen = alive.filter(({ p }) => getTeam(p) === "شهر").length;
            const total    = alive.length;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            // Mafia win: mafia ≥ all non-mafia
            if (nMafia > 0 && nMafia >= nCitizen + nIndep) {
              f.draft.winnerBack      = { phase: backPhase, day: backDay, step: backStep };
              f.draft.winnerFromChaos = false;
              f.draft.winnerTeam      = "mafia";
              f.phase = "winner"; f.step = 0;
              return true;
            }
            // Citizens win: no mafia and no independents
            if (nMafia === 0 && nIndep === 0) {
              f.draft.winnerBack      = { phase: backPhase, day: backDay, step: backStep };
              f.draft.winnerFromChaos = false;
              f.draft.winnerTeam      = "citizens";
              f.phase = "winner"; f.step = 0;
              return true;
            }
            // Chaos: exactly 3 alive, no win condition yet
            if (total === 3) {
              f.draft.chaosBack = { phase: backPhase, day: backDay, step: backStep };
              f.phase = "chaos"; f.step = 0;
              return true;
            }
            return false;
          } catch { return false; }
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
                  const draw2 = appState.draw;
                  const prevNightKeyGs = String((f.day || 1) - 1);
                  const prevNightActionsGs = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKeyGs]) || null;
                  for (const shot of rec.shots) {
                    if (shot.type === "real" && shot.targetPrevAlive) {
                      try { setPlayerLife(shot.target, { alive: false, reason: "shot" }); } catch {}
                      // Researcher chain kill: if the shot target is Researcher, also kill their linked Mafia.
                      try {
                        if ((draw2.players[shot.target] || {}).roleId === "researcher") {
                          const linkedIdxRaw = prevNightActionsGs ? prevNightActionsGs.researcherLink : null;
                          const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                          if (linkedIdx !== null && draw2.players[linkedIdx]) {
                            const linkedRoleId = draw2.players[linkedIdx].roleId || "citizen";
                            const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                            const scenarioGs = getDrawScenarioForFlow();
                            const chainApplies = scenarioGs === "bazras"
                              ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                              : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                            if (chainApplies) {
                              const chainWasAlive = draw2.players[linkedIdx].alive !== false;
                              if (chainWasAlive) { try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {} }
                              shot.chainKilled = linkedIdx;
                              shot.chainPrevAlive = chainWasAlive;
                            }
                          }
                        }
                      } catch {}
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
            if (curStep.id === "day_kane_reveal") {
              applyKaneRevealForDay(f);
              try { renderCast(); } catch {}
            }
            if (curStep.id && String(curStep.id).startsWith("day_end_card_")) {
              applyEndCardActionForDay(f);
              try { renderCast(); } catch {}
            }
            // Pedarkhande: apply Saul Buy when leaving mafia step so Back→change selection→Next works.
            if (curStep.id === "night_mafia_team" && getDrawScenarioForFlow() === "pedarkhande") {
              try {
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
                const payload = ev && ev.data ? ev.data : (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[String(f.day)]) || null;
                if (payload && String(payload.godfatherAction || "") === "saul_buy" && (payload.saulBuyTarget !== null && payload.saulBuyTarget !== undefined)) {
                  applyNightSaulBuyFromPayload(f, payload);
                  try { renderCast(); } catch {}
                }
              } catch {}
            }
            f.step++;
            saveState(appState);
            showFlowTool();
            return;
          }
          // phase transition
          if (f.phase === "winner") {
            // Terminal phase — Next does nothing.
            return;
          }
          if (f.phase === "chaos") {
            // Next on chaos: compute winner from picks and transition to winner phase.
            try {
              const draw = appState.draw;
              if (draw && draw.players) {
                const d2 = f.draft || {};
                const picks = d2.chaosPicks || {};
                const aIdxs = draw.players.map((p, i) => ({ p, i })).filter(({ p }) => p && p.alive !== false);
                const getT = (p) => { const r = roles[p && p.roleId]; return r ? r.teamFa : "شهر"; };
                const aMaf = aIdxs.filter(({ p }) => getT(p) === "مافیا");
                const aCit = aIdxs.filter(({ p }) => getT(p) === "شهر");
                const aInd = aIdxs.filter(({ p }) => getT(p) === "مستقل");
                let winner = null;
                if (aMaf.length === 1 && aCit.length === 2 && aInd.length === 0) {
                  const mafI = String(aMaf[0].i);
                  winner = aCit.some(({ i }) => String(picks[String(i)]) === mafI) ? "mafia" : "citizens";
                } else if (aMaf.length === 1 && aCit.length === 1 && aInd.length === 1) {
                  winner = String(picks[String(aCit[0].i)]) === String(aMaf[0].i) ? "mafia" : "independent";
                }
                if (winner) {
                  if (!f.draft) f.draft = {};
                  f.draft.winnerTeam = winner;
                  f.draft.winnerFromChaos = true;
                  f.phase = "winner";
                  f.step = 0;
                  saveState(appState);
                  showFlowTool();
                }
              }
            } catch {}
            return;
          }
          // Capture position BEFORE transition so back-nav can return here.
          const _prePhase = f.phase, _preDay = f.day, _preStep = f.step;
          // Sync status (alive/dead counts) at end of every phase — no dedicated step.
          try { if (typeof syncGodStatusFromPlayers === "function") syncGodStatusFromPlayers(); } catch {}
          if (f.phase === "intro_day") {
            f.phase = "intro_night";
            f.step = 0;  // Always start at first intro night step (Nostradamus for Pedarkhande)
          } else if (f.phase === "intro_night") {
            f.phase = "day";
            f.day = 1;
            f.step = 0;
          } else if (f.phase === "day") {
            // Apply end card action if we're on last step (end card) — it's not applied in the inner Next branch.
            const steps = getFlowSteps(f);
            const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
            if (curStep.id && String(curStep.id).startsWith("day_end_card_")) {
              try { applyEndCardActionForDay(f); } catch {}
              try { renderCast(); } catch {}
            }
            // Snapshot day steps so back-nav from night lands on the correct last step (e.g. Face Off).
            try {
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.dayStepsByDay || typeof f.draft.dayStepsByDay !== "object") f.draft.dayStepsByDay = {};
              f.draft.dayStepsByDay[String(f.day)] = getFlowSteps(f).map((s) => s.id);
            } catch {}
            // Clear guns from the just-finished day — they were only valid for that day.
            f.guns = {};
            f.phase = "night";
            f.step = 0;
            // Kane auto-death (pedarkhande): if Kane successfully identified a Mafia member the previous night,
            // they are eliminated the following night (تیر غیب).
            try {
              if (getDrawScenarioForFlow() === "pedarkhande") {
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
                            const draft = f.draft || {};
                            draft.kaneInvisibleBulletByNight = f.day || 1;
                            f.draft = draft;
                            try { renderCast(); } catch {}
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch {}
          } else {
            // Apply night resolution BEFORE moving to next day (via effect registry or fallback).
            try {
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
              const payload0 = ev && ev.data ? { ...ev.data } : null;
              if (payload0) {
                if (typeof applyEffect === "function" && typeof hasEffect === "function" && hasEffect("night_resolution")) {
                  applyEffect("night_resolution", { f, payload: payload0 });
                } else {
                  resolveNightFromPayload(f, payload0);
                }
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
          // After phase transition: auto-redirect to Chaos/Winner if conditions are met.
          checkAndAutoNavigate(f, _prePhase, _preDay, _preStep);
          saveState(appState);
          showFlowTool();
        }

        function prevFlowStep() {
          const f = ensureFlow();
          // No previous step at the very start of the flow.
          if (f.phase === "intro_day" && (f.step || 0) === 0) return;
          if (f.step > 0) {
            const steps = getFlowSteps(f);
            const leavingStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
            const enteringStep = (f.step || 0) > 0 ? (steps[Math.max(0, (f.step || 0) - 1)] || {}) : {};
            // Revert deaths applied by certain steps when going backward.
            // Each step now applies deaths only on Next (deferred), so we revert either when:
            //   (a) leaving that step going backward, OR
            //   (b) entering that step from a later step going backward.
            if (leavingStep.id === "day_elim" || leavingStep.id === "namayande_vote") {
              // Revert via effect registry (or fallback to direct call if registry not loaded)
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect(leavingStep.id)) {
                  revertEffect(leavingStep.id, { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              // Do NOT clear challengeUsedByDay — challenge selections are part of day_vote state and should persist when navigating back.
              // Return end card to pool when reverting elimination (cards cannot be reused in same game).
              try {
                const ec = appState.god && appState.god.endCards;
                if (ec && ec.byDay && ec.used && Array.isArray(ec.used)) {
                  const dayKey = String(f.day || 1);
                  const rec = ec.byDay[dayKey] && typeof ec.byDay[dayKey] === "object" ? ec.byDay[dayKey] : null;
                  if (rec && rec.cardId) {
                    const idx = ec.used.indexOf(rec.cardId);
                    if (idx >= 0) ec.used.splice(idx, 1);
                    delete ec.byDay[dayKey];
                  }
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id && String(leavingStep.id).startsWith("day_end_card_")) {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
              // Clear day step snapshot so steps are recomputed when user changes votes and a new card is drawn.
              try {
                if (f.draft && f.draft.dayStepsByDay && typeof f.draft.dayStepsByDay === "object") {
                  delete f.draft.dayStepsByDay[String(f.day)];
                }
              } catch {}
              // Do NOT clear endCardActionByDay — selection should persist when navigating back (see day_vote/challengeUsedByDay).
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "kabo_shoot" || enteringStep.id === "kabo_shoot") {
              // kabo_shoot applies death on Next. Revert via effect registry.
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("kabo_shoot")) {
                  revertEffect("kabo_shoot", { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "bazras_forced_vote" || enteringStep.id === "bazras_forced_vote") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("bazras_forced_vote")) {
                  revertEffect("bazras_forced_vote", { f });
                } else {
                  const d = f.draft || {};
                  const dayKey = String(f.day || 1);
                  const rec = (d.bazrasInterrogationByDay && d.bazrasInterrogationByDay[dayKey]) || {};
                  applyBazrasInterrogationFromPayload(f, { decision: rec.decision || null, outcome: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_gun_expiry") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_gun_expiry")) {
                  revertEffect("day_gun_expiry", { f });
                } else {
                  revertGunExpiryForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_guns" || enteringStep.id === "day_guns") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_guns")) {
                  revertEffect("day_guns", { f });
                } else {
                  revertGunShotsForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id === "day_kane_reveal") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_kane_reveal")) {
                  revertEffect("day_kane_reveal", { f });
                } else {
                  revertKaneRevealForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id && String(enteringStep.id).startsWith("day_end_card_")) {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id === "night_mafia_team" && getDrawScenarioForFlow() === "pedarkhande") {
              // Revert Saul Buy when going Back to mafia step (it was applied when leaving mafia step).
              // Trigger when entering mafia from any later night step (Watson, Leon, Kane, Constantine).
              try {
                const dayKey = String(f.day || 1);
                const d = f.draft || {};
                if (d.nightSaulBuyAppliedByDay && d.nightSaulBuyAppliedByDay[dayKey]) {
                  const rec = d.nightSaulBuyAppliedByDay[dayKey];
                  if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                    const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                    if (p) p.roleId = rec.prevRoleId;
                  }
                  d.nightSaulBuyAppliedByDay[dayKey] = { converted: null, prevRoleId: null };
                }
                if (d.saulBuyUsedOnNight != null && Number(d.saulBuyUsedOnNight) === Number(dayKey)) {
                  d.saulBuyUsed = false;
                  d.saulBuyUsedOnNight = null;
                }
                try { renderCast(); } catch {}
              } catch {}
            }
            // When entering day_vote or namayande_defense from day_elim/namayande_vote, ensure vote-out is reverted
            // so the voted-out player appears in the select-defenders list (user-reported bug).
            if (enteringStep.id === "day_vote" || enteringStep.id === "namayande_defense") {
              try {
                const elimId = (leavingStep.id === "namayande_vote") ? "namayande_vote" : "day_elim";
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect(elimId)) {
                  revertEffect(elimId, { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            }
            f.step--;
            try { pruneEventsForward(f); } catch {}
            saveState(appState);
            showFlowTool();
            return;
          }
          // go back to previous phase end
          if (f.phase === "winner") {
            if (f.draft && f.draft.winnerFromChaos) {
              f.phase = "chaos";
              f.step = 0;
            } else if (f.draft && f.draft.winnerBack) {
              const bk = f.draft.winnerBack;
              f.phase = bk.phase; f.day = bk.day; f.step = bk.step;
            } else {
              f.phase = "day"; f.step = 0;
            }
            try { pruneEventsForward(f); } catch {}
            saveState(appState); showFlowTool(); return;
          }
          if (f.phase === "chaos") {
            if (f.draft && f.draft.chaosBack) {
              const bk = f.draft.chaosBack;
              f.phase = bk.phase; f.day = bk.day; f.step = bk.step;
            } else {
              f.phase = "day"; f.step = 0;
            }
            try { pruneEventsForward(f); } catch {}
            saveState(appState); showFlowTool(); return;
          }
          if (f.phase === "intro_night") {
            f.phase = "intro_day";
            f.step = 0;
            try { pruneEventsForward(f); } catch {}
            saveState(appState);
            showFlowTool();
            return;
          }
          if (f.phase === "night") {
            // Night → last day step. Use snapshot from day→night transition when available,
            // else compute steps (before any revert) so we land on the correct step
            // (e.g. Face Off, not day_elim, when the last step was an end card).
            const dayKey = String(f.day || 1);
            const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[dayKey]))
              ? f.draft.dayStepsByDay[dayKey] : null;
            const daySteps = snapshotIds && snapshotIds.length
              ? snapshotIds.map((id) => ({ id, title: id }))
              : getFlowSteps({ ...f, phase: "day" });
            const lastDayStepId = daySteps.length > 0 ? (daySteps[daySteps.length - 1] || {}).id : "";
            const lastStepIsEndCard = lastDayStepId && String(lastDayStepId).startsWith("day_end_card_");
            f.phase = "day";
            f.step = Math.max(0, daySteps.length - 1);
            // Only revert day_elim when landing on day_elim (not when landing on end card step).
            if (!lastStepIsEndCard) {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_elim")) {
                  revertEffect("day_elim", { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try {
                const ec = appState.god && appState.god.endCards;
                if (ec && ec.byDay && ec.used && Array.isArray(ec.used)) {
                  const dayKey = String(f.day || 1);
                  const rec = ec.byDay[dayKey] && typeof ec.byDay[dayKey] === "object" ? ec.byDay[dayKey] : null;
                  if (rec && rec.cardId) {
                    const idx = ec.used.indexOf(rec.cardId);
                    if (idx >= 0) ec.used.splice(idx, 1);
                    delete ec.byDay[dayKey];
                  }
                }
              } catch {}
            } else {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
            }
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
          } else {
            // Day step 0 → previous night's last step.
            if ((f.day || 1) > 1) {
              // Revert day effects applied at step 0 (e.g. Kane reveal) before reverting night.
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_kane_reveal")) {
                  revertEffect("day_kane_reveal", { f });
                } else {
                  revertKaneRevealForDay(f);
                }
              } catch {}
              // Clear the day step snapshot for this day — it will be recomputed on next forward.
              try {
                if (f.draft && f.draft.dayStepsByDay && typeof f.draft.dayStepsByDay === "object") {
                  delete f.draft.dayStepsByDay[String(f.day)];
                }
              } catch {}
              // Revert all deaths that were applied when that night transitioned to this day.
              const prevNight = (f.day || 1) - 1;
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("night_resolution")) {
                  revertEffect("night_resolution", { f, nightDayNum: prevNight });
                } else {
                  revertNightDeaths(f, prevNight);
                }
              } catch {}
              try { renderCast(); } catch {}
              f.day = Math.max(1, f.day - 1);
              f.phase = "night";
              f.step = Math.max(0, getFlowSteps({ ...f, phase: "night" }).length - 1);
            } else {
              // Day 1 step 0 → go back to intro_night (last step).
              f.phase = "intro_night";
              const introSteps = getFlowSteps({ ...f, phase: "intro_night" });
              f.step = Math.max(0, introSteps.length - 1);
            }
          }
          try { pruneEventsForward(f); } catch {}
          try { if (typeof syncGodStatusFromPlayers === "function") syncGodStatusFromPlayers(); } catch {}
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
            const guardDisabledPrevNight = (guardIdx !== null && d.disabledByNight && d.disabledByNight[String(f.day)] != null)
              ? (parseInt(d.disabledByNight[String(f.day)], 10) === guardIdx) : false;
            const guardSac = !!(document.getElementById("fl_bomb_guard") && document.getElementById("fl_bomb_guard").checked && guardIdx !== null && !guardDisabledPrevNight);
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
