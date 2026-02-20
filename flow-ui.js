        function detectiveInquiryIsMafia(roleId) {
          const rid = String(roleId || "citizen");
          // citizen-but-positive roles
          if (rid === "suspect") return true;
          // mafia-leader-but-negative roles
          if (rid === "godfather" || rid === "mafiaBoss" || rid === "danMafia" || rid === "alcapone") return false;
          const teamFa = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
          return teamFa === "مافیا";
        }

        function normWake(s) {
          const x = String(s || "").toLowerCase();
          // Specific compound roles must be checked before generic team labels.
          // "جوکر مافیا" contains "مافیا", so joker check must come first.
          if (x.includes("joker") || x.includes("جوکر")) return "jokermaf";
          if (x.includes("mafia") || x.includes("مافیا")) return "mafia";
          if (x.includes("professional") || x.includes("حرفه")) return "professional";
          if (x.includes("detective") || x.includes("کارآگاه")) return "detective";
          // "لکتر"/"lecter" must come before generic "doctor"/"دکتر" check
          if (x.includes("لکتر") || x.includes("lecter")) return "lecter";
          if (x.includes("doctor") || x.includes("پزشک") || x.includes("دکتر")) return "doctor";
          if (x.includes("watson")) return "doctor";
          if (x.includes("bomber") || x.includes("بمب")) return "bomber";
          if (x.includes("magician") || x.includes("شعبده") || x.includes("شوومن") || x.includes("شومن")) return "magician";
          if (x.includes("zodiac") || x.includes("زودیاک")) return "zodiac";
          if (x.includes("gunslinger") || x.includes("gunner") || x.includes("تفنگدار")) return "gunslinger";
          if (x.includes("ocean") || x.includes("اوشن")) return "ocean";
          if (x.includes("leon") || x.includes("لئون")) return "professional";
          if (x.includes("citizen kane") || x.includes("kane") || x.includes("کین")) return "kane";
          if (x.includes("constantine") || x.includes("کنستانتین")) return "constantine";
          if (x.includes("nostradamus") || x.includes("نوستراداموس")) return "nostradamus";
          if (x.includes("heir") || x.includes("وارث")) return "heir";
          if (x.includes("herbalist") || x.includes("attar") || x.includes("عطار")) return "herbalist";
          if (x.includes("armorsmith") || x.includes("زره")) return "armorsmith";
          if (x.includes("swindler") || x.includes("charlatan") || x.includes("شیاد")) return "swindler";
          if (x.includes("researcher") || x.includes("hunter") || x.includes("محقق")) return "researcher";
          if (x.includes("natasha") || x.includes("ناتاشا")) return "natasha";
          if (x.includes("sniper") || x.includes("تک‌تیرانداز") || x.includes("تک تیرانداز")) return "sniper";
          if (x.includes("negotiat") || x.includes("مذاکره")) return "negotiator";
          if (x.includes("kadkhoda") || x.includes("کدخدا")) return "kadkhoda";
          if (x.includes("reporter") || x.includes("خبرنگار")) return "reporter";
          if (x.includes("representative") || x.includes("نماینده")) return "representative";
          if (x.includes("nato") || x.includes("ناتو")) return "nato";
          if (x.includes("hacker") || x.includes("هکر")) return "hacker";
          if (x.includes("guide") || x.includes("راهنما")) return "guide";
          if (x.includes("bodyguard") || x.includes("محافظ")) return "bodyguard";
          if (x.includes("minemaker") || x.includes("مین")) return "minemaker";
          if (x.includes("lawyer") || x.includes("وکیل")) return "lawyer";
          return "other";
        }

        function showFlowTool() {
          const draw = appState.draw;
          if (!draw || !draw.players || !draw.players.length) {
            openToolModal(t("tool.flow.title"), `<div class="toolBox">${escapeHtml(t("tool.flow.needDeal"))}</div>`);
            return;
          }
          const f = ensureFlow();
          const steps = getFlowSteps(f);
          const cur = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))];

          const scenario = getDrawScenarioForFlow();
          const names = getPlayerNamesForFlow();
          const aliveIdxs = (draw.players || []).map((p, idx) => (p && p.alive === false) ? null : idx).filter((x) => x !== null);
          const opts = [`<option value="">—</option>`].concat(
            names.map((nm, idx) => `<option value="${idx}">${escapeHtml(nm)}</option>`)
          ).join("");
          const optsAlive = [`<option value="">—</option>`].concat(
            aliveIdxs.map((idx) => `<option value="${idx}">${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</option>`)
          ).join("");

          // wake order list
          const _wakeOrder = getScenarioConfig(scenario).wakeOrder || {};
          const wake = appLang === "en" ? (_wakeOrder.en || _wakeOrder.fa || []) : (_wakeOrder.fa || []);

          const stepCount = steps.length;
          const stepLine = t("tool.flow.step", { i: (Math.min(stepCount, (f.step || 0) + 1)), n: stepCount });
          // Only show bomb status when it is ACTIVE (hide "inactive" noise).
          const bombLine = (() => {
            if (!f.bombActive) return "";
            try {
              const d = f.draft || {};
              const rec = (d.bombByDay && d.bombByDay[String(f.day)]) ? d.bombByDay[String(f.day)] : null;
              if (!rec || rec.target === null || rec.target === undefined) return t("tool.flow.bomb.active");
              const nm = names[rec.target] || t("common.playerN", { n: rec.target + 1 });
              const code = (rec.code != null && String(rec.code).trim()) ? String(rec.code).trim() : "—";
              if (appLang === "fa") return `بمب جلوی «${nm}» کاشته شده است (کد: ${code}).`;
              return `Bomb is planted in front of “${nm}” (code: ${code}).`;
            } catch {
              return t("tool.flow.bomb.active");
            }
          })();

          // step-specific body
          let body = "";
          if (cur.id === "day_bomb") {
            const d = f.draft || {};
            if (!d.bombByDay || typeof d.bombByDay !== "object") d.bombByDay = {};
            if (!d.bombResolveByDay || typeof d.bombResolveByDay !== "object") d.bombResolveByDay = {};
            // If we are BACK on the Bomb step, revert so editing is intuitive. Skip if we just applied from change handler.
            if (!bombApplyJustHappened) {
              try {
                const key = String(f.day || 1);
                if (!d.bombAppliedByDay || typeof d.bombAppliedByDay !== "object") d.bombAppliedByDay = {};
                const prev = (d.bombAppliedByDay[key] && typeof d.bombAppliedByDay[key] === "object") ? d.bombAppliedByDay[key] : null;
                if (prev && prev.killed !== null && prev.killed !== undefined && Number.isFinite(Number(prev.killed))) {
                  const pi = parseInt(prev.killed, 10);
                  if (prev.prevAlive === true) {
                    try { setPlayerLife(pi, { alive: true }); } catch {}
                  }
                  prev.killed = null;
                  prev.prevAlive = null;
                  d.bombAppliedByDay[key] = prev;
                }
                if (d.bombResolveByDay[key] && typeof d.bombResolveByDay[key] === "object") {
                  d.bombResolveByDay[key].resolved = false;
                  d.bombResolveByDay[key].outcome = null;
                }
                f.draft = d;
                saveState(appState);
              } catch {}
            }
            const rec = d.bombByDay[String(f.day)] || null;
            const targetIdx = (rec && rec.target !== null && rec.target !== undefined && Number.isFinite(Number(rec.target))) ? parseInt(rec.target, 10) : null;
            const targetName = (targetIdx !== null) ? (names[targetIdx] || t("common.playerN", { n: targetIdx + 1 })) : (appLang === "fa" ? "—" : "—");
            const plantedCode = (rec && rec.code != null && String(rec.code).trim()) ? String(rec.code).trim() : "";
            const guardIdx = (() => {
              try {
                for (let i = 0; i < (draw.players || []).length; i++) {
                  const p = draw.players[i];
                  if (!p) continue;
                  const rid = p.roleId || "citizen";
                  if (roles[rid] && roles[rid].canSacrificeForBomb) return i;
                }
              } catch {}
              return null;
            })();
            const hasGuard = guardIdx !== null;
            const guardAlive = (guardIdx !== null && draw.players && draw.players[guardIdx]) ? (draw.players[guardIdx].alive !== false) : false;
            const guardName = (guardIdx !== null)
              ? (names[guardIdx] || t("common.playerN", { n: guardIdx + 1 }))
              : (appLang === "fa" ? "—" : "—");

            const r0 = (d.bombResolveByDay[String(f.day)] && typeof d.bombResolveByDay[String(f.day)] === "object")
              ? d.bombResolveByDay[String(f.day)]
              : { guardSacrifice: false, guardGuess: "", targetGuess: "", resolved: false, outcome: null };
            const mkCodeOpts = (sel) => {
              const s = String(sel ?? "").trim();
              const opts = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
              for (let i = 1; i <= 4; i++) {
                const v = String(i);
                opts.push(`<option value="${v}" ${s === v ? "selected" : ""}>${v}</option>`);
              }
              return opts.join("");
            };
            const headline = (appLang === "fa")
              ? `بمب جلوی «${targetName}» کاشته شده است${plantedCode ? ` (کد: ${plantedCode})` : ""}.`
              : `Bomb is planted in front of “${targetName}”${plantedCode ? ` (code: ${plantedCode})` : ""}.`;
            // Keep bomb UI concise; detailed rules belong in Help.
            const guardLine = hasGuard
              ? (guardAlive ? "" : (appLang === "fa" ? `محافظ (${guardName}) مرده است.` : `Guard (${guardName}) is dead.`))
              : (appLang === "fa" ? "محافظ در این بازی وجود ندارد." : "No Guard in this game.");

            const outcomeLine = (() => {
              // Live preview: updates as options change. If already applied, mark it as applied.
              if (!plantedCode) return "";
              const applied = !!(r0 && r0.resolved);
              const sac = !!(hasGuard && guardAlive && r0 && r0.guardSacrifice);
              const guardGuess = String((r0 && r0.guardGuess) || "").trim();
              const targetGuess = String((r0 && r0.targetGuess) || "").trim();
              const guess = sac ? guardGuess : targetGuess;
              const prefix = (appLang === "fa")
                ? (applied ? "نتیجه (اعمال‌شده): " : "نتیجه: ")
                : (applied ? "Result (applied): " : "Result: ");
              if (!guess) {
                return prefix + (appLang === "fa"
                  ? (sac ? "کدِ محافظ را انتخاب کنید." : "حدسِ هدف را انتخاب کنید.")
                  : (sac ? "Pick Guard guess." : "Pick target guess."));
              }
              const ok = String(guess) === String(plantedCode);
              const o =
                sac
                  ? (ok ? "neutralized_guard" : "guard_died")
                  : (ok ? "neutralized_target" : "target_died");
              if (o === "neutralized_guard") return prefix + (appLang === "fa" ? "محافظ بمب را خنثی کرد." : "Guard neutralized the bomb.");
              if (o === "guard_died") return prefix + (appLang === "fa" ? "محافظ اشتباه حدس زد و مرد." : "Guard guessed wrong and died.");
              if (o === "neutralized_target") return prefix + (appLang === "fa" ? "هدف درست حدس زد و بمب خنثی شد." : "Target guessed right; bomb neutralized.");
              if (o === "target_died") return prefix + (appLang === "fa" ? "هدف اشتباه حدس زد و مرد." : "Target guessed wrong and died.");
              return "";
            })();

            body = `
              <div class="note" style="margin-top:6px">${escapeHtml(headline)}</div>
              <div style="height:10px"></div>
              ${guardLine ? `<div class="note">${escapeHtml(guardLine)}</div><div style="height:10px"></div>` : ``}
              <div style="height:14px"></div>
              ${hasGuard ? `
                <label for="fl_bomb_guard" style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:14px; font-weight:950; cursor:pointer; user-select:none; -webkit-user-select:none">
                  <span>${escapeHtml(appLang === "fa" ? "محافظ فدا می‌شود؟" : "Does Guard sacrifice?")}</span>
                  <input id="fl_bomb_guard" type="checkbox" ${r0.guardSacrifice ? "checked" : ""} ${guardAlive ? "" : "disabled"} style="width:24px; height:24px; margin:0; accent-color: var(--primary)" />
                </label>
                <div style="height:10px"></div>
              ` : ``}
              ${hasGuard && r0.guardSacrifice ? `
                <label>${escapeHtml(appLang === "fa" ? `حدسِ محافظ (${guardName})` : `Guard (${guardName}) guess`)}
                  <select id="fl_bomb_guard_guess">${mkCodeOpts(r0.guardGuess)}</select>
                </label>
              ` : `
                <label>${escapeHtml(appLang === "fa" ? `حدسِ ${targetName}` : `${targetName} guess`)}
                  <select id="fl_bomb_target_guess">${mkCodeOpts(r0.targetGuess)}</select>
                </label>
              `}
              ${outcomeLine ? `<div class="note" style="margin-top:10px; font-weight:950">${escapeHtml(outcomeLine)}</div>` : ``}
              <div class="note" style="margin-top:10px">${escapeHtml(appLang === "fa" ? "با انتخاب حدس، نتیجه بلافاصله اعمال می‌شود؛ «بعدی» برای ادامه." : "Your choice applies immediately. Press \"Next\" to continue.")}</div>
            `;
          } else if (cur.id === "day_kane_reveal") {
            const prevNight = (f.day || 1) - 1;
            const kaneEv = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNight && e.data);
            const kanePayload = kaneEv && kaneEv.data ? kaneEv.data : null;
            const kaneRaw = kanePayload ? kanePayload.kaneMark : null;
            const kaneIdx = (kaneRaw !== null && kaneRaw !== undefined && Number.isFinite(parseInt(kaneRaw, 10))) ? parseInt(kaneRaw, 10) : null;
            const kaneName = kaneIdx !== null ? escapeHtml(names[kaneIdx] || t("common.playerN", { n: kaneIdx + 1 })) : "?";
            body = `
              <div style="text-align:center; padding:20px 0 10px">
                <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:18px; text-transform:uppercase; letter-spacing:.05em">${escapeHtml(t("tool.flow.kane.revealTitle"))}</div>
                <div style="font-size:22px; font-weight:1100; color:#fff; margin-bottom:14px; padding:14px 18px; background:rgba(220,53,69,.18); border:2px solid rgba(220,53,69,.55); border-radius:14px; display:inline-block; min-width:120px">${kaneName}</div>
                <div class="note" style="margin-top:14px">${escapeHtml(t("tool.flow.kane.revealBody"))}</div>
              </div>
            `;
          } else if (cur.id === "day_vote") {
            const d = f.draft || {};
            if (!d.voteCandidatesByDay || typeof d.voteCandidatesByDay !== "object") d.voteCandidatesByDay = {};
            const selected = Array.isArray(d.voteCandidatesByDay[f.day]) ? d.voteCandidatesByDay[f.day] : [];

            const cells = aliveIdxs.map((idx) => {
              const isSel = selected.includes(idx) || selected.map(Number).includes(idx);
              const name = escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }));
              const selStyle = isSel
                ? `background:rgba(99,179,237,.22); border:2px solid #63b3ed; color:#fff; font-weight:1100;`
                : `background:rgba(255,255,255,.05); border:2px solid rgba(255,255,255,.10); color:var(--muted); font-weight:950;`;
              return `
                <button class="fl_vote_btn" data-idx="${idx}" type="button"
                  style="width:100%; aspect-ratio:1/1; border-radius:14px; cursor:pointer;
                         display:flex; align-items:center; justify-content:center; text-align:center;
                         padding:8px; font-size:13px; line-height:1.3;
                         transition:background .12s,border-color .12s;
                         box-shadow:0 4px 12px rgba(0,0,0,.25); ${selStyle}">
                  ${name}
                </button>
              `;
            }).join("");

            const showBombWarn = !!(f.day >= 2 && f.bombActive && !(f.draft && f.draft.bombTriggeredOnce));
            ensureTimers();
            const _tmrV = appState.god.timers;
            body = `
              <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "برای دفاع، بازیکنان نامزدشده را انتخاب کنید." : "Tap the players who have been nominated to defend themselves.")}</div>
              ${showBombWarn ? `<div class="note" style="margin-top:10px; font-weight:950">${escapeHtml(t("tool.flow.bomb.active"))}</div>` : ``}
              <div class="timerRow" style="margin-top:10px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,.08)">
                <div class="timerCard">
                  <div class="tname">${escapeHtml(t("tool.timer.turn"))}</div>
                  <div class="tval clickable" id="tm_talk">${formatMMSS(_tmrV.remaining.talk ?? _tmrV.talk)}</div>
                  <div style="display:flex; gap:6px; justify-content:center; align-items:center">
                    <button class="tbtn" id="tm_btn_talk" type="button" aria-label="Play/Pause"></button>
                    <button class="tbtn reset" id="tm_rst_talk" type="button" aria-label="Reset"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg></button>
                  </div>
                </div>
                <div class="timerCard">
                  <div class="tname">${escapeHtml(t("tool.timer.challenge"))}</div>
                  <div class="tval clickable" id="tm_challenge">${formatMMSS(_tmrV.remaining.challenge ?? _tmrV.challenge)}</div>
                  <div style="display:flex; gap:6px; justify-content:center; align-items:center">
                    <button class="tbtn" id="tm_btn_challenge" type="button" aria-label="Play/Pause"></button>
                    <button class="tbtn reset" id="tm_rst_challenge" type="button" aria-label="Reset"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg></button>
                  </div>
                </div>
              </div>
              <div style="height:10px"></div>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; max-height:50vh; overflow:auto; -webkit-overflow-scrolling:touch;">
                ${cells || `<div style="color:var(--muted); font-weight:900; grid-column:1/-1">${escapeHtml(appLang === "fa" ? "بازیکن زنده‌ای وجود ندارد." : "No alive players.")}</div>`}
              </div>
            `;
          } else if (cur.id === "day_defense") {
            const d = f.draft || {};
            const voters = aliveIdxs.length;
            const eligibleVoters = Math.max(0, voters - 1); // candidate cannot vote for self
            const threshold = Math.floor(eligibleVoters / 2) + 1; // bigger than half of eligible voters
            const counts = (d.voteCountsByDay && d.voteCountsByDay[f.day] && typeof d.voteCountsByDay[f.day] === "object")
              ? d.voteCountsByDay[f.day]
              : null;

            if (!counts) {
              body = `
                <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.defense.needVotes"))}</div>
              `;
            } else {
              const defenders = aliveIdxs
                .map((idx) => {
                  const v = (typeof counts[idx] === "number") ? counts[idx] : (typeof counts[String(idx)] === "number" ? counts[String(idx)] : 0);
                  return { idx, v: Math.max(0, Math.floor(Number(v || 0))) };
                })
                .filter((x) => x.v >= threshold)
                .sort((a, b) => (b.v - a.v) || (a.idx - b.idx));

              const listHtml = defenders.length
                ? defenders.map((x) => `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.06)">
                      <div style="font-weight:1100">${escapeHtml(names[x.idx] || t("common.playerN", { n: x.idx + 1 }))}</div>
                      <div style="color:var(--muted); font-weight:950">${escapeHtml(String(x.v))}</div>
                    </div>
                  `).join("")
                : `<div style="color:var(--muted); font-weight:900">${escapeHtml(t("tool.flow.defense.none"))}</div>`;

              body = `
                <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.defense.hint"))}</div>
                <div style="height:10px"></div>
                <div class="note">${escapeHtml(t("tool.flow.defense.threshold", { n: threshold, v: eligibleVoters }))}</div>
                <div style="height:10px"></div>
                <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px">
                  <div style="font-weight:1100">${escapeHtml(t("tool.flow.defense.list"))}</div>
                  <div style="color:var(--muted); font-weight:900; font-size:12px">${escapeHtml(appLang === "fa" ? "رأی" : "Votes")}</div>
                </div>
                <div style="height:6px"></div>
                <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px; background: rgba(17,24,36,.25); max-height: 46vh; overflow:auto; -webkit-overflow-scrolling: touch;">
                  ${listHtml}
                </div>
              `;
            }
          } else if (cur.id === "day_elim") {
            ensureTimers();
            const _tmrE = appState.god.timers;
            const d = f.draft || {};
            const votersAtVote = (d.voteVotersByDay && typeof d.voteVotersByDay[f.day] === "number")
              ? Math.max(0, Math.floor(Number(d.voteVotersByDay[f.day] || 0)))
              : aliveIdxs.length;
            const eligibleVoters = Math.max(0, votersAtVote - 1); // candidate cannot vote for self
            const defThreshold = Math.floor(eligibleVoters / 2) + 1; // majority to enter defense list
            // Load votes: prefer latest day_vote event (source of truth), fallback to draft.
            let dayCounts = null;
            try {
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_vote" && e.phase === "day" && e.day === f.day && e.data && e.data.counts);
              if (ev && ev.data && ev.data.counts && typeof ev.data.counts === "object") dayCounts = ev.data.counts;
            } catch {}
            if (!dayCounts) {
              dayCounts = (d.voteCountsByDay && d.voteCountsByDay[f.day] && typeof d.voteCountsByDay[f.day] === "object")
                ? d.voteCountsByDay[f.day]
                : null;
            }
            // Keep draft in sync so the UI stays consistent even if we came from older saves.
            if (dayCounts && typeof dayCounts === "object") {
              try {
                if (!d.voteCountsByDay || typeof d.voteCountsByDay !== "object") d.voteCountsByDay = {};
                d.voteCountsByDay[f.day] = dayCounts;
                f.draft = d;
                saveState(appState);
              } catch {}
            }
            const roster = (() => {
              try {
                const r = (d.voteRosterByDay && Array.isArray(d.voteRosterByDay[f.day])) ? d.voteRosterByDay[f.day] : null;
                if (r && r.length) return r.slice();
              } catch {}
              // fallback: consider keys in dayCounts
              try {
                if (dayCounts && typeof dayCounts === "object") {
                  return Object.keys(dayCounts).map((k) => parseInt(k, 10)).filter((x) => Number.isFinite(x));
                }
              } catch {}
              return aliveIdxs.slice();
            })();
            // Prefer direct button-selection (new flow) over old threshold-based computation.
            const candidatesBase = Array.isArray(d.voteCandidatesByDay && d.voteCandidatesByDay[f.day])
              ? d.voteCandidatesByDay[f.day].map((i) => ({ idx: parseInt(i, 10), v: 1 })).filter((x) => Number.isFinite(x.idx))
              : (dayCounts
                  ? roster
                      .map((idx) => {
                        const v = (typeof dayCounts[idx] === "number") ? dayCounts[idx] : (typeof dayCounts[String(idx)] === "number" ? dayCounts[String(idx)] : 0);
                        return { idx, v: Math.max(0, Math.floor(Number(v || 0))) };
                      })
                      .filter((x) => x.v >= defThreshold)
                      .sort((a, b) => (b.v - a.v) || (a.idx - b.idx))
                  : []);
            if (!d.elimCandidatesByDay || typeof d.elimCandidatesByDay !== "object") d.elimCandidatesByDay = {};
            // Keep defense list LIVE (derived from latest voting).
            const defenseList = candidatesBase.map((x) => x.idx);
            const prevList = Array.isArray(d.elimCandidatesByDay[f.day]) ? d.elimCandidatesByDay[f.day] : [];
            const changed = JSON.stringify(prevList || []) !== JSON.stringify(defenseList || []);
            d.elimCandidatesByDay[f.day] = defenseList;

            // If the defense list changed (due to editing Voting), reset elimination votes/picks and clear any previous out.
            if (changed) {
              if (!d.elimVotesByDay || typeof d.elimVotesByDay !== "object") d.elimVotesByDay = {};
              d.elimVotesByDay[f.day] = {};
              d.elimLeadersByDay = (d.elimLeadersByDay && typeof d.elimLeadersByDay === "object") ? d.elimLeadersByDay : {};
              d.elimLeadersByDay[f.day] = [];
              d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
              d.elimPickedByDay[f.day] = null;
              try { addFlowEvent("day_elim_out", { out: null, reset: true }); } catch {}
              try { applyDayElimFromPayload(f, { out: null }); } catch {}
              try { renderCast(); } catch {}
              try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
            }
            f.draft = d;
            try { saveState(appState); } catch {}

            const candIdxs = Array.isArray(d.elimCandidatesByDay[f.day]) ? d.elimCandidatesByDay[f.day] : defenseList;
            const elimThreshold = defThreshold; // single-defendant: need majority to be out
            const isSingleDef = candIdxs.length === 1;

            if (!d.elimVotesByDay || typeof d.elimVotesByDay !== "object") d.elimVotesByDay = {};
            const saved = (d.elimVotesByDay && d.elimVotesByDay[f.day]) ? d.elimVotesByDay[f.day] : null;
            const maxVotes = Math.max(0, aliveIdxs.length - 1);
            const mkVoteOpts = (sel) => {
              const s = Math.max(0, Math.min(maxVotes, Math.floor(Number(sel || 0))));
              const out = [];
              for (let i = 0; i <= maxVotes; i++) out.push(`<option value="${i}" ${i === s ? "selected" : ""}>${i}</option>`);
              return out.join("");
            };

            const rows = candIdxs.map((idx) => {
              const val = saved && typeof saved[idx] === "number" ? saved[idx] : (saved && typeof saved[String(idx)] === "number" ? saved[String(idx)] : 0);
              const alive = (draw.players && draw.players[idx]) ? (draw.players[idx].alive !== false) : true;
              const st = alive ? "" : "opacity:.55; filter:saturate(.2);";
              const outTxt = alive ? "" : ` <span style="color:var(--muted); font-weight:900">(${escapeHtml(appLang === "fa" ? "خارج شد" : "out")})</span>`;
              return `
                <div style="display:grid; grid-template-columns: 1fr 120px; gap:10px; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.06); ${st}">
                  <div style="font-weight:1100">${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}${outTxt}</div>
                  <select id="fl_elim_${idx}">${mkVoteOpts(val)}</select>
                </div>
              `;
            }).join("");

            // compute current result from saved elimination votes (if any)
            const savedCounts = (saved && typeof saved === "object") ? saved : null;
            const leaders = savedCounts
              ? Object.keys(savedCounts)
                  .map((k) => ({ idx: parseInt(k, 10), v: Math.max(0, Math.floor(Number(savedCounts[k] || 0))) }))
                  .filter((x) => Number.isFinite(x.idx))
                  .sort((a, b) => (b.v - a.v) || (a.idx - b.idx))
              : [];
            const best = leaders.length ? leaders[0].v : 0;
            const top = (best > 0) ? leaders.filter((x) => x.v === best) : [];
            const picked = (d.elimPickedByDay && d.elimPickedByDay[f.day] !== undefined) ? d.elimPickedByDay[f.day] : null;
            const pickedIdx = (() => {
              const n = parseInt(String(picked ?? ""), 10);
              return Number.isFinite(n) ? n : null;
            })();
            // Fallback: if we have a saved draw event for today, use it (prevents losing the picked tie-winner).
            const pickedIdxFromEvent = (() => {
              try {
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_elim_draw" && Number(e.day) === Number(f.day));
                const p = ev && ev.data ? ev.data.picked : null;
                const n = parseInt(String(p ?? ""), 10);
                return Number.isFinite(n) ? n : null;
              } catch {
                return null;
              }
            })();
            const pickedIdxFinal = (pickedIdx !== null && Number.isFinite(pickedIdx))
              ? pickedIdx
              : (pickedIdxFromEvent !== null && top.some((x) => x.idx === pickedIdxFromEvent))
                ? pickedIdxFromEvent
                : null;
            // If we recovered from events, persist it.
            if ((pickedIdxFinal !== null) && (pickedIdx === null || !Number.isFinite(pickedIdx))) {
              try {
                d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
                d.elimPickedByDay[f.day] = pickedIdxFinal;
                f.draft = d;
                saveState(appState);
              } catch {}
            }
            const showActions = !!(top.length && best > 0);
            const showDraw = top.length > 1;
            const canOut = (top.length === 1) || (pickedIdxFinal !== null && Number.isFinite(pickedIdxFinal));

            // Inline "who was voted out" + Last Move (shown only when a single person is picked).
            const pickedOutIdx = (() => {
              try {
                if (isSingleDef) {
                  const only = candIdxs[0];
                  const v = savedCounts && (typeof savedCounts[only] === "number" || typeof savedCounts[String(only)] === "number")
                    ? (typeof savedCounts[only] === "number" ? savedCounts[only] : savedCounts[String(only)])
                    : 0;
                  const vv = Math.max(0, Math.floor(Number(v || 0)));
                  return (vv >= elimThreshold) ? only : null;
                }
                if (!showActions) return null;
                if (top.length === 1) return top[0].idx;
                if (pickedIdxFinal !== null && Number.isFinite(pickedIdxFinal)) return pickedIdxFinal;
                return null;
              } catch {
                return null;
              }
            })();
            const _scenarioCfg = getScenarioConfig(getScenario());
            const supportsLastMove = !!_scenarioCfg.features?.lastMove;
            const showLastMove = !!(pickedOutIdx !== null && supportsLastMove);
            const supportsEndCards = !!_scenarioCfg.features?.endCards;
            const endCardLine = (() => {
              try {
                if (!supportsEndCards) return "";
                if (pickedOutIdx === null || !Number.isFinite(Number(pickedOutIdx))) return "";

                const endCards = _scenarioCfg.eliminationCards || [];
                const labelFor = (id) => {
                  const c = endCards.find((x) => x.id === id);
                  if (!c) return String(id || "");
                  return appLang === "fa" ? c.fa : c.en;
                };
                if (!appState.god) appState.god = {};
                if (!appState.god.endCards || typeof appState.god.endCards !== "object") {
                  appState.god.endCards = { byDay: {} };
                }
                if (!appState.god.endCards.byDay || typeof appState.god.endCards.byDay !== "object") appState.god.endCards.byDay = {};
                const byDay = appState.god.endCards.byDay;
                const dayKey = String(f.day || 1);
                const existing = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
                // If day assignment exists but for a different player, reset it.
                if (existing && Number.isFinite(Number(existing.out)) && parseInt(existing.out, 10) !== parseInt(pickedOutIdx, 10)) {
                  delete byDay[dayKey];
                }
                let rec = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
                if (!rec || !rec.cardId) {
                  const picked = endCards[Math.floor(Math.random() * endCards.length)];
                  rec = { out: parseInt(pickedOutIdx, 10), cardId: picked.id, at: Date.now() };
                  byDay[dayKey] = rec;
                  saveState(appState);
                }
                const nm = names[pickedOutIdx] || t("common.playerN", { n: pickedOutIdx + 1 });
                const cardLabel = labelFor(rec.cardId);
                return `<div class="note" style="margin-top:10px; font-weight:950">${escapeHtml(t("tool.flow.endCards.for", { name: nm, card: cardLabel }))}</div>`;
              } catch {
                return "";
              }
            })();
            const tieLine = (() => {
              try {
                if (!showActions) return "";
                if (top.length <= 1) return "";
                if (pickedOutIdx !== null) return "";
                const tieNames = top.map((x) => `${names[x.idx] || t("common.playerN", { n: x.idx + 1 })} (${x.v})`);
                return `${t("tool.flow.elim.tie")}: ${t("tool.flow.elim.notChosenYet")} • ${tieNames.join(appLang === "fa" ? "، " : ", ")}`;
              } catch {
                return "";
              }
            })();

            const singleLine = (() => {
              try {
                if (!isSingleDef) return "";
                const only = candIdxs[0];
                const v = savedCounts && (typeof savedCounts[only] === "number" || typeof savedCounts[String(only)] === "number")
                  ? (typeof savedCounts[only] === "number" ? savedCounts[only] : savedCounts[String(only)])
                  : 0;
                const vv = Math.max(0, Math.floor(Number(v || 0)));
                if (vv >= elimThreshold) return "";
                return t("tool.flow.elim.single.notEnough", { c: vv, n: elimThreshold });
              } catch {
                return "";
              }
            })();
            const lastMoveUi = (() => {
              if (!showLastMove) return "";
              try {
                const lastMoveCards = _scenarioCfg.eliminationCards || [];
                const labelFor = (id) => {
                  const c = lastMoveCards.find((x) => x.id === id);
                  if (!c) return String(id || "");
                  return appLang === "fa" ? c.fa : c.en;
                };
                if (!appState.god.lastMove || typeof appState.god.lastMove !== "object") {
                  appState.god.lastMove = { last: null, at: null, used: [] };
                } else {
                  if (!Array.isArray(appState.god.lastMove.used)) appState.god.lastMove.used = [];
                }
                const used = new Set(appState.god.lastMove.used || []);
                const remaining = lastMoveCards.filter((c) => !used.has(c.id));
                const lastId = appState.god.lastMove && appState.god.lastMove.last ? appState.god.lastMove.last : null;
                const last = lastId ? labelFor(lastId) : null;
                const listHtml = lastMoveCards.map((c) => {
                  const isUsed = used.has(c.id);
                  const txt = labelFor(c.id);
                  const st = isUsed ? 'opacity:.45; filter:saturate(.2); text-decoration:line-through;' : '';
                  return `<div style="padding:6px 0;font-weight:950;${st}">${escapeHtml(txt)}</div>`;
                }).join("");
                return `
                  <div style="height:12px"></div>
                  <div style="font-weight:1100">${escapeHtml(t("tool.flow.outcome.lastMove"))}</div>
                  <div style="height:8px"></div>
                  <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px; background: rgba(17,24,36,.25); max-height: 34vh; overflow:auto; -webkit-overflow-scrolling: touch;">
                    <div style="font-weight:1100;margin-bottom:8px">${escapeHtml(t("tool.lastMove.header"))}</div>
                    ${listHtml}
                  </div>
                  <div style="height:10px"></div>
                  <button class="btn primary" id="lm_draw_elim" type="button" ${remaining.length ? "" : "disabled"}>${escapeHtml(t("tool.lastMove.draw"))}</button>
                  <div class="note" id="lm_note_elim" style="${remaining.length ? "display:none" : "display:block"}; margin-top:10px">${escapeHtml(remaining.length ? "" : t("tool.lastMove.allUsed"))}</div>
                  <div style="height:10px"></div>
                  <div style="font-weight:1100">${escapeHtml(t("tool.lastMove.result"))} <span id="lm_res_elim">${last ? escapeHtml(last) : "—"}</span></div>
                `;
              } catch {
                return "";
              }
            })();

            const researcherChainLine = (() => {
              try {
                if (pickedOutIdx === null || !Number.isFinite(pickedOutIdx)) return "";
                const votedOutPlayer = draw.players[pickedOutIdx];
                if (!votedOutPlayer || votedOutPlayer.roleId !== "researcher") return "";
                const prevNightKey = String((f.day || 1) - 1);
                const prevNightActions = (d.nightActionsByNight && d.nightActionsByNight[prevNightKey]) ? d.nightActionsByNight[prevNightKey] : null;
                if (!prevNightActions) return "";
                const linkedIdxRaw = prevNightActions.researcherLink;
                const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                if (linkedIdx === null || !draw.players[linkedIdx]) return "";
                const linkedPlayer = draw.players[linkedIdx];
                const linkedRoleId = linkedPlayer.roleId || "citizen";
                const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                if (linkedTeamFa !== "مافیا" || linkedRoleId === "mafiaBoss") return "";
                const linkedName = names[linkedIdx] || t("common.playerN", { n: linkedIdx + 1 });
                const msg = appLang === "fa"
                  ? `⚠ ${linkedName} (که محقق با او لینک داشت) نیز از بازی خارج می‌شود.`
                  : `⚠ ${linkedName} (linked to Researcher) is also eliminated.`;
                return `<div class="note" style="margin-top:8px; font-weight:950">${escapeHtml(msg)}</div>`;
              } catch {
                return "";
              }
            })();

            body = `
              <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.elim.hint"))}</div>
              <div style="height:8px"></div>
              <div class="note">${escapeHtml(t("tool.flow.defense.threshold", { n: defThreshold, v: eligibleVoters }))}</div>
              ${isSingleDef ? `<div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.elim.single.need", { n: elimThreshold, v: eligibleVoters }))}</div>` : ``}
              <div style="margin-top:10px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,.08)">
                <div class="timerCard" style="max-width:none">
                  <div class="tname">${escapeHtml(t("tool.timer.defense"))}</div>
                  <div class="tval clickable" id="tm_defense">${formatMMSS(_tmrE.remaining.defense ?? _tmrE.defense)}</div>
                  <div style="display:flex; gap:6px; justify-content:center; align-items:center">
                    <button class="tbtn" id="tm_btn_defense" type="button" aria-label="Play/Pause"></button>
                    <button class="tbtn reset" id="tm_rst_defense" type="button" aria-label="Reset"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg></button>
                  </div>
                </div>
              </div>
              <div style="height:10px"></div>
              <div style="display:flex; align-items:baseline; justify-content:flex-end; gap:10px">
                <div style="color:var(--muted); font-weight:900; font-size:12px">${escapeHtml(t("tool.flow.elim.votes"))}</div>
              </div>
              <div style="height:6px"></div>
              <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px; background: rgba(17,24,36,.25); max-height: 46vh; overflow:auto; -webkit-overflow-scrolling: touch;">
                ${(dayCounts || Array.isArray(d.voteCandidatesByDay && d.voteCandidatesByDay[f.day]))
                  ? (rows || `<div style="color:var(--muted); font-weight:900">${escapeHtml(t("tool.flow.elim.noCandidates"))}</div>`)
                  : `<div style="color:var(--muted); font-weight:900">${escapeHtml(t("tool.flow.defense.needVotes"))}</div>`}
              </div>
              <div style="height:10px"></div>

              <div class="actions" id="fl_elim_actions" style="margin-top:10px; ${showActions ? "display:flex" : "display:none"}; justify-content:flex-start; gap:10px">
                <button class="btn" id="fl_elim_draw" type="button" style="${showDraw ? "" : "display:none"}">${escapeHtml(t("tool.flow.elim.draw"))}</button>
              </div>
              <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,.08)">
                ${pickedOutIdx !== null
                  ? `<div id="fl_elim_result_line" class="note" style="font-weight:950">${escapeHtml(t("tool.flow.outcome.votedOut"))} <b>${escapeHtml(names[pickedOutIdx] || t("common.playerN", { n: pickedOutIdx + 1 }))}</b></div>`
                  : (tieLine
                      ? `<div id="fl_elim_result_line" class="note" style="font-weight:950">${escapeHtml(tieLine)}</div>`
                      : (singleLine
                          ? `<div id="fl_elim_result_line" class="note" style="font-weight:950">${escapeHtml(singleLine)}</div>`
                          : `<div id="fl_elim_result_line" class="note" style="font-weight:950">${escapeHtml(t("tool.flow.outcome.none"))}</div>`))}
                ${endCardLine}
                ${researcherChainLine}
                ${lastMoveUi}
              </div>
            `;
          } else if (cur.id === "night_run") {
            const d = f.draft || {};
            const evenNight = ((f.day || 1) % 2 === 0);
            const nightKey = String(f.day || 1);
            // Load saved actions for this night: prefer per-night draft, fallback to latest event.
            if (!d.nightActionsByNight || typeof d.nightActionsByNight !== "object") d.nightActionsByNight = {};
            const savedNight = (() => {
              try {
                const byNight = (d.nightActionsByNight && d.nightActionsByNight[nightKey]) ? d.nightActionsByNight[nightKey] : null;
                if (byNight && typeof byNight === "object") return byNight;
              } catch {}
              try {
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
                if (ev && ev.data && typeof ev.data === "object") return ev.data;
              } catch {}
              return {};
            })();
            // Who is disabled by the Magician this night?
            const disabledPlayerIdx = (() => {
              try {
                const v = savedNight.magicianDisable;
                if (v === null || v === undefined || v === "") return null;
                const n = parseInt(v, 10);
                return Number.isFinite(n) ? n : null;
              } catch { return null; }
            })();
            // Helper to find a player's index by roleId(s)
            const findRolePlayerIdx = (roleIds) => {
              const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
              for (let i = 0; i < (draw.players || []).length; i++) {
                const p = draw.players[i];
                if (p && ids.includes(p.roleId)) return i;
              }
              return null;
            };
            const disabledNote = (appLang === "fa")
              ? "این نقش در این شب توسط شعبده‌باز غیرفعال است."
              : "This role is disabled this night by the Magician.";

            // Options for targeting alive players, but keep the selected value visible even if they died
            // due to an immediately-applied action (e.g., Mafia shot).
            const mkAliveOptsSel = (sel) => {
              const sIdx = (sel === null || sel === undefined || sel === "") ? null : parseInt(sel, 10);
              const s = (sIdx === null || !Number.isFinite(sIdx)) ? "" : String(sIdx);
              const base = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
              for (const idx of aliveIdxs) {
                const v = String(idx);
                base.push(`<option value="${v}" ${v === s ? "selected" : ""}>${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</option>`);
              }
              // If selected is not currently alive, still show it (muted/out) so UI retains the choice.
              if (s !== "" && !aliveIdxs.includes(sIdx) && draw.players && draw.players[sIdx]) {
                const nm = names[sIdx] || t("common.playerN", { n: sIdx + 1 });
                const outTxt = appLang === "fa" ? " (خارج شد)" : " (out)";
                base.push(`<option value="${s}" selected>${escapeHtml(nm + outTxt)}</option>`);
              }
              return base.join("");
            };

            // Gunslinger support (give guns)
            const gunnerIdxs = (draw.players || [])
              .map((p, idx) => (p && p.roleId === "gunslinger" && p.alive !== false) ? idx : null)
              .filter((x) => x !== null);
            const showGunner = !!gunnerIdxs.length;
            const gunnerIdx = showGunner ? gunnerIdxs[0] : null;
            const gunnerName = (gunnerIdx !== null && Number.isFinite(gunnerIdx))
              ? (names[gunnerIdx] || t("common.playerN", { n: gunnerIdx + 1 }))
              : "—";
            const guns = f.guns || {};
            const givenCount = Object.keys(guns || {}).length;
            if (!d.nightGunGivesByNight || typeof d.nightGunGivesByNight !== "object") d.nightGunGivesByNight = {};
            const nightGives = Array.isArray(d.nightGunGivesByNight[nightKey]) ? d.nightGunGivesByNight[nightKey] : [];
            const nightGiveCount = nightGives.length;
            const nightRealCount = nightGives.filter((x) => x && x.type === "real").length;

            const noActionTxt = (appLang === "fa")
              ? "اکشنی برای ثبت ندارد."
              : "No action to record.";

            const sectionFor = (wakeLabel) => {
              const k = normWake(wakeLabel);
              // Config-driven disable: look up roleIds for this wake key, find the player,
              // then check roles[roleId].canBeDisabled against disabledPlayerIdx.
              const wakeToRoleIds = {
                doctor: ["doctor", "watson"],
                lecter: ["doctorLecter"],
                detective: ["detective"],
                professional: ["professional", "leon"],
                bomber: ["bomber"],
                zodiac: ["zodiac"],
                gunslinger: ["gunslinger"],
                ocean: ["ocean"],
                jokermaf: ["jokerMafia"],
                swindler: ["swindler"],
                researcher: ["researcher"],
                natasha: ["natasha"],
                sniper: ["sniper"],
                negotiator: ["negotiator"],
                kadkhoda: ["kadkhoda"],
                reporter: ["reporter"],
                representative: ["representative"],
                nato: ["nato"],
                hacker: ["hacker"],
                guide: ["guide"],
                bodyguard: ["bodyguard"],
                minemaker: ["minemaker"],
                lawyer: ["lawyer"],
              };
              const sectionRoleIds = wakeToRoleIds[k] || [k];
              const sectionPlayerIdx = findRolePlayerIdx(sectionRoleIds);
              const sectionRoleId = (sectionPlayerIdx !== null && draw.players && draw.players[sectionPlayerIdx])
                ? draw.players[sectionPlayerIdx].roleId : null;
              const sectionDisabled = sectionPlayerIdx !== null
                && sectionPlayerIdx === disabledPlayerIdx
                && !!(sectionRoleId && roles[sectionRoleId] && roles[sectionRoleId].canBeDisabled);
              const sectionDisabledStyle = sectionDisabled ? "opacity:.4; pointer-events:none;" : "";

              if (k === "mafia") {
                // Check if NATO player is present and alive (NATO wakes with Mafia in some scenarios).
                const natoPlayerIdx = (() => {
                  for (let i = 0; i < (draw.players || []).length; i++) {
                    const p = draw.players[i];
                    if (p && p.roleId === "nato" && p.alive !== false) return i;
                  }
                  return null;
                })();
                // natoUsedNight: tracks which night NATO used its guess. Only locked out on OTHER nights.
                const _natoCurrentNight = f.day || 1;
                const _natoUsedNight = (d && d.natoUsedNight != null) ? Number(d.natoUsedNight) : null;
                const natoUsedNow = _natoUsedNight !== null && _natoUsedNight !== _natoCurrentNight;
                // Role select: all roles assigned in this game, deduplicated.
                const mkNatoRoleOpts = (savedRoleId) => {
                  const saved = String(savedRoleId || "");
                  const seen = new Set();
                  const opts = [`<option value="" ${saved === "" ? "selected" : ""}>—</option>`];
                  for (const p of (draw.players || [])) {
                    if (!p || !p.roleId) continue;
                    const rid = String(p.roleId);
                    if (seen.has(rid)) continue;
                    seen.add(rid);
                    const fa = (roles[rid] && roles[rid].faName) ? roles[rid].faName : rid;
                    const en = (typeof ROLE_I18N !== "undefined" && ROLE_I18N[rid] && ROLE_I18N[rid].name) ? ROLE_I18N[rid].name : fa;
                    opts.push(`<option value="${escapeHtml(rid)}" ${rid === saved ? "selected" : ""}>${escapeHtml(appLang === "fa" ? fa : en)}</option>`);
                  }
                  return opts.join("");
                };
                const natoBlock = natoPlayerIdx !== null ? `
                  <div style="height:10px"></div>
                  <div style="font-weight:1100; border-top:1px solid rgba(255,255,255,.15); padding-top:10px">${escapeHtml(appLang === "fa" ? "ناتو — حدس نقش (یک‌بار در کل بازی)" : "NATO — Role Guess (once per game)")}</div>
                  ${natoUsedNow ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? "ناتو قبلاً از قابلیت حدس نقش استفاده کرده است." : "NATO already used the role-guess ability.")}</div>` : `
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "می‌تواند به‌جای شلیک، نقش دقیق یک نفر را حدس بزند. درست → خارج / غلط → هیچ." : "Can guess one player's exact role instead of shooting. Correct → out / Wrong → nothing.")}</div>
                  <div style="height:6px"></div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف حدس ناتو" : "NATO guess target")}
                    <select id="fl_nato_target">${mkAliveOptsSel(savedNight.natoTarget)}</select>
                  </label>
                  <label style="margin-top:6px">${escapeHtml(appLang === "fa" ? "نقش حدس‌زده شده" : "Guessed role")}
                    <select id="fl_nato_role_guess">${mkNatoRoleOpts(savedNight.natoRoleGuess)}</select>
                  </label>
                  `}
                ` : "";
                return `
                  <label>${escapeHtml(t("tool.flow.action.mafiaShot"))}
                    <select id="fl_mafia_shot">${mkAliveOptsSel(savedNight.mafiaShot)}</select>
                  </label>
                  ${natoBlock}
                `;
              }
              if (k === "professional") {
                return `
                  <label>${escapeHtml(t("tool.flow.action.professionalShot"))}
                    <select id="fl_pro_shot" style="${sectionDisabledStyle}">${mkAliveOptsSel(savedNight.professionalShot)}</select>
                  </label>
                  ${sectionDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                `;
              }
              if (k === "detective") {
                const detDisabled = sectionDisabled;
                // Show last saved detective result (per night/day) if present
                const key = String(f.day || 1);
                const dr = (d && d.detectiveResultByNight && d.detectiveResultByNight[key]) ? d.detectiveResultByNight[key] : null;
                const resultLine = (() => {
                  if (detDisabled) {
                    // Disabled detective always gets a forced negative result
                    const thumb = "👎";
                    const label = (appLang === "fa") ? "شهروند" : "Citizen";
                    const pre = (appLang === "fa") ? "نتیجه استعلام: " : "Result: ";
                    return `${pre}${thumb} ${label}`;
                  }
                  if (!dr || dr.isMafia === undefined || dr.isMafia === null) return "";
                  const isM = !!dr.isMafia;
                  const thumb = isM ? "👍" : "👎";
                  const label = (appLang === "fa")
                    ? (isM ? "مافیا" : "شهروند")
                    : (isM ? "Mafia" : "Citizen");
                  const pre = (appLang === "fa") ? "نتیجه استعلام: " : "Result: ";
                  return `${pre}${thumb} ${label}`;
                })();
                return `
                  <label>${escapeHtml(t("tool.flow.action.detectiveQuery"))}
                    <select id="fl_det_query" style="${sectionDisabledStyle}">${mkAliveOptsSel(savedNight.detectiveQuery)}</select>
                  </label>
                  <div id="fl_det_result" class="note" style="margin-top:6px; ${resultLine ? "" : "display:none"}">${escapeHtml(resultLine || "")}</div>
                  ${detDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                `;
              }
              if (k === "doctor") {
                return `
                  <label>${escapeHtml(t("tool.flow.action.doctorSave"))}
                    <select id="fl_doctor_save" style="${sectionDisabledStyle}">${mkAliveOptsSel(savedNight.doctorSave)}</select>
                  </label>
                  ${sectionDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                `;
              }
              if (k === "bomber") {
                const mkCodeOpts = (sel) => {
                  const s = String(sel ?? "").trim();
                  const opts = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (let i = 1; i <= 4; i++) {
                    const v = String(i);
                    opts.push(`<option value="${v}" ${s === v ? "selected" : ""}>${v}</option>`);
                  }
                  return opts.join("");
                };
                return `
                  <label>${escapeHtml(t("tool.flow.action.bomber"))}
                    <select id="fl_bomb_target" style="${sectionDisabledStyle}">${mkAliveOptsSel(savedNight.bombTarget)}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.bombCode"))}
                    <select id="fl_bomb_code" style="${sectionDisabledStyle}">${mkCodeOpts((savedNight.bombCode != null ? savedNight.bombCode : d.bombCode) || "")}</select>
                  </label>
                  <div class="note" id="fl_bomb_code_note" style="display:none; margin-top:6px; color: rgba(255,92,116,.95); font-weight:950"></div>
                  ${sectionDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                `;
              }
              if (k === "magician") {
                return `
                  <label>${escapeHtml(t("tool.flow.action.magicianDisable"))}
                    <select id="fl_magician_disable">${mkAliveOptsSel(savedNight.magicianDisable)}</select>
                  </label>
                `;
              }
              if (k === "zodiac") {
                // Keep native disabled only for the even-night restriction; use visual styling for the Magician disable.
                return `
                  <label>${escapeHtml(t("tool.flow.action.zodiacShot"))} ${evenNight ? "" : `<span style="color:var(--muted); font-weight:900">(even nights only)</span>`}
                    <select id="fl_zodiac_shot" ${evenNight ? "" : "disabled"} style="${sectionDisabledStyle}">${mkAliveOptsSel(savedNight.zodiacShot)}</select>
                  </label>
                  ${sectionDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                `;
              }
              if (k === "ocean") {
                const nightKey = String(f.day || 1);
                // Ocean team is PERSISTENT across nights (members stay on the team permanently).
                // d.oceanTeam = full accumulated team; max 2 members can be added total per game.
                if (!d.oceanTeam || !Array.isArray(d.oceanTeam)) d.oceanTeam = [];
                if (!d.oceanWakeByNight || typeof d.oceanWakeByNight !== "object") d.oceanWakeByNight = {};
                const teamArr = d.oceanTeam.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x));
                const selectedSet = new Set(teamArr);
                // This night's newly added members (for bad-pick check and payload).
                const thisNightAdds = Array.isArray(d.oceanWakeByNight[nightKey])
                  ? d.oceanWakeByNight[nightKey].map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x))
                  : [];
                const canAdd = teamArr.length < 2;
                const quotaText = appLang === "fa"
                  ? `(${teamArr.length} از ۲ انتخاب استفاده شده)`
                  : `(${teamArr.length} of 2 picks used)`;
                const oceanResultLine = (() => {
                  try {
                    if (!thisNightAdds.length) return "";
                    let bad = false;
                    for (const tidx of thisNightAdds) {
                      const tr = (draw.players && draw.players[tidx] && draw.players[tidx].roleId) ? draw.players[tidx].roleId : "citizen";
                      const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                      if (teamFa === "مافیا" || tr === "zodiac") { bad = true; break; }
                    }
                    return `<div class="note" style="margin-top:6px">${escapeHtml(t(bad ? "tool.flow.ocean.result.bad" : "tool.flow.ocean.result.good"))}</div>`;
                  } catch { return ""; }
                })();
                const oceanPickOpts = [`<option value="">—</option>`].concat(
                  aliveIdxs
                    .filter((idx) => !selectedSet.has(idx))
                    .map((idx) => `<option value="${idx}">${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</option>`)
                ).join("");
                const oceanList = teamArr.length
                  ? teamArr.map((idx) => {
                      const nm = names[idx] || t("common.playerN", { n: idx + 1 });
                      const addedThisNight = thisNightAdds.includes(idx);
                      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 0">
                        <div style="font-weight:950">${escapeHtml(nm)}${addedThisNight ? "" : ` <span style="color:var(--muted); font-weight:800; font-size:11px">(${escapeHtml(appLang === "fa" ? "از شب قبل" : "prev. night")})</span>`}</div>
                        ${addedThisNight ? `<button class="btn" type="button" data-ocean-rm="${idx}" style="padding:6px 10px; font-size:12px">${escapeHtml(t("tool.flow.ocean.remove"))}</button>` : ""}
                      </div>`;
                    }).join("")
                  : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "کسی انتخاب نشده است." : "No one selected.")}</div>`;
                // Payload carries only this night's new picks for the bad-pick check.
                const oceanHidden = thisNightAdds.map(String).join(",");
                return `
                  ${sectionDisabled ? `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                  <div style="${sectionDisabledStyle}">
                    <div style="font-weight:1100">${escapeHtml(t("tool.flow.ocean.team"))} <span style="color:var(--muted); font-size:12px; font-weight:800">${escapeHtml(quotaText)}</span></div>
                    <div style="height:6px"></div>
                    ${oceanList}
                    ${canAdd ? `
                    <div style="height:10px"></div>
                    <div class="row one">
                      <label>${escapeHtml(t("tool.flow.ocean.pick"))}
                        <select id="fl_ocean_pick">${oceanPickOpts}</select>
                      </label>
                    </div>
                    <div style="height:10px"></div>
                    <button class="btn" id="fl_ocean_add" type="button">${escapeHtml(t("tool.flow.ocean.add"))}</button>
                    ` : `<div class="note" style="margin-top:8px">${escapeHtml(appLang === "fa" ? "سقف ۲ انتخاب مصرف شده — اوشن نمی‌تواند عضو جدید اضافه کند." : "2-pick limit reached — Ocean cannot add more members.")}</div>`}
                    <input id="fl_ocean_wake" type="hidden" value="${escapeHtml(oceanHidden)}" />
                    ${oceanResultLine}
                  </div>
                `;
              }
              if (k === "kane") {
                return `
                  <label>${escapeHtml(t("tool.flow.action.kaneMark"))}
                    <select id="fl_kane_mark">${mkAliveOptsSel(savedNight.kaneMark)}</select>
                  </label>
                `;
              }
              if (k === "constantine") {
                const deadIdxs = (draw.players || [])
                  .map((p, idx) => (p && p.alive === false) ? idx : null)
                  .filter((x) => x !== null);
                const optsDeadSel = (sel) => {
                  const sIdx = (sel === null || sel === undefined || sel === "") ? null : parseInt(sel, 10);
                  const s = (sIdx === null || !Number.isFinite(sIdx)) ? "" : String(sIdx);
                  const base = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (const idx of deadIdxs) {
                    const v = String(idx);
                    base.push(`<option value="${v}" ${v === s ? "selected" : ""}>${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</option>`);
                  }
                  return base.join("");
                };
                return `
                  <label>${escapeHtml(t("tool.flow.action.constantineRevive"))}
                    <select id="fl_const_revive">${optsDeadSel(savedNight.constantineRevive)}</select>
                  </label>
                  ${deadIdxs.length ? `` : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "کسی برای برگرداندن نیست." : "No one to revive.")}</div>`}
                `;
              }
              if (k === "nostradamus") {
                const savedArr = Array.isArray(savedNight.nostPick3) ? savedNight.nostPick3 : [];
                const cleanArr = savedArr.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x));
                const selSet = new Set(cleanArr);
                const allIdxs = (draw.players || []).map((_, i) => i);
                const pickOpts = [`<option value="">—</option>`].concat(
                  allIdxs
                    .filter((idx) => !selSet.has(idx))
                    .map((idx) => {
                      const p = draw.players[idx];
                      const nm = names[idx] || t("common.playerN", { n: idx + 1 });
                      const alive = p && p.alive !== false;
                      const outTxt = alive ? "" : (appLang === "fa" ? " (خارج شد)" : " (out)");
                      return `<option value="${idx}">${escapeHtml(nm + outTxt)}</option>`;
                    })
                ).join("");
                const listHtml = cleanArr.length
                  ? cleanArr.map((idx) => {
                      const p = draw.players[idx];
                      const nm = names[idx] || t("common.playerN", { n: idx + 1 });
                      const alive = p && p.alive !== false;
                      const outTxt = alive ? "" : (appLang === "fa" ? " (خارج شد)" : " (out)");
                      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 0">
                        <div style="font-weight:950">${escapeHtml(nm + outTxt)}</div>
                        <button class="btn" type="button" data-nost-rm="${idx}" style="padding:6px 10px; font-size:12px">${escapeHtml(t("tool.flow.ocean.remove"))}</button>
                      </div>`;
                    }).join("")
                  : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "کسی انتخاب نشده است." : "No one selected.")}</div>`;
                const hid = cleanArr.join(",");
                // Show saved mafia-count result if picks were confirmed
                const nostNightKey = String(f.day || 1);
                const nostRes = (d && d.nostResultByNight && d.nostResultByNight[nostNightKey]) ? d.nostResultByNight[nostNightKey] : null;
                const nostResultLine = (() => {
                  if (!nostRes || nostRes.mafiaCount === undefined || nostRes.mafiaCount === null) return "";
                  const mc = nostRes.mafiaCount;
                  return appLang === "fa"
                    ? `نتیجه: ${mc} نفر از این ۳ نفر مافیا هستند.`
                    : `Result: ${mc} of the 3 are Mafia.`;
                })();
                return `
                  <div style="font-weight:1100">${escapeHtml(t("tool.flow.action.nostPick3"))}</div>
                  <div style="height:6px"></div>
                  ${listHtml}
                  <div style="height:10px"></div>
                  <div class="row one">
                    <label>${escapeHtml(t("tool.flow.ocean.pick"))}
                      <select id="fl_nost_pick">${pickOpts}</select>
                    </label>
                  </div>
                  <div style="height:10px"></div>
                  <button class="btn" id="fl_nost_add" type="button" ${cleanArr.length >= 3 ? "disabled" : ""}>${escapeHtml(appLang === "fa" ? "اضافه کردن" : "Add")}</button>
                  <input id="fl_nost_pick3" type="hidden" value="${escapeHtml(hid)}" />
                  <div id="fl_nost_result" class="note" style="margin-top:6px; ${nostResultLine ? "" : "display:none"}">${escapeHtml(nostResultLine)}</div>
                `;
              }
              if (k === "heir") {
                const allIdxs = (draw.players || []).map((_, i) => i);
                const optsAllSel = (sel) => {
                  const sIdx = (sel === null || sel === undefined || sel === "") ? null : parseInt(sel, 10);
                  const s = (sIdx === null || !Number.isFinite(sIdx)) ? "" : String(sIdx);
                  const base = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (const idx of allIdxs) {
                    const p = draw.players[idx];
                    const nm = names[idx] || t("common.playerN", { n: idx + 1 });
                    const alive = p && p.alive !== false;
                    const outTxt = alive ? "" : (appLang === "fa" ? " (خارج شد)" : " (out)");
                    const v = String(idx);
                    base.push(`<option value="${v}" ${v === s ? "selected" : ""}>${escapeHtml(nm + outTxt)}</option>`);
                  }
                  return base.join("");
                };
                return `
                  <label>${escapeHtml(t("tool.flow.action.heirPick"))} ${f.day === 1 ? `` : `<span style="color:var(--muted); font-weight:900">(${escapeHtml(t("tool.flow.action.heirIntroOnly"))})</span>`}
                    <select id="fl_heir_pick" ${f.day === 1 ? "" : "disabled"}>${optsAllSel(savedNight.heirPick)}</select>
                  </label>
                `;
              }
              if (k === "herbalist") {
                // Two-night mechanic: poison on Night X, antidote decision on Night X+1.
                const herbPrevKey = String((f.day || 1) - 1);
                const herbPrevActions = (d && d.nightActionsByNight && d.nightActionsByNight[herbPrevKey]) ? d.nightActionsByNight[herbPrevKey] : null;
                const herbPrevPoisonRaw = herbPrevActions ? herbPrevActions.herbalistPoison : null;
                const herbPrevPoison = (herbPrevPoisonRaw !== null && herbPrevPoisonRaw !== undefined && Number.isFinite(parseInt(herbPrevPoisonRaw, 10)))
                  ? parseInt(herbPrevPoisonRaw, 10) : null;
                const herbCycleDone = !!(d && d.herbalistCycleComplete);

                if (herbPrevPoison !== null) {
                  // Antidote night: previous night had a poison — show antidote decision only.
                  const poisonedName = names[herbPrevPoison] || t("common.playerN", { n: herbPrevPoison + 1 });
                  const savedAnt = (savedNight.herbalistAntidote === null || savedNight.herbalistAntidote === undefined) ? null : parseInt(savedNight.herbalistAntidote, 10);
                  const antOpts = [
                    `<option value="" ${savedAnt === null ? "selected" : ""}>— (${escapeHtml(appLang === "fa" ? "بدون پادزهر — بازیکن حذف می‌شود" : "no antidote — player eliminated")})</option>`,
                    `<option value="${herbPrevPoison}" ${savedAnt === herbPrevPoison ? "selected" : ""}>${escapeHtml(poisonedName + (appLang === "fa" ? " — پادزهر بده" : " — give antidote"))}</option>`,
                  ].join("");
                  return `
                    <div class="note" style="margin-bottom:8px">${escapeHtml(appLang === "fa" ? `مسموم شده (شب قبل): ${poisonedName}` : `Poisoned last night: ${poisonedName}`)}</div>
                    <label>${escapeHtml(appLang === "fa" ? "تصمیم عطار (پادزهر؟)" : "Herbalist — antidote decision")}
                      <select id="fl_herb_antidote">${antOpts}</select>
                    </label>
                  `;
                } else if (herbCycleDone) {
                  // One poison + one antidote used — abilities exhausted.
                  return `<div class="note">${escapeHtml(appLang === "fa" ? "عطار هر دو توانایی خود را استفاده کرده است." : "Herbalist has used both abilities (poison + antidote) for this game.")}</div>`;
                } else {
                  // Poison night: no active poison — show poison picker.
                  return `
                    <label>${escapeHtml(t("tool.flow.action.herbalistPoison"))}
                      <select id="fl_herb_poison">${mkAliveOptsSel(savedNight.herbalistPoison)}</select>
                    </label>
                  `;
                }
              }
              if (k === "armorsmith") {
                const armorIdx = (() => {
                  try {
                    for (let i = 0; i < (draw.players || []).length; i++) {
                      const p = draw.players[i];
                      if (p && p.roleId === "armorsmith" && p.alive !== false) return i;
                    }
                  } catch {}
                  return null;
                })();
                const selfUsed = !!(d && d.armorsmithSelfUsed);
                const sIdx = (savedNight.armorsmithArmor === null || savedNight.armorsmithArmor === undefined) ? null : parseInt(savedNight.armorsmithArmor, 10);
                const optsArmor = (() => {
                  const s = (sIdx === null || !Number.isFinite(sIdx)) ? "" : String(sIdx);
                  const base = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (const idx of aliveIdxs) {
                    const v = String(idx);
                    const isSelf = (armorIdx !== null && idx === armorIdx);
                    const dis = (isSelf && selfUsed && v !== s) ? "disabled" : "";
                    base.push(`<option value="${v}" ${v === s ? "selected" : ""} ${dis}>${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</option>`);
                  }
                  return base.join("");
                })();
                return `
                  <label>${escapeHtml(t("tool.flow.action.armorsmithArmor"))}
                    <select id="fl_armor_target">${optsArmor}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.action.armorsmith.selfOnce"))}</div>
                `;
              }
              if (k === "lecter") {
                return `
                  <label>${escapeHtml(appLang === "fa" ? "نجاتِ دکتر لکتر" : "Dr. Lecter save")}
                    <select id="fl_lecter_save">${mkAliveOptsSel(savedNight.lecterSave)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "دکتر لکتر می‌تواند یک نفر را از شلیک مافیا نجات دهد." : "Dr. Lecter can save one player from the mafia shot.")}</div>
                `;
              }
              if (k === "jokermaf") {
                const currentNightNum = f.day || 1;
                const jokerUsedArr = (Array.isArray(d.jokerUsed) ? d.jokerUsed : []).filter((n) => Number(n) !== currentNightNum);
                const jokerUsedCount = jokerUsedArr.length;
                const jokerRemaining = Math.max(0, 2 - jokerUsedCount);
                const quotaText = appLang === "fa"
                  ? `(${jokerUsedCount} از ۲ بار استفاده شده — ${jokerRemaining} بار باقی‌مانده)`
                  : `(${jokerUsedCount} of 2 uses — ${jokerRemaining} remaining)`;
                return `
                  <div class="note">${escapeHtml(quotaText)}</div>
                  ${jokerRemaining > 0 ? `
                  <div style="height:6px"></div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف جوکر (برعکس‌کردن استعلام)" : "Joker target (flip inquiry)")}
                    <select id="fl_joker_target">${mkAliveOptsSel(savedNight.jokerTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "استعلام کارآگاه از این نفر، همان شب برعکس می‌شود." : "Detective inquiry on this player is flipped this night.")}</div>
                  ` : `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? "جوکر مافیا هر دو بار را استفاده کرده است — دیگر قابلیت ندارد." : "Joker Mafia used both flips — no more uses.")}</div>`}
                `;
              }
              if (k === "swindler") {
                return `
                  <label>${escapeHtml(appLang === "fa" ? "هدف شیاد (برهم‌زنِ استعلام)" : "Swindler target (disrupt inquiry)")}
                    <select id="fl_swindler_target">${mkAliveOptsSel(savedNight.swindlerTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "اگر کارآگاه این نفر را استعلام کند، نتیجه «شهروند» نمایش می‌یابد." : "If Detective queries this player, the result shows as 'Citizen'.")}</div>
                `;
              }
              if (k === "researcher") {
                const isIntroNight = (f.day || 1) === 1;
                return `
                  <label>${escapeHtml(appLang === "fa" ? "گره محقق (لینک)" : "Researcher link")} ${isIntroNight ? `<span style="color:var(--muted); font-weight:900">(${escapeHtml(appLang === "fa" ? "شب معارفه — محقق لینک نمی‌زند" : "intro night — no link")})</span>` : ""}
                    <select id="fl_researcher_link" ${isIntroNight ? "disabled" : ""}>${mkAliveOptsSel(savedNight.researcherLink)}</select>
                  </label>
                  ${isIntroNight ? "" : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "اگر محقق با شات شب یا رأی از بازی خارج شود، نفر لینک‌شده هم معمولاً خارج می‌شود (به‌جز رئیس مافیا)." : "If Researcher is eliminated, the linked player usually goes too (except Mafia Boss).")}</div>`}
                `;
              }
              if (k === "natasha") {
                return `
                  <label>${escapeHtml(appLang === "fa" ? "هدف سکوت ناتاشا" : "Natasha silence target")}
                    <select id="fl_natasha_target">${mkAliveOptsSel(savedNight.natashaTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "این بازیکن فردا نمی‌تواند صحبت کند (معمولاً تکرار پشت‌سرهم ممنوع)." : "This player cannot speak tomorrow (usually can't be repeated consecutively).")}</div>
                `;
              }
              if (k === "sniper") {
                const sniperUsed = (() => {
                  try {
                    const currentNightKey = String(f.day || 1);
                    const byNight = d.nightActionsByNight && typeof d.nightActionsByNight === "object" ? d.nightActionsByNight : {};
                    for (const nk of Object.keys(byNight)) {
                      if (nk === currentNightKey) continue; // current night can still change
                      const n = byNight[nk];
                      if (n && n.sniperShot !== null && n.sniperShot !== undefined && Number.isFinite(Number(n.sniperShot))) return true;
                    }
                  } catch {}
                  return false;
                })();
                const sniperNote = sniperUsed
                  ? (appLang === "fa" ? "تک‌تیرانداز تیرش را قبلاً استفاده کرده است." : "Sniper already used their shot.")
                  : (appLang === "fa" ? "تک‌تیرانداز فقط یک تیر دارد. اگر به شهروند شلیک کند، خودش کشته می‌شود." : "Sniper has one shot. Shooting a Citizen eliminates the Sniper.");
                return `
                  <div class="note" style="margin-top:2px">${escapeHtml(sniperNote)}</div>
                  ${!sniperUsed ? `
                  <div style="height:6px"></div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف تک‌تیرانداز" : "Sniper shot target")}
                    <select id="fl_sniper_shot">${mkAliveOptsSel(savedNight.sniperShot)}</select>
                  </label>
                  ` : ""}
                `;
              }
              if (k === "negotiator") {
                return `
                  <div class="note">${escapeHtml(appLang === "fa" ? "در شب معمولی، مذاکره‌کننده اکشن ندارد. فقط در «شب مذاکره» فعال است." : "On regular nights, Negotiator has no action. Only active on the Negotiation Night.")}</div>
                  <div style="height:6px"></div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف مذاکره (شهروند برای تبدیل)" : "Negotiation target (citizen to convert)")}
                    <select id="fl_negotiator_target">${mkAliveOptsSel(savedNight.negotiatorTarget)}</select>
                  </label>
                `;
              }
              if (k === "kadkhoda") {
                const kadUsedArr = Array.isArray(d.kadkhodaLinks) ? d.kadkhodaLinks : [];
                const kadUsedCount = kadUsedArr.length;
                const kadRemaining = Math.max(0, 2 - kadUsedCount);
                const kadQuota = appLang === "fa"
                  ? `(${kadUsedCount} از ۲ لینک استفاده شده — ${kadRemaining} لینک باقی)`
                  : `(${kadUsedCount} of 2 links used — ${kadRemaining} remaining)`;
                return `
                  <div class="note">${escapeHtml(kadQuota)}</div>
                  ${kadRemaining > 0 ? `
                  <div style="height:6px"></div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف بیداری کدخدا" : "Kadkhoda wake target")}
                    <select id="fl_kadkhoda_target">${mkAliveOptsSel(savedNight.kadkhodaTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "اگر کدخدا یک مافیا (غیر خبرچین) را بیدار کند، کدخدا از بازی خارج می‌شود." : "If Kadkhoda wakes a Mafia (except Informant), Kadkhoda is eliminated.")}</div>
                  ` : `<div class="note" style="margin-top:6px; color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? "کدخدا هر دو لینک را استفاده کرده است." : "Kadkhoda has used both links.")}</div>`}
                `;
              }
              if (k === "reporter") {
                return `
                  <div class="note">${escapeHtml(appLang === "fa" ? "خبرنگار فقط در «شب مذاکره» بیدار می‌شود و استعلامِ نتیجهٔ مذاکره را دریافت می‌کند. در شب‌های معمولی این مرحله را رد کنید." : "Reporter only wakes on negotiation nights to receive the negotiation inquiry result. Skip this step on regular nights.")}</div>
                `;
              }
              if (k === "representative") {
                return `
                  <div class="note">${escapeHtml(appLang === "fa" ? "نماینده قدرت روز دارد (وتو رأی‌گیری یا حمایت از بازیکن). این مرحله برای اطلاع‌رسانی یا سیگنال است — اکشن شبانه ندارد." : "Representative has a day power (veto vote or player protection). This step is for moderator notification only — no recordable night action.")}</div>
                `;
              }
              if (k === "nato") {
                // NATO standalone wake (in scenarios where it appears separately from the Mafia group).
                const _natoCurrentNight2 = f.day || 1;
                const _natoUsedNight2 = (d && d.natoUsedNight != null) ? Number(d.natoUsedNight) : null;
                const natoUsed2 = _natoUsedNight2 !== null && _natoUsedNight2 !== _natoCurrentNight2;
                const mkNatoRoleOpts2 = (savedRoleId) => {
                  const saved = String(savedRoleId || "");
                  const seen = new Set();
                  const opts = [`<option value="" ${saved === "" ? "selected" : ""}>—</option>`];
                  for (const p of (draw.players || [])) {
                    if (!p || !p.roleId) continue;
                    const rid = String(p.roleId);
                    if (seen.has(rid)) continue;
                    seen.add(rid);
                    const fa = (roles[rid] && roles[rid].faName) ? roles[rid].faName : rid;
                    const en = (typeof ROLE_I18N !== "undefined" && ROLE_I18N[rid] && ROLE_I18N[rid].name) ? ROLE_I18N[rid].name : fa;
                    opts.push(`<option value="${escapeHtml(rid)}" ${rid === saved ? "selected" : ""}>${escapeHtml(appLang === "fa" ? fa : en)}</option>`);
                  }
                  return opts.join("");
                };
                return `
                  ${natoUsed2 ? `<div class="note" style="color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? "ناتو قبلاً از قابلیت حدس نقش استفاده کرده است." : "NATO already used the role-guess ability.")}</div>` : `
                  <div class="note" style="margin-bottom:6px">${escapeHtml(appLang === "fa" ? "می‌تواند نقش دقیق یک نفر را حدس بزند. درست → خارج / غلط → هیچ." : "Can guess one player's exact role. Correct → eliminated / Wrong → nothing.")}</div>
                  <label>${escapeHtml(appLang === "fa" ? "هدف حدس ناتو" : "NATO guess target")}
                    <select id="fl_nato_target">${mkAliveOptsSel(savedNight.natoTarget)}</select>
                  </label>
                  <label style="margin-top:6px">${escapeHtml(appLang === "fa" ? "نقش حدس‌زده شده" : "Guessed role")}
                    <select id="fl_nato_role_guess">${mkNatoRoleOpts2(savedNight.natoRoleGuess)}</select>
                  </label>
                  `}
                `;
              }
              if (k === "hacker") {
                return `
                  <label>${escapeHtml(appLang === "fa" ? "هدف مسدودسازی هکر" : "Hacker block target")}
                    <select id="fl_hacker_block">${mkAliveOptsSel(savedNight.hackerBlock)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "آن بازیکن همان شب نمی‌تواند از توانایی شبانه‌اش استفاده کند." : "That player cannot use their night ability this night.")}</div>
                `;
              }
              if (k === "guide") {
                const guidePrevNightKey = String((f.day || 1) - 1);
                const guidePrevActions = (d && d.nightActionsByNight && d.nightActionsByNight[guidePrevNightKey]) ? d.nightActionsByNight[guidePrevNightKey] : null;
                const guidePrevTarget = (guidePrevActions && guidePrevActions.guideTarget !== null && guidePrevActions.guideTarget !== undefined && Number.isFinite(parseInt(guidePrevActions.guideTarget, 10))) ? parseInt(guidePrevActions.guideTarget, 10) : null;
                // Show saved result
                const guideNightKey = String(f.day || 1);
                const guideRes = (d && d.guideResultByNight && d.guideResultByNight[guideNightKey]) ? d.guideResultByNight[guideNightKey] : null;
                const guideResultLine = (() => {
                  if (!guideRes || guideRes.target === null || guideRes.target === undefined) return "";
                  return guideRes.isMafia
                    ? (appLang === "fa" ? "نتیجه: مافیا — آن عضو مافیا بیدار می‌شود و هویت راهنما را می‌شناسد." : "Result: Mafia — that member wakes and learns the Guide's identity.")
                    : (appLang === "fa" ? "نتیجه: شهروند — راهنما استعلام منفی دریافت می‌کند." : "Result: Citizen — Guide receives a negative inquiry result.");
                })();
                // Build options with prev-night target disabled
                const optsGuideSel = (sel) => {
                  const sIdx = (sel === null || sel === undefined || sel === "") ? null : parseInt(sel, 10);
                  const s = (sIdx === null || !Number.isFinite(sIdx)) ? "" : String(sIdx);
                  const base = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (const idx of aliveIdxs) {
                    const v = String(idx);
                    const isPrev = (Number.isFinite(guidePrevTarget) && idx === guidePrevTarget);
                    const dis = (isPrev && v !== s) ? "disabled" : "";
                    const prevNote = isPrev ? (appLang === "fa" ? " (شب قبل)" : " (prev night)") : "";
                    base.push(`<option value="${v}" ${v === s ? "selected" : ""} ${dis}>${escapeHtml((names[idx] || t("common.playerN", { n: idx + 1 })) + prevNote)}</option>`);
                  }
                  if (s !== "" && !aliveIdxs.includes(sIdx) && draw.players && draw.players[sIdx]) {
                    const nm = names[sIdx] || t("common.playerN", { n: sIdx + 1 });
                    base.push(`<option value="${s}" selected>${escapeHtml(nm + (appLang === "fa" ? " (خارج شد)" : " (out)"))}</option>`);
                  }
                  return base.join("");
                };
                return `
                  <label>${escapeHtml(appLang === "fa" ? "هدف راهنما" : "Guide target")}
                    <select id="fl_guide_target">${optsGuideSel(savedNight.guideTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "شهروند → استعلام. مافیا → آن عضو بیدار می‌شود و راهنما را می‌شناسد (راهنما لو می‌رود)." : "Citizen → inquiry. Mafia → that member wakes and learns the Guide's identity (Guide is exposed).")}</div>
                  <div id="fl_guide_result" class="note" style="margin-top:6px; ${guideResultLine ? "" : "display:none"}">${escapeHtml(guideResultLine)}</div>
                `;
              }
              if (k === "bodyguard") {
                return `
                  <label>${escapeHtml(appLang === "fa" ? "هدف محافظت (در برابر ترور)" : "Bodyguard protect target")}
                    <select id="fl_bodyguard_protect">${mkAliveOptsSel(savedNight.bodyguardProtect)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "اگر یاغی (ترور) آن شب این نفر را هدف قرار دهد، ترور ناموفق است. خودِ محافظ نیز در برابر ترور مصون است." : "If the Rebel assassinates this player, the attempt fails. Bodyguard is also immune to assassination.")}</div>
                `;
              }
              if (k === "minemaker") {
                const minemakerUsed = !!(d && d.minemakerUsed);
                const currentMineRaw = (d && d.minemakerMine !== null && d.minemakerMine !== undefined && Number.isFinite(Number(d.minemakerMine))) ? parseInt(d.minemakerMine, 10) : null;
                const mineTargetName = (currentMineRaw !== null && names[currentMineRaw]) ? names[currentMineRaw] : (currentMineRaw !== null ? t("common.playerN", { n: currentMineRaw + 1 }) : "");
                return `
                  ${minemakerUsed ? `
                  <div class="note" style="color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? `مین‌گذار قابلیتش را استفاده کرده${currentMineRaw !== null ? ` — مین روی: ${mineTargetName}` : ""}.` : `Minemaker has used their mine${currentMineRaw !== null ? ` — mine on: ${mineTargetName}` : ""}.`)}</div>
                  ` : `
                  <label>${escapeHtml(appLang === "fa" ? "هدف مین (یک‌بار در کل بازی)" : "Mine target (once per game)")}
                    <select id="fl_minemaker_target">${mkAliveOptsSel(savedNight.minemakerTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "اگر مافیا همان شب این نفر را شات کند، مین منفجر می‌شود و یک داوطلب از مافیا نیز خارج می‌شود." : "If mafia shoots this player the same night, mine explodes and a volunteering mafia member is also eliminated.")}</div>
                  `}
                `;
              }
              if (k === "lawyer") {
                const lawyerUsed = !!(d && d.lawyerUsed);
                return `
                  ${lawyerUsed ? `
                  <div class="note" style="color:rgba(255,200,0,.9)">${escapeHtml(appLang === "fa" ? "وکیل قابلیتش را استفاده کرده است." : "Lawyer has used their protection.")}</div>
                  ` : `
                  <label>${escapeHtml(appLang === "fa" ? "هدف مصونیت (یک‌بار در کل بازی)" : "Immunity target (once per game)")}
                    <select id="fl_lawyer_target">${mkAliveOptsSel(savedNight.lawyerTarget)}</select>
                  </label>
                  <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "این بازیکن فردا از حذف با رأی‌گیری مصون است." : "This player is immune to vote-elimination tomorrow.")}</div>
                  `}
                `;
              }
              if (k === "gunslinger") {
                if (!showGunner) return `<div class="note">${escapeHtml(noActionTxt)}</div>`;
                const gunHolders = Object.keys(guns || {})
                  .map((k) => parseInt(k, 10))
                  .filter((idx) => Number.isFinite(idx) && idx >= 0 && draw.players && idx < draw.players.length)
                  .filter((idx) => (draw.players[idx] && draw.players[idx].alive !== false));
                const gunsList = gunHolders.length
                  ? gunHolders.map((idx) => {
                      const g = guns[idx] || {};
                      const nm = names[idx] || t("common.playerN", { n: idx + 1 });
                      const typeLabel = (g.type === "real") ? t("tool.flow.guns.type.real") : t("tool.flow.guns.type.fake");
                      const usedTxt = g.used ? ` <span style="color:var(--muted); font-weight:900">(${escapeHtml(appLang === "fa" ? "مصرف شد" : "used")})</span>` : "";
                      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 0">
                        <div style="font-weight:950">${escapeHtml(nm)} — <span style="color:var(--muted)">${escapeHtml(typeLabel)}</span>${usedTxt}</div>
                        <button class="btn" type="button" data-gun-rm="${idx}" style="padding:6px 10px; font-size:12px">${escapeHtml(t("tool.flow.guns.remove"))}</button>
                      </div>`;
                    }).join("")
                  : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "فعلاً کسی تفنگ ندارد." : "No one has a gun yet.")}</div>`;
                return `
                  <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.guns.gunslingerIs", { name: gunnerName }))}</div>
                  ${sectionDisabled ? `<div class="note" style="margin-top:8px; color:rgba(255,200,0,.9)">${escapeHtml(disabledNote)}</div>` : ""}
                  <div style="${sectionDisabledStyle}">
                    <div class="row one" style="margin-top:8px">
                      <label>${escapeHtml(t("tool.flow.guns.giveTo"))}
                        <select id="fl_gun_give_to">${optsAlive}</select>
                      </label>
                      <label>${escapeHtml(t("tool.flow.guns.type"))}
                        <select id="fl_gun_type">
                          <option value="real">${escapeHtml(t("tool.flow.guns.type.real"))}</option>
                          <option value="fake">${escapeHtml(t("tool.flow.guns.type.fake"))}</option>
                        </select>
                      </label>
                    </div>
                    <div class="note" style="margin-top:8px">${escapeHtml(t("tool.flow.guns.selfFakeOnly"))}</div>
                    <div style="height:10px"></div>
                    <button class="btn" id="fl_gun_give" type="button">${escapeHtml(t("tool.flow.guns.give"))}</button>
                    <div class="note" id="fl_gun_give_note" style="display:none; margin-top:8px"></div>
                  </div>
                  <div style="height:12px"></div>
                  <div style="font-weight:1100">${escapeHtml(t("tool.flow.guns.hasGun"))}</div>
                  <div style="height:6px"></div>
                  ${gunsList}
                `;
              }
              return `<div class="note">${escapeHtml(noActionTxt)}</div>`;
            };

            const orderedRaw = (wake && wake.length) ? wake : [];
            // Bomb can only be used once per game; hide Bomber from night order after that.
            const bombAlreadyUsed = (() => {
              try {
                const byDay = (f.draft && f.draft.bombByDay && typeof f.draft.bombByDay === "object") ? f.draft.bombByDay : {};
                for (const day of Object.keys(byDay)) {
                  const rec = byDay[day];
                  if (rec && (rec.target !== null && rec.target !== undefined)) return true;
                }
                if (Array.isArray(f.events)) {
                  if (f.events.some((e) => e && e.kind === "bomb_resolve")) return true;
                }
                return false;
              } catch { return false; }
            })();
            // Hide Zodiac entirely on odd nights (no wake, no action block).
            const ordered = (evenNight ? orderedRaw : orderedRaw.filter((w) => normWake(w) !== "zodiac"))
              .filter((w) => normWake(w) !== "bomber" || !bombAlreadyUsed);
            // Death timing helpers (see `setPlayerLife` -> `deadAtByIdx`)
            const deathRec = (idx) => {
              try {
                const r = d && d.deadAtByIdx ? d.deadAtByIdx[String(idx)] : null;
                return (r && typeof r === "object") ? r : null;
              } catch {
                return null;
              }
            };
            const deadBeforeTonight = (idx) => {
              try {
                const p = (draw && draw.players) ? draw.players[idx] : null;
                if (!p) return true;
                if (p.alive !== false) return false;
                const r = deathRec(idx);
                // No record => treat as dead-before (safe).
                if (!r) return true;
                const rd = Number(r.day || 1);
                const rp = String(r.phase || "day");
                // We are in night_run, so f.phase should be "night".
                // If they died in a previous day/night, they are dead before tonight.
                if (rd < Number(f.day || 1)) return true;
                // If they died earlier today (day phase), they are dead for tonight.
                if (rd === Number(f.day || 1) && rp === "day") return true;
                // If they died this same night (resolved at dawn), they can still act tonight.
                if (rd === Number(f.day || 1) && rp === "night") return false;
                return true;
              } catch {
                return true;
              }
            };
            const aliveTonight = (idx) => {
              try {
                const p = (draw && draw.players) ? draw.players[idx] : null;
                if (!p) return false;
                if (p.alive !== false) return true;
                // dead now, but if death is "this night", treat as alive for tonight (pending).
                return !deadBeforeTonight(idx);
              } catch {
                return false;
              }
            };
            const nightStatusTag = (idx) => {
              try {
                const p = (draw && draw.players) ? draw.players[idx] : null;
                if (!p) return null;
                if (p.alive !== false) return null;
                return deadBeforeTonight(idx) ? "dead" : "pending";
              } catch {
                return null;
              }
            };
            const wakeActorSuffix = (wakeLabel) => {
              try {
                const k = normWake(wakeLabel);
                const joiner = (appLang === "fa") ? "، " : ", ";
                const deadTag = (appLang === "fa") ? "مرده" : "dead";
                const pendingTag = (appLang === "fa") ? "در انتظار صبح" : "pending";
                const labelFor = (idx) => {
                  return (names && names[idx]) ? names[idx] : t("common.playerN", { n: idx + 1 });
                };
                const alive = (idx) => aliveTonight(idx);
                const idxsByRole = (roleIds, { onlyAlive } = {}) => {
                  try {
                    const out = [];
                    for (let i = 0; i < (draw.players || []).length; i++) {
                      const p = draw.players[i];
                      if (!p) continue;
                      if (onlyAlive && !alive(i)) continue;
                      if (roleIds.includes(p.roleId)) out.push(i);
                    }
                    return out;
                  } catch {
                    return [];
                  }
                };
                const idxsByTeamFa = (teamFa, { onlyAlive } = {}) => {
                  try {
                    const out = [];
                    for (let i = 0; i < (draw.players || []).length; i++) {
                      const p = draw.players[i];
                      if (!p) continue;
                      if (onlyAlive && !alive(i)) continue;
                      const rid = p.roleId || "citizen";
                      const tf = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
                      if (tf === teamFa) out.push(i);
                    }
                    return out;
                  } catch {
                    return [];
                  }
                };

                // Shared role-id lookup for all wake keys
                const wakeRoleMap = {
                  doctor: ["doctor", "watson"],
                  lecter: ["doctorLecter"],
                  detective: ["detective"],
                  professional: ["professional", "leon"],
                  bomber: ["bomber"],
                  magician: ["magician"],
                  zodiac: ["zodiac"],
                  gunslinger: ["gunslinger"],
                  ocean: ["ocean"],
                  jokermaf: ["jokerMafia"],
                  swindler: ["swindler"],
                  researcher: ["researcher"],
                  natasha: ["natasha"],
                  sniper: ["sniper"],
                  negotiator: ["negotiator"],
                  kadkhoda: ["kadkhoda"],
                  heir: ["heir"],
                  herbalist: ["herbalist"],
                  armorsmith: ["armorsmith"],
                  nostradamus: ["nostradamus"],
                  kane: ["citizenKane"],
                  constantine: ["constantine"],
                  reporter: ["reporter"],
                  representative: ["representative"],
                };
                let idxs = [];
                if (k === "mafia") {
                  // Mafia wake is a team wake in most scenarios.
                  idxs = idxsByTeamFa("مافیا", { onlyAlive: false });
                } else if (wakeRoleMap[k]) {
                  idxs = idxsByRole(wakeRoleMap[k], { onlyAlive: false });
                }

                if (!idxs.length) return "";
                const list = idxs
                  .map((idx) => {
                    const st = nightStatusTag(idx);
                    if (st === "dead") return `${labelFor(idx)} (${deadTag})`;
                    if (st === "pending") return `${labelFor(idx)} (${pendingTag})`;
                    return labelFor(idx);
                  })
                  .join(joiner);
                return list ? ` (${list})` : "";
              } catch {
                return "";
              }
            };
            const wakeActors = (wakeLabel) => {
              try {
                const k = normWake(wakeLabel);
                const alive = (idx) => aliveTonight(idx);
                const idxsByRole = (roleIds) => {
                  const out = [];
                  for (let i = 0; i < (draw.players || []).length; i++) {
                    const p = draw.players[i];
                    if (!p) continue;
                    if (roleIds.includes(p.roleId)) out.push(i);
                  }
                  return out;
                };
                const idxsByTeamFa = (teamFa) => {
                  const out = [];
                  for (let i = 0; i < (draw.players || []).length; i++) {
                    const p = draw.players[i];
                    if (!p) continue;
                    const rid = p.roleId || "citizen";
                    const tf = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
                    if (tf === teamFa) out.push(i);
                  }
                  return out;
                };

                const wakeRoleMap2 = {
                  doctor: ["doctor", "watson"],
                  lecter: ["doctorLecter"],
                  detective: ["detective"],
                  professional: ["professional", "leon"],
                  bomber: ["bomber"],
                  magician: ["magician"],
                  zodiac: ["zodiac"],
                  gunslinger: ["gunslinger"],
                  ocean: ["ocean"],
                  jokermaf: ["jokerMafia"],
                  swindler: ["swindler"],
                  researcher: ["researcher"],
                  natasha: ["natasha"],
                  sniper: ["sniper"],
                  negotiator: ["negotiator"],
                  kadkhoda: ["kadkhoda"],
                  heir: ["heir"],
                  herbalist: ["herbalist"],
                  armorsmith: ["armorsmith"],
                  nostradamus: ["nostradamus"],
                  kane: ["citizenKane"],
                  constantine: ["constantine"],
                  reporter: ["reporter"],
                  representative: ["representative"],
                };
                let all = [];
                if (k === "mafia") {
                  all = idxsByTeamFa("مافیا");
                } else if (wakeRoleMap2[k]) {
                  all = idxsByRole(wakeRoleMap2[k]);
                }
                const aliveIdxs = all.filter((idx) => alive(idx));
                return { all, alive: aliveIdxs };
              } catch {
                return { all: [], alive: [] };
              }
            };
            let _wakeNum = 0;
            const actionBlocks = ordered.map((w) => {
              const a = wakeActors(w);
              // If this role/team doesn't exist in the game at all, hide it.
              if (!a.all.length) return "";
              // Nostradamus and Heir only wake on intro night (Night 1).
              const _introOnly = normWake(w);
              if ((_introOnly === "nostradamus" || _introOnly === "heir") && (f.day || 1) !== 1) return "";
              _wakeNum++;
              const isDeadBlock = a.alive.length === 0;
              const deadBadge = isDeadBlock ? ` • ${appLang === "fa" ? "مرده" : "dead"}` : "";
              const headerTxt = `${_wakeNum}. ${String(w || "")}${wakeActorSuffix(w)}${deadBadge}`;
              return `
                <div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,.06); ${isDeadBlock ? "opacity:.55; filter:saturate(.2);" : ""}">
                  <div style="font-weight:1100">${escapeHtml(headerTxt)}</div>
                  <div style="height:8px"></div>
                  <div class="row one">
                    ${isDeadBlock ? `<div class="note">${escapeHtml(appLang === "fa" ? "این نقش/تیم قبل از امشب مرده است و اکشن ندارد." : "This role/team is dead before tonight and has no action.")}</div>` : sectionFor(w)}
                  </div>
                </div>
              `;
            }).filter(Boolean).join("");

            body = `
              ${bombLine ? `<div class="note" style="margin-top:6px">${escapeHtml(bombLine)}</div>` : ``}
              <div style="height:10px"></div>
              <div style="max-height: 60vh; overflow:auto; -webkit-overflow-scrolling: touch; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px; background: rgba(17,24,36,.25)">
                ${actionBlocks || `<div class="note">${escapeHtml(t("tool.wake.none"))}</div>`}
              </div>
            `;
          } else if (cur.id === "night_wake") {
            body = `${bombLine ? `<div class="note" style="margin-top:8px">${escapeHtml(bombLine)}</div>` : ``}
              <div style="height:10px"></div>
              ${wake.length ? wake.map((x, i) => `<div style="padding:6px 0;font-weight:950">${i + 1}. ${escapeHtml(x)}</div>`).join("") : `<div class="note">${escapeHtml(t("tool.wake.none"))}</div>`}`;
          } else if (cur.id === "day_guns") {
            // When entering this step from a later step (going backward), deaths were
            // applied on "Next" — revert them so players appear alive while reviewing.
            // Shots and used-gun state are PRESERVED so the moderator doesn't need to
            // re-enter everything; clicking Next again will re-apply the same deaths.
            // When re-rendering within the step (after firing), applied===false so no revert.
            try {
              const dayKey = String(f.day || 1);
              const d2 = f.draft || {};
              const rec = (d2.gunShotAppliedByDay && d2.gunShotAppliedByDay[dayKey]) || null;
              if (rec && rec.applied) {
                const shots = (rec.shots || []).slice().reverse();
                for (const shot of shots) {
                  // Revert the actual death, but leave guns[shooter].used = true
                  // and rec.shots intact so the pending list stays visible.
                  if (shot.type === "real" && shot.targetPrevAlive) {
                    try { setPlayerLife(shot.target, { alive: true }); } catch {}
                  }
                }
                rec.applied = false;
                // Remove gun_shot events so they can be re-added cleanly on Next.
                if (Array.isArray(f.events)) {
                  f.events = f.events.filter((e) => !(e && e.kind === "gun_shot" && e.phase === f.phase && Number(e.day) === Number(f.day)));
                }
                f.draft = d2;
                try { renderCast(); } catch {}
                saveState(appState);
              }
            } catch {}

            // Bomb revert: entering this step from beyond (going backward) reverts any applied bomb kill.
            if (!bombApplyJustHappened) {
              try {
                const db = f.draft || {};
                if (!db.bombByDay || typeof db.bombByDay !== "object") db.bombByDay = {};
                if (!db.bombResolveByDay || typeof db.bombResolveByDay !== "object") db.bombResolveByDay = {};
                if (!db.bombAppliedByDay || typeof db.bombAppliedByDay !== "object") db.bombAppliedByDay = {};
                const bkey = String(f.day || 1);
                const bprev = (db.bombAppliedByDay[bkey] && typeof db.bombAppliedByDay[bkey] === "object") ? db.bombAppliedByDay[bkey] : null;
                if (bprev && bprev.killed !== null && bprev.killed !== undefined && Number.isFinite(Number(bprev.killed))) {
                  const bpi = parseInt(bprev.killed, 10);
                  if (bprev.prevAlive === true) {
                    try { setPlayerLife(bpi, { alive: true }); } catch {}
                  }
                  bprev.killed = null;
                  bprev.prevAlive = null;
                  db.bombAppliedByDay[bkey] = bprev;
                }
                if (db.bombResolveByDay[bkey] && typeof db.bombResolveByDay[bkey] === "object") {
                  db.bombResolveByDay[bkey].resolved = false;
                  db.bombResolveByDay[bkey].outcome = null;
                }
                f.draft = db;
                saveState(appState);
              } catch {}
            }

            // list gun holders
            const guns = f.guns || {};
            const holders = Object.keys(guns)
              .map((k) => parseInt(k, 10))
              .filter((idx) => Number.isFinite(idx) && idx >= 0 && idx < names.length)
              .filter((idx) => (draw.players[idx] && draw.players[idx].alive !== false)); // alive only

            const holderList = holders.length
              ? holders.map((idx) => {
                  const g = guns[idx] || {};
                  const typeLabel = (g.type === "real") ? t("tool.flow.guns.type.real") : t("tool.flow.guns.type.fake");
                  const usedTxt = g.used ? ` <span style="color:var(--muted); font-weight:900">(${escapeHtml(appLang === "fa" ? "مصرف شد" : "used")})</span>` : "";
                  return `<div style="padding:6px 0; font-weight:950">${escapeHtml(names[idx])} — <span style="color:var(--muted)">${escapeHtml(typeLabel)}</span>${usedTxt}</div>`;
                }).join("")
              : `<div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "فعلاً کسی تفنگ ندارد." : "No one has a gun yet.")}</div>`;

            const shooterOpts = [`<option value="">—</option>`].concat(
              holders.filter((idx) => !(guns[idx] && guns[idx].used)).map((idx) => `<option value="${idx}">${escapeHtml(names[idx])}</option>`)
            ).join("");
            const targetOpts = optsAlive;

            // Pending shots this phase (recorded but not yet fatal until Next is clicked).
            const pendingShots = (() => {
              try {
                const dayKey = String(f.day || 1);
                const d2 = f.draft || {};
                const rec = (d2.gunShotAppliedByDay && d2.gunShotAppliedByDay[dayKey]) || null;
                return (rec && Array.isArray(rec.shots)) ? rec.shots : [];
              } catch { return []; }
            })();
            const pendingShotsHtml = pendingShots.length
              ? `
                <div style="height:12px"></div>
                <div style="font-weight:1100">${escapeHtml(appLang === "fa" ? "تیرهای شلیک‌شده (در این مرحله):" : "Shots fired this phase:")}</div>
                <div style="height:6px"></div>
                ${pendingShots.map((s) => {
                  const shooterName = escapeHtml(names[s.shooter] || t("common.playerN", { n: s.shooter + 1 }));
                  const targetName = escapeHtml(names[s.target] || t("common.playerN", { n: s.target + 1 }));
                  const typeLabel = s.type === "real" ? (appLang === "fa" ? "واقعی" : "real") : (appLang === "fa" ? "جعلی" : "fake");
                  return `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0">
                    <div style="color:var(--bad); font-weight:950">${shooterName} → ${targetName} <span style="color:var(--muted); font-weight:900">(${escapeHtml(typeLabel)})</span></div>
                    <button class="smallbtn" data-gun-shot-rm="${s.shooter}" type="button" style="padding:6px 10px; font-size:12px; flex:0 0 auto">${escapeHtml(appLang === "fa" ? "حذف" : "Undo")}</button>
                  </div>`;
                }).join("")}
                <div class="note" style="margin-top:6px">${escapeHtml(appLang === "fa" ? "بازیکنان تیرخورده تا پایان این مرحله زنده‌اند. با «بعدی» خارج می‌شوند." : "Shot players stay alive until this phase ends. Deaths apply when you press Next.")}</div>
              `
              : "";

            // Bomb section (shown inline below guns when a bomb is planted today).
            const bombSectionHtml = (() => {
              try {
                const db = f.draft || {};
                if (!db.bombByDay || typeof db.bombByDay !== "object") return "";
                if (!db.bombResolveByDay || typeof db.bombResolveByDay !== "object") db.bombResolveByDay = {};
                const brec = db.bombByDay[String(f.day)] || null;
                const btargetIdx = (brec && brec.target !== null && brec.target !== undefined && Number.isFinite(Number(brec.target))) ? parseInt(brec.target, 10) : null;
                const bhasBomb = !!(f.bombActive || (brec && btargetIdx !== null));
                if (!bhasBomb) return "";
                const btargetName = (btargetIdx !== null) ? (names[btargetIdx] || t("common.playerN", { n: btargetIdx + 1 })) : "—";
                const bplantedCode = (brec && brec.code != null && String(brec.code).trim()) ? String(brec.code).trim() : "";
                const bguardIdx = (() => {
                  for (let i = 0; i < (draw.players || []).length; i++) {
                    const p = draw.players[i];
                    if (!p) continue;
                    const rid = p.roleId || "citizen";
                    if (roles[rid] && roles[rid].canSacrificeForBomb) return i;
                  }
                  return null;
                })();
                const bhasGuard = bguardIdx !== null;
                // Guard is alive for sacrifice if: alive before this day AND not pending-dead
                // from a real gun shot recorded in this phase (gun deaths commit on Next, not immediately).
                const bguardPendingDead = (() => {
                  try {
                    const dayKey = String(f.day || 1);
                    const rec = (db.gunShotAppliedByDay && db.gunShotAppliedByDay[dayKey]) || null;
                    if (!rec || !Array.isArray(rec.shots)) return false;
                    return rec.shots.some((s) => s && s.target === bguardIdx && s.type === "real" && s.targetPrevAlive);
                  } catch { return false; }
                })();
                const bguardAlive = bguardIdx !== null
                  && draw.players[bguardIdx]
                  && draw.players[bguardIdx].alive !== false
                  && !bguardPendingDead;
                const bguardName = (bguardIdx !== null) ? (names[bguardIdx] || t("common.playerN", { n: bguardIdx + 1 })) : "—";
                const br0 = (db.bombResolveByDay[String(f.day)] && typeof db.bombResolveByDay[String(f.day)] === "object")
                  ? db.bombResolveByDay[String(f.day)]
                  : { guardSacrifice: false, guardGuess: "", targetGuess: "", resolved: false, outcome: null };
                const bmkCodeOpts = (sel) => {
                  const s = String(sel ?? "").trim();
                  const opts = [`<option value="" ${s === "" ? "selected" : ""}>—</option>`];
                  for (let i = 1; i <= 4; i++) {
                    const v = String(i);
                    opts.push(`<option value="${v}" ${s === v ? "selected" : ""}>${v}</option>`);
                  }
                  return opts.join("");
                };
                const bheadline = (appLang === "fa")
                  ? `بمب جلوی «${btargetName}» کاشته شده است${bplantedCode ? ` (کد: ${bplantedCode})` : ""}.`
                  : `Bomb planted in front of "${btargetName}"${bplantedCode ? ` (code: ${bplantedCode})` : ""}.`;
                const bguardLine = bhasGuard
                  ? (bguardAlive ? "" : (appLang === "fa" ? `محافظ (${bguardName}) مرده است.` : `Guard (${bguardName}) is dead.`))
                  : (appLang === "fa" ? "محافظ در این بازی وجود ندارد." : "No Guard in this game.");
                const boutcomeLine = (() => {
                  if (!bplantedCode) return "";
                  const bapplied = !!(br0 && br0.resolved);
                  const bsac = !!(bhasGuard && bguardAlive && br0 && br0.guardSacrifice);
                  const bguardGuess = String((br0 && br0.guardGuess) || "").trim();
                  const btargetGuess = String((br0 && br0.targetGuess) || "").trim();
                  const bguess = bsac ? bguardGuess : btargetGuess;
                  const bprefix = (appLang === "fa")
                    ? (bapplied ? "نتیجه (اعمال‌شده): " : "نتیجه: ")
                    : (bapplied ? "Result (applied): " : "Result: ");
                  if (!bguess) {
                    return bprefix + (appLang === "fa"
                      ? (bsac ? "کدِ محافظ را انتخاب کنید." : "حدسِ هدف را انتخاب کنید.")
                      : (bsac ? "Pick Guard guess." : "Pick target guess."));
                  }
                  const bok = String(bguess) === String(bplantedCode);
                  const bo = bsac
                    ? (bok ? "neutralized_guard" : "guard_died")
                    : (bok ? "neutralized_target" : "target_died");
                  if (bo === "neutralized_guard") return bprefix + (appLang === "fa" ? "محافظ بمب را خنثی کرد." : "Guard neutralized the bomb.");
                  if (bo === "guard_died") return bprefix + (appLang === "fa" ? "محافظ اشتباه حدس زد و مرد." : "Guard guessed wrong and died.");
                  if (bo === "neutralized_target") return bprefix + (appLang === "fa" ? "هدف درست حدس زد و بمب خنثی شد." : "Target guessed right; bomb neutralized.");
                  if (bo === "target_died") return bprefix + (appLang === "fa" ? "هدف اشتباه حدس زد و مرد." : "Target guessed wrong and died.");
                  return "";
                })();
                return `
                  <div style="height:14px; border-top:1px solid rgba(255,255,255,.12); margin-top:12px; padding-top:2px"></div>
                  <div class="note" style="margin-top:6px">${escapeHtml(bheadline)}</div>
                  <div style="height:10px"></div>
                  ${bguardLine ? `<div class="note">${escapeHtml(bguardLine)}</div><div style="height:10px"></div>` : ``}
                  ${bhasGuard ? `
                    <label for="fl_bomb_guard" style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:14px; font-weight:950; cursor:pointer; user-select:none; -webkit-user-select:none">
                      <span>${escapeHtml(appLang === "fa" ? "محافظ فدا می‌شود؟" : "Does Guard sacrifice?")}</span>
                      <input id="fl_bomb_guard" type="checkbox" ${br0.guardSacrifice ? "checked" : ""} ${bguardAlive ? "" : "disabled"} style="width:24px; height:24px; margin:0; accent-color: var(--primary)" />
                    </label>
                    <div style="height:10px"></div>
                  ` : ``}
                  ${bhasGuard && br0.guardSacrifice ? `
                    <label>${escapeHtml(appLang === "fa" ? `حدسِ محافظ (${bguardName})` : `Guard (${bguardName}) guess`)}
                      <select id="fl_bomb_guard_guess">${bmkCodeOpts(br0.guardGuess)}</select>
                    </label>
                  ` : `
                    <label>${escapeHtml(appLang === "fa" ? `حدسِ ${btargetName}` : `${btargetName} guess`)}
                      <select id="fl_bomb_target_guess">${bmkCodeOpts(br0.targetGuess)}</select>
                    </label>
                  `}
                  ${boutcomeLine ? `<div class="note" style="margin-top:10px; font-weight:950">${escapeHtml(boutcomeLine)}</div>` : ``}
                  <div class="note" style="margin-top:10px">${escapeHtml(appLang === "fa" ? "با انتخاب حدس، نتیجه بلافاصله اعمال می‌شود." : "Your choice applies immediately.")}</div>
                `;
              } catch { return ""; }
            })();

            body = `
              <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.guns.title"))}</div>
              <div style="height:10px"></div>
              <div style="font-weight:1100">${escapeHtml(t("tool.flow.guns.hasGun"))}</div>
              <div style="height:6px"></div>
              ${holderList}
              ${pendingShotsHtml}
              <div style="height:12px"></div>
              <div style="font-weight:1100">${escapeHtml(t("tool.flow.guns.fire"))}</div>
              <div class="row one" style="margin-top:8px">
                <label>${escapeHtml(t("tool.flow.guns.shooter"))}
                  <select id="fl_gun_shooter">${shooterOpts}</select>
                </label>
                <label>${escapeHtml(t("tool.flow.guns.target"))}
                  <select id="fl_gun_target">${targetOpts}</select>
                </label>
              </div>
              <div style="height:10px"></div>
              <button class="btn primary" id="fl_gun_fire" type="button">${escapeHtml(t("tool.flow.guns.fire"))}</button>
              <div class="note" id="fl_gun_note" style="display:none; margin-top:10px"></div>
              ${bombSectionHtml}
            `;
          } else if (cur.id === "day_gun_expiry") {
            // Entering this step (from any direction) reverts previously applied expiry
            // deaths so the player list accurately reflects "who still has an unfired
            // real gun right now".  Deaths are applied when the moderator clicks Next.
            try { revertGunExpiryForDay(f); } catch {}
            try { renderCast(); } catch {}
            saveState(appState);

            const expiryGuns = f.guns || {};
            const expiryVictims = Object.keys(expiryGuns)
              .map((k) => parseInt(k, 10))
              .filter((idx) => Number.isFinite(idx) && idx >= 0 && idx < names.length)
              .filter((idx) => draw.players[idx] && draw.players[idx].alive !== false)
              .filter((idx) => expiryGuns[idx] && !expiryGuns[idx].used && expiryGuns[idx].type === "real");

            body = expiryVictims.length
              ? `
                <div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.day.gunExpiry.desc"))}</div>
                <div style="height:10px"></div>
                ${expiryVictims.map((idx) => `<div style="padding:6px 0; font-weight:950; color:var(--bad)">${escapeHtml(names[idx] || t("common.playerN", { n: idx + 1 }))}</div>`).join("")}
                <div class="note" style="margin-top:10px">${escapeHtml(appLang === "fa" ? "برای خارج کردن این بازیکنان «بعدی» را بزنید." : "Click Next to eliminate these players.")}</div>
              `
              : `<div class="note" style="margin-top:6px">${escapeHtml(t("tool.flow.day.gunExpiry.none"))}</div>`;
          } else if (cur.id === "night_actions") {
            const d = f.draft || {};
            const evenNight = ((f.day || 1) % 2 === 0);
            const gunnerIdxs = (draw.players || [])
              .map((p, idx) => (p && p.roleId === "gunslinger" && p.alive !== false) ? idx : null)
              .filter((x) => x !== null);
            const showGunner = !!gunnerIdxs.length;
            const gunnerOpts = [`<option value="">—</option>`].concat(
              gunnerIdxs.map((idx) => `<option value="${idx}">${escapeHtml(names[idx])}</option>`)
            ).join("");
            const guns = f.guns || {};
            const givenCount = Object.keys(guns || {}).length;
            const nightKey = String(f.day || 1);
            if (!d.nightGunGivesByNight || typeof d.nightGunGivesByNight !== "object") d.nightGunGivesByNight = {};
            const nightGives = Array.isArray(d.nightGunGivesByNight[nightKey]) ? d.nightGunGivesByNight[nightKey] : [];
            const nightGiveCount = nightGives.length;
            const nightRealCount = nightGives.filter((x) => x && x.type === "real").length;
            body = `
              <div style="max-height: 46vh; overflow:auto; -webkit-overflow-scrolling: touch;">
                ${showGunner ? `
                <div style="font-weight:1100">${escapeHtml(t("tool.flow.guns.add"))}</div>
                <div class="row one" style="margin-top:8px">
                  <label>${escapeHtml(appLang === "fa" ? "تفنگدار" : "Gunslinger")}
                    <select id="fl_gun_from">${gunnerOpts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.guns.giveTo"))}
                    <select id="fl_gun_give_to">${optsAlive}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.guns.type"))}
                    <select id="fl_gun_type">
                      <option value="real">${escapeHtml(t("tool.flow.guns.type.real"))}</option>
                      <option value="fake">${escapeHtml(t("tool.flow.guns.type.fake"))}</option>
                    </select>
                  </label>
                </div>
                <div class="note" style="margin-top:8px">${escapeHtml(t("tool.flow.guns.selfFakeOnly"))}</div>
                <div style="height:10px"></div>
                <button class="btn" id="fl_gun_give" type="button">${escapeHtml(t("tool.flow.guns.give"))}</button>
                <div class="note" id="fl_gun_give_note" style="display:none; margin-top:8px"></div>
                <div style="height:14px"></div>
                ` : ``}
                <div class="row one">
                  <label>${escapeHtml(t("tool.flow.action.mafiaShot"))}
                    <select id="fl_mafia_shot">${opts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.doctorSave"))}
                    <select id="fl_doctor_save">${opts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.bomber"))}
                    <select id="fl_bomb_target">${opts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.bombCode"))}
                    <select id="fl_bomb_code">
                      <option value="" ${(String(d.bombCode || "").trim() === "") ? "selected" : ""}>—</option>
                      <option value="1" ${(String(d.bombCode || "").trim() === "1") ? "selected" : ""}>1</option>
                      <option value="2" ${(String(d.bombCode || "").trim() === "2") ? "selected" : ""}>2</option>
                      <option value="3" ${(String(d.bombCode || "").trim() === "3") ? "selected" : ""}>3</option>
                      <option value="4" ${(String(d.bombCode || "").trim() === "4") ? "selected" : ""}>4</option>
                    </select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.magicianDisable"))}
                    <select id="fl_magician_disable">${opts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.zodiacShot"))} ${evenNight ? "" : `<span style="color:var(--muted); font-weight:900">(even nights only)</span>`}
                    <select id="fl_zodiac_shot" ${evenNight ? "" : "disabled"}>${opts}</select>
                  </label>
                  <label>${escapeHtml(t("tool.flow.action.oceanWake"))}
                    <select id="fl_ocean_wake" multiple size="${Math.min(8, Math.max(3, aliveIdxs.length))}">${opts}</select>
                  </label>
                </div>
              </div>
            `;
          } else {
            body = `
              ${bombLine ? `<div class="note" style="margin-top:6px">${escapeHtml(bombLine)}</div><div style="height:10px"></div>` : ``}
              <div class="note">${escapeHtml(appLang === "fa" ? "این مرحله هنوز کنترل اختصاصی ندارد." : "This step does not have a dedicated control yet.")}</div>
            `;
          }

          openToolModal(t("tool.flow.title"), `
            <div class="toolBox">
              <div style="text-align:center">
                <div style="font-weight:1200; font-size:22px; letter-spacing:.2px">${escapeHtml(flowPhaseTitle(f))}</div>
                <div style="color:var(--muted); font-weight:900; font-size:12px; margin-top:6px">${escapeHtml(stepLine)} • ${escapeHtml(cur.title)}</div>
              </div>

              <div style="height:12px"></div>
              ${body}

              <div style="height:14px"></div>
              <div class="actions">
                <button class="btn" id="fl_prev" type="button" ${(f.phase === "day" && (f.step || 0) === 0 && (f.day || 1) === 1) ? "disabled" : ""}>${escapeHtml(t("tool.flow.prev"))}</button>
                <button class="btn primary" id="fl_next" type="button">${escapeHtml(t("tool.flow.next"))}</button>
              </div>
            </div>
          `, { hideBottom: true });

          $("fl_prev").onclick = prevFlowStep;

          // Inline timers embedded in day_vote and day_elim steps.
          if (cur && (cur.id === "day_vote" || cur.id === "day_elim")) {
            ensureTimers();
            if (!audioUnlocked) try { unlockAudio(); } catch {}
            const timerKeys = cur.id === "day_vote" ? ["talk", "challenge"] : ["defense"];
            for (const key of timerKeys) {
              const btn = document.getElementById("tm_btn_" + key);
              if (btn) btn.onclick = () => startOrPauseTimer(key);
              const rst = document.getElementById("tm_rst_" + key);
              if (rst) rst.onclick = () => resetSingleTimer(key);
              const val = document.getElementById("tm_" + key);
              if (val) val.onclick = () => showTimerPicker(key, showFlowTool);
            }
            updateTimerIcons();
            if (appState.god.timers.running && !timerInterval) {
              timerInterval = setInterval(tickTimers, 250);
            }
          }

          const commitVoteFromUI = () => {
            try {
              // Button-toggle voting: selection is already saved live on each click.
              // Just record the voter count for the defense-round threshold.
              const d = f.draft || {};
              d.voteVotersByDay = (d.voteVotersByDay && typeof d.voteVotersByDay === "object") ? d.voteVotersByDay : {};
              d.voteVotersByDay[f.day] = aliveIdxs.length;
              f.draft = d;
              saveState(appState);
              return true;
            } catch {
              return false;
            }
          };
          const snapshotElimVotesFromUI = () => {
            try {
              const d = f.draft || {};
              if (!d.elimVotesByDay || typeof d.elimVotesByDay !== "object") d.elimVotesByDay = {};
              const candIdxs = Array.isArray(d.elimCandidatesByDay && d.elimCandidatesByDay[f.day]) ? d.elimCandidatesByDay[f.day] : [];
              const voters = aliveIdxs.length;
              const eligibleVoters = Math.max(0, voters - 1);
              const elimThreshold = Math.floor(eligibleVoters / 2) + 1;
              // No defendants (no one reached threshold) => nothing to eliminate, allow advancing.
              if (!candIdxs.length) {
                d.elimVotesByDay[f.day] = {};
                d.elimLeadersByDay = (d.elimLeadersByDay && typeof d.elimLeadersByDay === "object") ? d.elimLeadersByDay : {};
                d.elimLeadersByDay[f.day] = [];
                d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
                d.elimPickedByDay[f.day] = null;
                f.draft = d;
                addFlowEvent("day_elim", { counts: {}, best: 0, leaders: [] });
                try { addFlowEvent("day_elim_out", { out: null }); } catch {}
                try { applyDayElimFromPayload(f, { out: null }); } catch {}
                saveState(appState);
                return true;
              }
              const maxVotes = Math.max(0, aliveIdxs.length - 1);
              const counts = {};
              let best = 0;
              for (const idx of candIdxs) {
                const el = document.getElementById(`fl_elim_${idx}`);
                const raw = el ? el.value : "0";
                const n = Math.max(0, Math.min(maxVotes, Math.floor(Number(raw || 0))));
                counts[idx] = Number.isFinite(n) ? n : 0;
                best = Math.max(best, counts[idx] || 0);
              }
              d.elimVotesByDay[f.day] = counts;
              const leaders = Object.keys(counts)
                .map((k) => ({ idx: parseInt(k, 10), v: counts[k] }))
                .filter((x) => Number.isFinite(x.idx))
                .sort((a, b) => (b.v - a.v) || (a.idx - b.idx));
              const top = leaders.filter((x) => x.v === best && best > 0);
              d.elimLeadersByDay = (d.elimLeadersByDay && typeof d.elimLeadersByDay === "object") ? d.elimLeadersByDay : {};
              d.elimLeadersByDay[f.day] = top.map((x) => x.idx);
              d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
              const prevPicked = (d.elimPickedByDay && d.elimPickedByDay[f.day] !== undefined) ? d.elimPickedByDay[f.day] : null;
              const prevPickedIdxRaw = Number.isFinite(Number(prevPicked)) ? parseInt(prevPicked, 10) : null;
              const prevPickedIdx = (prevPickedIdxRaw !== null && Number.isFinite(prevPickedIdxRaw)) ? prevPickedIdxRaw : (() => {
                try {
                  const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_elim_draw" && Number(e.day) === Number(f.day));
                  const p = ev && ev.data ? ev.data.picked : null;
                  const n = parseInt(String(p ?? ""), 10);
                  return Number.isFinite(n) ? n : null;
                } catch {
                  return null;
                }
              })();
              const keptPicked = (top.length === 1)
                ? top[0].idx
                : (top.length > 1 && prevPickedIdx !== null && top.some((x) => x.idx === prevPickedIdx))
                  ? prevPickedIdx
                  : null;
              d.elimPickedByDay[f.day] = keptPicked;
              f.draft = d;
              addFlowEvent("day_elim", { counts, best, leaders: top.map((x) => x.idx) });
              // Deaths are NOT applied live while votes are being entered.
              // The actual elimination is committed when the user presses Next (commitElimFromUI).
              saveState(appState);
              return true;
            } catch {
              return false;
            }
          };
          const snapshotNightActionsFromUI = () => {
            try {
              // Only when relevant controls exist (night_run page).
              const hasAny =
                document.getElementById("fl_mafia_shot") ||
                document.getElementById("fl_doctor_save") ||
                document.getElementById("fl_det_query") ||
                document.getElementById("fl_pro_shot") ||
                document.getElementById("fl_bomb_target") ||
                document.getElementById("fl_magician_disable") ||
                document.getElementById("fl_zodiac_shot") ||
                document.getElementById("fl_ocean_wake") ||
                document.getElementById("fl_bomb_code") ||
                document.getElementById("fl_kane_mark") ||
                document.getElementById("fl_const_revive") ||
                document.getElementById("fl_nost_pick3") ||
                document.getElementById("fl_heir_pick") ||
                document.getElementById("fl_herb_poison") ||
                document.getElementById("fl_herb_antidote") ||
                document.getElementById("fl_armor_target") ||
                document.getElementById("fl_lecter_save") ||
                document.getElementById("fl_joker_target") ||
                document.getElementById("fl_swindler_target") ||
                document.getElementById("fl_researcher_link") ||
                document.getElementById("fl_natasha_target") ||
                document.getElementById("fl_sniper_shot") ||
                document.getElementById("fl_negotiator_target") ||
                document.getElementById("fl_kadkhoda_target") ||
                document.getElementById("fl_hacker_block") ||
                document.getElementById("fl_guide_target") ||
                document.getElementById("fl_bodyguard_protect") ||
                document.getElementById("fl_minemaker_target") ||
                document.getElementById("fl_lawyer_target") ||
                document.getElementById("fl_nato_target") ||
                document.getElementById("fl_nato_role_guess");
              if (!hasAny) return false;

              const mafiaShot = (document.getElementById("fl_mafia_shot") || {}).value || "";
              const doctorSave = (document.getElementById("fl_doctor_save") || {}).value || "";
              const detQuery = (document.getElementById("fl_det_query") || {}).value || "";
              const proShot = (document.getElementById("fl_pro_shot") || {}).value || "";
              const bombTarget = (document.getElementById("fl_bomb_target") || {}).value || "";
              const bombCode = (document.getElementById("fl_bomb_code") || {}).value || "";
              const magicianDisable = (document.getElementById("fl_magician_disable") || {}).value || "";
              const zodiacShot = (document.getElementById("fl_zodiac_shot") || {}).value || "";
              const kaneMark = (document.getElementById("fl_kane_mark") || {}).value || "";
              const constantineRevive = (document.getElementById("fl_const_revive") || {}).value || "";
              const heirPick = (document.getElementById("fl_heir_pick") || {}).value || "";
              const herbalistPoison = (document.getElementById("fl_herb_poison") || {}).value || "";
              const herbalistAntidote = (document.getElementById("fl_herb_antidote") || {}).value || "";
              const armorsmithArmor = (document.getElementById("fl_armor_target") || {}).value || "";
              const lecterSave = (document.getElementById("fl_lecter_save") || {}).value || "";
              const jokerTarget = (document.getElementById("fl_joker_target") || {}).value || "";
              const swindlerTarget = (document.getElementById("fl_swindler_target") || {}).value || "";
              const researcherLink = (document.getElementById("fl_researcher_link") || {}).value || "";
              const natashaTarget = (document.getElementById("fl_natasha_target") || {}).value || "";
              const sniperShot = (document.getElementById("fl_sniper_shot") || {}).value || "";
              const negotiatorTarget = (document.getElementById("fl_negotiator_target") || {}).value || "";
              const kadkhodaTarget = (document.getElementById("fl_kadkhoda_target") || {}).value || "";
              const hackerBlock = (document.getElementById("fl_hacker_block") || {}).value || "";
              const guideTarget = (document.getElementById("fl_guide_target") || {}).value || "";
              const bodyguardProtect = (document.getElementById("fl_bodyguard_protect") || {}).value || "";
              const minemakerTarget = (document.getElementById("fl_minemaker_target") || {}).value || "";
              const lawyerTarget = (document.getElementById("fl_lawyer_target") || {}).value || "";
              const natoTarget = (document.getElementById("fl_nato_target") || {}).value || "";
              const natoRoleGuess = (document.getElementById("fl_nato_role_guess") || {}).value || "";
              const nostPick3 = (() => {
                const el = document.getElementById("fl_nost_pick3");
                if (!el) return [];
                const s = String(el.value || "").trim();
                if (!s) return [];
                return s.split(",")
                  .map((x) => parseInt(String(x || "").trim(), 10))
                  .filter((x) => Number.isFinite(x))
                  .slice(0, 3);
              })();
              const oceanWake = (() => {
                const el = document.getElementById("fl_ocean_wake");
                if (!el) return [];
                try {
                  if (String((el.tagName || "")).toUpperCase() === "SELECT" && el.selectedOptions) {
                    return Array.from(el.selectedOptions)
                      .map((o) => parseInt(o.value, 10))
                      .filter((x) => Number.isFinite(x));
                  }
                } catch {}
                // fallback
                const s = String(el.value || "").trim();
                if (!s) return [];
                return s.split(",").map((x) => parseInt(String(x || "").trim(), 10)).filter((x) => Number.isFinite(x));
              })();

              // Persist drafts
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              // Save per-night actions so UI can repopulate reliably.
              const nk = String(f.day || 1);
              const d = f.draft;
              if (!d.nightActionsByNight || typeof d.nightActionsByNight !== "object") d.nightActionsByNight = {};
              const per = (d.nightActionsByNight[nk] && typeof d.nightActionsByNight[nk] === "object") ? d.nightActionsByNight[nk] : {};
              per.mafiaShot = mafiaShot === "" ? null : parseInt(mafiaShot, 10);
              per.doctorSave = doctorSave === "" ? null : parseInt(doctorSave, 10);
              per.detectiveQuery = detQuery === "" ? null : parseInt(detQuery, 10);
              per.professionalShot = proShot === "" ? null : parseInt(proShot, 10);
              per.bombTarget = bombTarget === "" ? null : parseInt(bombTarget, 10);
              per.bombCode = String(bombCode || "");
              per.magicianDisable = magicianDisable === "" ? null : parseInt(magicianDisable, 10);
              per.zodiacShot = zodiacShot === "" ? null : parseInt(zodiacShot, 10);
              per.oceanWake = Array.isArray(oceanWake) ? oceanWake : [];
              per.kaneMark = kaneMark === "" ? null : parseInt(kaneMark, 10);
              per.constantineRevive = constantineRevive === "" ? null : parseInt(constantineRevive, 10);
              per.nostPick3 = Array.isArray(nostPick3) ? nostPick3 : [];
              per.heirPick = heirPick === "" ? null : parseInt(heirPick, 10);
              per.herbalistPoison = herbalistPoison === "" ? null : parseInt(herbalistPoison, 10);
              per.herbalistAntidote = herbalistAntidote === "" ? null : parseInt(herbalistAntidote, 10);
              per.armorsmithArmor = armorsmithArmor === "" ? null : parseInt(armorsmithArmor, 10);
              per.lecterSave = lecterSave === "" ? null : parseInt(lecterSave, 10);
              per.jokerTarget = jokerTarget === "" ? null : parseInt(jokerTarget, 10);
              per.swindlerTarget = swindlerTarget === "" ? null : parseInt(swindlerTarget, 10);
              per.researcherLink = researcherLink === "" ? null : parseInt(researcherLink, 10);
              per.natashaTarget = natashaTarget === "" ? null : parseInt(natashaTarget, 10);
              per.sniperShot = sniperShot === "" ? null : parseInt(sniperShot, 10);
              per.negotiatorTarget = negotiatorTarget === "" ? null : parseInt(negotiatorTarget, 10);
              per.kadkhodaTarget = kadkhodaTarget === "" ? null : parseInt(kadkhodaTarget, 10);
              per.hackerBlock = hackerBlock === "" ? null : parseInt(hackerBlock, 10);
              per.guideTarget = guideTarget === "" ? null : parseInt(guideTarget, 10);
              per.bodyguardProtect = bodyguardProtect === "" ? null : parseInt(bodyguardProtect, 10);
              per.minemakerTarget = minemakerTarget === "" ? null : parseInt(minemakerTarget, 10);
              per.lawyerTarget = lawyerTarget === "" ? null : parseInt(lawyerTarget, 10);
              per.natoTarget = natoTarget === "" ? null : parseInt(natoTarget, 10);
              per.natoRoleGuess = String(natoRoleGuess || "");
              d.nightActionsByNight[nk] = per;
              // keep existing legacy draft fields too
              d.bombCode = String(bombCode || "");
              d.oceanWake = Array.isArray(oceanWake) ? oceanWake : [];
              f.draft = d;
              
              // Track Armorsmith self-armor consumption (once per game), but allow clearing.
              try {
                if (per.armorsmithArmor !== null && Number.isFinite(Number(per.armorsmithArmor))) {
                  const armorIdx = (() => {
                    for (let i = 0; i < (appState.draw.players || []).length; i++) {
                      const p = appState.draw.players[i];
                      if (p && p.roleId === "armorsmith" && p.alive !== false) return i;
                    }
                    return null;
                  })();
                  if (armorIdx !== null && parseInt(per.armorsmithArmor, 10) === armorIdx) {
                    d.armorsmithSelfUsed = true;
                    f.draft = d;
                  }
                }
              } catch {}

              const payload = {
                mafiaShot: mafiaShot === "" ? null : parseInt(mafiaShot, 10),
                doctorSave: doctorSave === "" ? null : parseInt(doctorSave, 10),
                detectiveQuery: detQuery === "" ? null : parseInt(detQuery, 10),
                professionalShot: proShot === "" ? null : parseInt(proShot, 10),
                bombTarget: bombTarget === "" ? null : parseInt(bombTarget, 10),
                bombCode: String(bombCode || "").trim() || null,
                magicianDisable: magicianDisable === "" ? null : parseInt(magicianDisable, 10),
                zodiacShot: zodiacShot === "" ? null : parseInt(zodiacShot, 10),
                oceanWake: (Array.isArray(oceanWake) && oceanWake.length) ? oceanWake : null,
                kaneMark: kaneMark === "" ? null : parseInt(kaneMark, 10),
                constantineRevive: constantineRevive === "" ? null : parseInt(constantineRevive, 10),
                nostPick3: (Array.isArray(nostPick3) && nostPick3.length) ? nostPick3 : null,
                heirPick: heirPick === "" ? null : parseInt(heirPick, 10),
                herbalistPoison: herbalistPoison === "" ? null : parseInt(herbalistPoison, 10),
                herbalistAntidote: herbalistAntidote === "" ? null : parseInt(herbalistAntidote, 10),
                armorsmithArmor: armorsmithArmor === "" ? null : parseInt(armorsmithArmor, 10),
                lecterSave: lecterSave === "" ? null : parseInt(lecterSave, 10),
                jokerTarget: jokerTarget === "" ? null : parseInt(jokerTarget, 10),
                swindlerTarget: swindlerTarget === "" ? null : parseInt(swindlerTarget, 10),
                researcherLink: researcherLink === "" ? null : parseInt(researcherLink, 10),
                natashaTarget: natashaTarget === "" ? null : parseInt(natashaTarget, 10),
                sniperShot: sniperShot === "" ? null : parseInt(sniperShot, 10),
                negotiatorTarget: negotiatorTarget === "" ? null : parseInt(negotiatorTarget, 10),
                kadkhodaTarget: kadkhodaTarget === "" ? null : parseInt(kadkhodaTarget, 10),
                hackerBlock: hackerBlock === "" ? null : parseInt(hackerBlock, 10),
                guideTarget: guideTarget === "" ? null : parseInt(guideTarget, 10),
                bodyguardProtect: bodyguardProtect === "" ? null : parseInt(bodyguardProtect, 10),
                minemakerTarget: minemakerTarget === "" ? null : parseInt(minemakerTarget, 10),
                lawyerTarget: lawyerTarget === "" ? null : parseInt(lawyerTarget, 10),
                natoTarget: natoTarget === "" ? null : parseInt(natoTarget, 10),
                natoRoleGuess: String(natoRoleGuess || "") || null,
              };
              addFlowEvent("night_actions", payload);

              // NOTE: Bomb is planted at NIGHT, but becomes "active" on the NEXT day.
              // So we DO NOT toggle `f.bombActive` here. It will be set during the night→day transition.

              // Apply mafia shot immediately (so closing the UI still shows correct alive/dead).
              // IMPORTANT: Night kills are resolved at the END of the night (night -> day),
              // so being shot does NOT prevent a role from acting that same night.
              // (Disables like Magician/Matador can still block actions that night.)

              // Detective result (for display)
              try {
                const key = String(f.day || 1);
                const d = f.draft || {};
                if (!d.detectiveResultByNight || typeof d.detectiveResultByNight !== "object") d.detectiveResultByNight = {};

                if (payload.detectiveQuery !== null && appState.draw && appState.draw.players && appState.draw.players[payload.detectiveQuery]) {
                  const tIdx = payload.detectiveQuery;
                  const tr = (appState.draw.players[tIdx] && appState.draw.players[tIdx].roleId) ? appState.draw.players[tIdx].roleId : "citizen";
                  // If detective is disabled by Magician this night, they always receive a false (negative) result.
                  const detPlayerIdx2 = (() => {
                    try {
                      for (let i = 0; i < (appState.draw.players || []).length; i++) {
                        const p = appState.draw.players[i];
                        if (p && p.roleId === "detective") return i;
                      }
                    } catch {}
                    return null;
                  })();
                  const detIsDisabled = (
                    payload.magicianDisable !== null && payload.magicianDisable !== undefined &&
                    Number.isFinite(Number(payload.magicianDisable)) &&
                    detPlayerIdx2 !== null && parseInt(payload.magicianDisable, 10) === detPlayerIdx2
                  );
                  // Check if JokerMafia is flipping this target's result tonight.
                  const jokerFlipped = (
                    payload.jokerTarget !== null && payload.jokerTarget !== undefined &&
                    Number.isFinite(Number(payload.jokerTarget)) &&
                    parseInt(payload.jokerTarget, 10) === tIdx
                  );
                  // Swindler targets the detective player — if it guessed correctly, ALL of
                  // the detective's results that night are forced to negative (citizen).
                  const swindlerHit = (
                    payload.swindlerTarget !== null && payload.swindlerTarget !== undefined &&
                    Number.isFinite(Number(payload.swindlerTarget)) &&
                    detPlayerIdx2 !== null &&
                    parseInt(payload.swindlerTarget, 10) === detPlayerIdx2
                  );
                  let isMafia = detIsDisabled ? false : detectiveInquiryIsMafia(tr);
                  if (swindlerHit) isMafia = false; // swindler makes result appear as citizen
                  if (jokerFlipped) isMafia = !isMafia; // joker flips the (possibly already swindled) result
                  // Track JokerMafia usage (max 2 per game)
                  try {
                    if (!d.jokerUsed || !Array.isArray(d.jokerUsed)) d.jokerUsed = [];
                    const nightNum = f.day || 1;
                    if (jokerFlipped) {
                      if (!d.jokerUsed.includes(nightNum)) d.jokerUsed.push(nightNum);
                    } else {
                      // User cleared the joker target — remove this night from used list
                      d.jokerUsed = d.jokerUsed.filter((n) => Number(n) !== nightNum);
                    }
                    f.draft = d;
                  } catch {}
                  d.detectiveResultByNight[key] = { target: tIdx, isMafia, at: Date.now() };
                  f.draft = d;
                  addFlowEvent("detective_query", { target: tIdx, isMafia });

                  // Update UI immediately (no full re-render needed).
                  try {
                    const el = document.getElementById("fl_det_result");
                    if (el) {
                      const thumb = isMafia ? "👍" : "👎";
                      const label = (appLang === "fa") ? (isMafia ? "مافیا" : "شهروند") : (isMafia ? "Mafia" : "Citizen");
                      const pre = (appLang === "fa") ? "نتیجه استعلام: " : "Result: ";
                      el.style.display = "";
                      el.textContent = `${pre}${thumb} ${label}`;
                    }
                  } catch {}
                } else {
                  // If cleared, hide/remove the result for this night so we don't show stale values.
                  d.detectiveResultByNight[key] = null;
                  f.draft = d;
                  try {
                    const el = document.getElementById("fl_det_result");
                    if (el) { el.style.display = "none"; el.textContent = ""; }
                  } catch {}
                  try { addFlowEvent("detective_query", { target: null, isMafia: null, cleared: true }); } catch {}
                }
              } catch {}

              // Nostradamus result (intro night only): count how many of the 3 picks are actually Mafia.
              try {
                if ((f.day || 1) === 1) {
                  const nostKey = String(f.day || 1);
                  const nd = f.draft || {};
                  if (!nd.nostResultByNight || typeof nd.nostResultByNight !== "object") nd.nostResultByNight = {};
                  const picks = Array.isArray(payload.nostPick3) ? payload.nostPick3 : [];
                  if (picks.length > 0) {
                    let mafiaCount = 0;
                    for (const idx of picks) {
                      const p = appState.draw && appState.draw.players && appState.draw.players[idx];
                      const rid = (p && p.roleId) ? p.roleId : "citizen";
                      // Same rule as detective inquiry: Godfather/Don/MafiaBoss/Alcapone appear as city.
                      if (rid === "godfather" || rid === "mafiaBoss" || rid === "danMafia" || rid === "alcapone") continue;
                      const teamFa = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
                      if (teamFa === "مافیا") mafiaCount++;
                    }
                    nd.nostResultByNight[nostKey] = { picks, mafiaCount, at: Date.now() };
                    f.draft = nd;
                    try {
                      const el = document.getElementById("fl_nost_result");
                      if (el) {
                        const mLabel = appLang === "fa"
                          ? `نتیجه: ${mafiaCount} نفر از این ۳ نفر مافیا هستند.`
                          : `Result: ${mafiaCount} of the 3 are Mafia.`;
                        el.style.display = "";
                        el.textContent = mLabel;
                      }
                    } catch {}
                  } else {
                    nd.nostResultByNight[nostKey] = null;
                    f.draft = nd;
                    try {
                      const el = document.getElementById("fl_nost_result");
                      if (el) { el.style.display = "none"; el.textContent = ""; }
                    } catch {}
                  }
                }
              } catch {}

              // Track NATO role-guess usage per-night so back-navigation keeps the night editable.
              try {
                const gd2 = f.draft || {};
                const _natoNight = f.day || 1;
                if (natoTarget !== "" && natoRoleGuess !== "") {
                  gd2.natoUsedNight = _natoNight;
                  f.draft = gd2;
                } else if ((gd2.natoUsedNight != null) && Number(gd2.natoUsedNight) === _natoNight) {
                  // User cleared the guess on the same night it was set — unset it.
                  gd2.natoUsedNight = null;
                  f.draft = gd2;
                }
              } catch {}

              // Track Minemaker mine placement (once per game).
              try {
                const gd3 = f.draft || {};
                if (minemakerTarget !== "") {
                  gd3.minemakerUsed = true;
                  gd3.minemakerMine = parseInt(minemakerTarget, 10);
                  f.draft = gd3;
                }
              } catch {}

              // Track Lawyer protection usage (once per game).
              try {
                const gd4 = f.draft || {};
                if (lawyerTarget !== "") {
                  gd4.lawyerUsed = true;
                  f.draft = gd4;
                }
              } catch {}

              // Guide inquiry result (like detective, computed and shown inline).
              try {
                const guideKey = String(f.day || 1);
                const gd5 = f.draft || {};
                if (!gd5.guideResultByNight || typeof gd5.guideResultByNight !== "object") gd5.guideResultByNight = {};
                if (guideTarget !== "" && appState.draw && appState.draw.players && appState.draw.players[parseInt(guideTarget, 10)]) {
                  const tIdx = parseInt(guideTarget, 10);
                  const tr = (appState.draw.players[tIdx] && appState.draw.players[tIdx].roleId) ? appState.draw.players[tIdx].roleId : "citizen";
                  const isMafia = detectiveInquiryIsMafia(tr);
                  gd5.guideResultByNight[guideKey] = { target: tIdx, isMafia, at: Date.now() };
                  f.draft = gd5;
                  try {
                    const el = document.getElementById("fl_guide_result");
                    if (el) {
                      const resultText = isMafia
                        ? (appLang === "fa" ? "نتیجه: مافیا — آن عضو مافیا بیدار می‌شود و هویت راهنما را می‌شناسد." : "Result: Mafia — that member wakes and learns the Guide's identity.")
                        : (appLang === "fa" ? "نتیجه: شهروند — راهنما استعلام منفی دریافت می‌کند." : "Result: Citizen — Guide receives a negative inquiry result.");
                      el.style.display = "";
                      el.textContent = resultText;
                    }
                  } catch {}
                } else {
                  gd5.guideResultByNight[guideKey] = null;
                  f.draft = gd5;
                  try {
                    const el = document.getElementById("fl_guide_result");
                    if (el) { el.style.display = "none"; el.textContent = ""; }
                  } catch {}
                }
              } catch {}

              saveState(appState);
              return true;
            } catch {
              return false;
            }
          };
          // Let closing the tool modal auto-save Flow inputs.
          try {
            window.__flowOnClose = () => {
              try {
                // Night actions
                if (
                  document.getElementById("fl_mafia_shot") ||
                  document.getElementById("fl_doctor_save") ||
                  document.getElementById("fl_det_query") ||
                  document.getElementById("fl_pro_shot") ||
                  document.getElementById("fl_bomb_target") ||
                  document.getElementById("fl_magician_disable") ||
                  document.getElementById("fl_zodiac_shot") ||
                  document.getElementById("fl_ocean_wake") ||
                  document.getElementById("fl_bomb_code")
                ) {
                  snapshotNightActionsFromUI();
                }
              } catch {}
              // Day voting: candidates saved live on each button click — no auto-save needed here.
              try {
                // Day elimination votes
                if (document.querySelector('select[id^="fl_elim_"]')) {
                  snapshotElimVotesFromUI();
                }
              } catch {}
            };
          } catch {}
          const commitElimFromUI = () => {
            try {
              const d = f.draft || {};
              if (!d.elimVotesByDay || typeof d.elimVotesByDay !== "object") d.elimVotesByDay = {};
              const candIdxs = Array.isArray(d.elimCandidatesByDay && d.elimCandidatesByDay[f.day]) ? d.elimCandidatesByDay[f.day] : [];
              // No defendants today => allow advancing.
              if (!candIdxs.length) {
                try { addFlowEvent("day_elim", { counts: {}, best: 0, leaders: [] }); } catch {}
                try { addFlowEvent("day_elim_out", { out: null }); } catch {}
                try { applyDayElimFromPayload(f, { out: null }); } catch {}
                try { saveState(appState); } catch {}
                return true;
              }

              const maxVotes = Math.max(0, aliveIdxs.length - 1);
              const counts = {};
              let best = 0;
              for (const idx of candIdxs) {
                const el = document.getElementById(`fl_elim_${idx}`);
                const raw = el ? el.value : "0";
                const n = Math.max(0, Math.min(maxVotes, Math.floor(Number(raw || 0))));
                counts[idx] = Number.isFinite(n) ? n : 0;
                best = Math.max(best, counts[idx] || 0);
              }
              d.elimVotesByDay[f.day] = counts;

              // Single defendant: require majority to be voted out.
              if (candIdxs.length === 1) {
                const voters = aliveIdxs.length;
                const eligibleVoters = Math.max(0, voters - 1);
                const threshold = Math.floor(eligibleVoters / 2) + 1;
                const only = candIdxs[0];
                const v = counts[only] || 0;
                const out = (v >= threshold) ? only : null;
                d.elimLeadersByDay = (d.elimLeadersByDay && typeof d.elimLeadersByDay === "object") ? d.elimLeadersByDay : {};
                d.elimLeadersByDay[f.day] = (best > 0) ? [only] : [];
                d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
                d.elimPickedByDay[f.day] = out;
                f.draft = d;
                addFlowEvent("day_elim", { counts, best, leaders: (best > 0) ? [only] : [] });
                addFlowEvent("day_elim_out", { out, auto: true, single: true });
                try { applyDayElimFromPayload(f, { out }); } catch {}
                try { renderCast(); } catch {}
                try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
                saveState(appState);
                return true;
              }

              const leaders = Object.keys(counts)
                .map((k) => ({ idx: parseInt(k, 10), v: counts[k] }))
                .filter((x) => Number.isFinite(x.idx))
                .sort((a, b) => (b.v - a.v) || (a.idx - b.idx));
              const top = leaders.filter((x) => x.v === best && best > 0);
              d.elimLeadersByDay = (d.elimLeadersByDay && typeof d.elimLeadersByDay === "object") ? d.elimLeadersByDay : {};
              d.elimLeadersByDay[f.day] = top.map((x) => x.idx);
              d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
              const prevPicked = (d.elimPickedByDay && d.elimPickedByDay[f.day] !== undefined) ? d.elimPickedByDay[f.day] : null;
              const prevPickedIdxRaw = Number.isFinite(Number(prevPicked)) ? parseInt(prevPicked, 10) : null;
              const prevPickedIdx = (prevPickedIdxRaw !== null && Number.isFinite(prevPickedIdxRaw)) ? prevPickedIdxRaw : (() => {
                try {
                  const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_elim_draw" && Number(e.day) === Number(f.day));
                  const p = ev && ev.data ? ev.data.picked : null;
                  const n = parseInt(String(p ?? ""), 10);
                  return Number.isFinite(n) ? n : null;
                } catch {
                  return null;
                }
              })();
              const keptPicked = (top.length === 1)
                ? top[0].idx
                : (top.length > 1 && prevPickedIdx !== null && top.some((x) => x.idx === prevPickedIdx))
                  ? prevPickedIdx
                  : null;
              d.elimPickedByDay[f.day] = keptPicked;
              f.draft = d;

              addFlowEvent("day_elim", { counts, best, leaders: top.map((x) => x.idx) });
              saveState(appState);

              // No one is eliminated (e.g., scenario allows no-out, or votes are all 0): allow advancing.
              if (!(best > 0) || !top.length) {
                try { addFlowEvent("day_elim_out", { out: null }); } catch {}
                try { applyDayElimFromPayload(f, { out: null }); } catch {}
                return true;
              }

              // Single winner: apply elimination and allow advancing.
              if (top.length === 1 && best > 0) {
                try { applyDayElimFromPayload(f, { out: top[0].idx }); } catch {}
                addFlowEvent("day_elim_out", { out: top[0].idx, auto: true });
                try { renderCast(); } catch {}
                try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
                saveState(appState);
                return true;
              }

              // Tie: if Draw already picked someone, allow advancing; otherwise require Draw.
              if (top.length > 1 && keptPicked !== null) {
                try { applyDayElimFromPayload(f, { out: keptPicked }); } catch {}
                addFlowEvent("day_elim_out", { out: keptPicked, draw: true, via: "next" });
                try { renderCast(); } catch {}
                try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
                saveState(appState);
                return true;
              }

              showFlowTool();
              return false;
            } catch {
              return false;
            }
          };

          $("fl_next").onclick = () => {
            if (cur && cur.id === "night_run") {
              // Validation: if Bomber planted a bomb, code/password is required.
              try {
                const bt = (document.getElementById("fl_bomb_target") || {}).value || "";
                const bc = (document.getElementById("fl_bomb_code") || {}).value || "";
                const hasTarget = bt !== "" && Number.isFinite(Number(bt));
                const hasCode = bc !== "" && Number.isFinite(Number(bc));
                if (hasTarget && !hasCode) {
                  const sel = document.getElementById("fl_bomb_code");
                  const note = document.getElementById("fl_bomb_code_note");
                  if (sel) {
                    sel.style.borderColor = "rgba(255,92,116,.75)";
                    sel.style.boxShadow = "0 0 0 3px rgba(255,92,116,.18)";
                    try { sel.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
                  }
                  if (note) {
                    note.style.display = "block";
                    note.textContent = (appLang === "fa")
                      ? "برای بمب، «کد/رمز» را انتخاب کنید (۱ تا ۴)."
                      : "Pick a bomb code/password (1–4) before continuing.";
                  }
                  return;
                }
              } catch {}
              nextFlowStep();
              return;
            }
            if (cur && cur.id === "day_bomb") {
              const applied = applyBombResultFromForm();
              const r0 = (f.draft && f.draft.bombResolveByDay && f.draft.bombResolveByDay[String(f.day)]) ? f.draft.bombResolveByDay[String(f.day)] : null;
              if (!applied && !(r0 && r0.resolved)) {
                showFlowTool();
                return;
              }
              try {
                const stepsAfter = getFlowSteps(f);
                const voteIdx = stepsAfter.findIndex((s) => s && s.id === "day_vote");
                f.step = (voteIdx >= 0) ? voteIdx : 0;
                saveState(appState);
              } catch {}
              showFlowTool();
              return;
            }
            if (cur && cur.id === "day_vote") {
              commitVoteFromUI();
              nextFlowStep();
              return;
            }
            if (cur && cur.id === "day_guns") {
              // If a bomb is active today, validate that the result has been resolved before advancing.
              const brecChk = (f.draft && f.draft.bombByDay && f.draft.bombByDay[String(f.day)]) ? f.draft.bombByDay[String(f.day)] : null;
              const hasBombOnNext = !!(f.bombActive || (brecChk && brecChk.target !== null && brecChk.target !== undefined));
              if (hasBombOnNext) {
                const applied = applyBombResultFromForm();
                const r0chk = (f.draft && f.draft.bombResolveByDay && f.draft.bombResolveByDay[String(f.day)]) ? f.draft.bombResolveByDay[String(f.day)] : null;
                if (!applied && !(r0chk && r0chk.resolved)) {
                  showFlowTool();
                  return;
                }
              }
              nextFlowStep();
              return;
            }
            if (cur && cur.id === "day_elim") {
              const ok = commitElimFromUI();
              if (ok) nextFlowStep();
              return;
            }
            nextFlowStep();
          };

          // Auto-save: persist changes immediately when user selects values.
          if (cur && (cur.id === "day_bomb" || cur.id === "day_guns")) {
            try {
              const saveBombDraft = () => {
                try {
                  const d = f.draft || {};
                  if (!d.bombResolveByDay || typeof d.bombResolveByDay !== "object") d.bombResolveByDay = {};
                  const r0 = (d.bombResolveByDay[String(f.day)] && typeof d.bombResolveByDay[String(f.day)] === "object")
                    ? d.bombResolveByDay[String(f.day)]
                    : {};
                  r0.guardSacrifice = !!(document.getElementById("fl_bomb_guard") && document.getElementById("fl_bomb_guard").checked);
                  r0.guardGuess = String(((document.getElementById("fl_bomb_guard_guess") || {}).value) || "").trim();
                  r0.targetGuess = String(((document.getElementById("fl_bomb_target_guess") || {}).value) || "").trim();
                  d.bombResolveByDay[String(f.day)] = r0;
                  f.draft = d;
                  saveState(appState);
                } catch {}
              };
              const els = ["fl_bomb_guard", "fl_bomb_guard_guess", "fl_bomb_target_guess"]
                .map((id) => document.getElementById(id))
                .filter(Boolean);
              els.forEach((el) => el.addEventListener("change", () => {
                saveBombDraft();
                if (applyBombResultFromForm()) bombApplyJustHappened = true;
                try { showFlowTool(); } catch {}
                bombApplyJustHappened = false;
              }));
            } catch {}
          }
          if (cur && cur.id === "day_vote") {
            try {
              const btns = document.querySelectorAll(".fl_vote_btn");
              btns.forEach((btn) => {
                btn.addEventListener("click", () => {
                  try {
                    const idx = parseInt(btn.dataset.idx, 10);
                    if (!Number.isFinite(idx)) return;
                    const d = f.draft || {};
                    if (!d.voteCandidatesByDay || typeof d.voteCandidatesByDay !== "object") d.voteCandidatesByDay = {};
                    const sel = Array.isArray(d.voteCandidatesByDay[f.day]) ? d.voteCandidatesByDay[f.day].slice() : [];
                    const pos = sel.indexOf(idx);
                    if (pos >= 0) sel.splice(pos, 1);
                    else sel.push(idx);
                    d.voteCandidatesByDay[f.day] = sel;
                    f.draft = d;
                    saveState(appState);
                    showFlowTool();
                  } catch {}
                });
              });
            } catch {}
          }
          if (cur && cur.id === "day_elim") {
            try {
              const els = document.querySelectorAll('select[id^="fl_elim_"]');
              els.forEach((el) => {
                el.addEventListener("change", () => {
                  try { snapshotElimVotesFromUI(); } catch {}
                  // Re-render so the result (and Draw visibility) updates immediately.
                  try { showFlowTool(); } catch {}
                });
              });
            } catch {}
          }
          if (cur && cur.id === "night_run") {
            const ids = [
              "fl_mafia_shot",
              "fl_doctor_save",
              "fl_det_query",
              "fl_pro_shot",
              "fl_bomb_target",
              "fl_magician_disable",
              "fl_zodiac_shot",
              "fl_ocean_wake",
              "fl_bomb_code",
              "fl_kane_mark",
              "fl_const_revive",
              "fl_heir_pick",
              "fl_herb_poison",
              "fl_herb_antidote",
              "fl_armor_target",
              "fl_lecter_save",
              "fl_joker_target",
              "fl_swindler_target",
              "fl_researcher_link",
              "fl_natasha_target",
              "fl_sniper_shot",
              "fl_negotiator_target",
              "fl_kadkhoda_target",
              "fl_hacker_block",
              "fl_guide_target",
              "fl_bodyguard_protect",
              "fl_minemaker_target",
              "fl_lawyer_target",
              "fl_nato_target",
              "fl_nato_role_guess",
            ];
            for (const id of ids) {
              const el = document.getElementById(id);
              if (!el) continue;
              const evt = "change";
              try {
                el.addEventListener(evt, () => {
                  snapshotNightActionsFromUI();
                  // Re-render when disable target changes so blocked actions get greyed/disabled correctly.
                  if (id === "fl_magician_disable") {
                    try { showFlowTool(); } catch {}
                  }
                  // Clear bomb code validation feedback when user selects a code/target.
                  if (id === "fl_bomb_code" || id === "fl_bomb_target") {
                    try {
                      const sel = document.getElementById("fl_bomb_code");
                      const note = document.getElementById("fl_bomb_code_note");
                      if (sel) { sel.style.borderColor = ""; sel.style.boxShadow = ""; }
                      if (note) { note.style.display = "none"; note.textContent = ""; }
                    } catch {}
                  }
                });
              } catch {}
            }
          }
          // mid_vote (legacy midday bomb page) removed

          const elimDrawBtn = document.getElementById("fl_elim_draw");
          if (elimDrawBtn) {
            elimDrawBtn.onclick = () => {
              const d = f.draft || {};
              const arr = (d.elimLeadersByDay && d.elimLeadersByDay[f.day]) ? d.elimLeadersByDay[f.day] : [];
              const ties = Array.isArray(arr) ? arr.slice().filter((x) => Number.isFinite(Number(x))) : [];
              if (!ties.length) return;
              const picked = ties[Math.floor(Math.random() * ties.length)];
              d.elimPickedByDay = (d.elimPickedByDay && typeof d.elimPickedByDay === "object") ? d.elimPickedByDay : {};
              d.elimPickedByDay[f.day] = picked;
              f.draft = d;
              addFlowEvent("day_elim_draw", { picked, ties });
              saveState(appState);
              showFlowTool();
              // Flash the result line so the moderator sees feedback even if the same player is re-drawn.
              try {
                const rl = document.getElementById("fl_elim_result_line");
                if (rl) {
                  rl.style.transition = "none";
                  rl.style.background = "rgba(99,179,237,.30)";
                  rl.style.borderRadius = "8px";
                  rl.style.padding = "4px 8px";
                  setTimeout(() => {
                    try {
                      rl.style.transition = "background .6s ease, padding .6s ease";
                      rl.style.background = "";
                      rl.style.padding = "";
                    } catch {}
                  }, 120);
                }
              } catch {}
            };
          }

          // (No separate "Out" button needed: elimination is applied on Save (single winner) or Draw (tie).)

          const giveGunBtn = document.getElementById("fl_gun_give");
          if (giveGunBtn) {
            giveGunBtn.onclick = () => {
              const toVal = (document.getElementById("fl_gun_give_to") || {}).value || "";
              const tp = (document.getElementById("fl_gun_type") || {}).value || "real";
              const note = document.getElementById("fl_gun_give_note");
              if (toVal === "") return;
              const idx = parseInt(toVal, 10);
              if (!Number.isFinite(idx)) return;
              const fromIdx = (() => {
                try {
                  const draw = appState.draw;
                  if (!draw || !draw.players) return null;
                  for (let i = 0; i < draw.players.length; i++) {
                    const p = draw.players[i];
                    if (p && p.roleId === "gunslinger" && p.alive !== false) return i;
                  }
                } catch {}
                return null;
              })();

              // If the gunner is disabled this night, block the give action.
              const currentDisabledIdx = (() => {
                try {
                  const ev3 = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
                  const p3 = ev3 && ev3.data ? ev3.data : null;
                  if (!p3 || p3.magicianDisable === null || p3.magicianDisable === undefined) return null;
                  const n3 = parseInt(p3.magicianDisable, 10);
                  return Number.isFinite(n3) ? n3 : null;
                } catch { return null; }
              })();
              if (fromIdx !== null && currentDisabledIdx !== null && currentDisabledIdx === fromIdx) {
                const note2 = document.getElementById("fl_gun_give_note");
                if (note2) { note2.style.display = "block"; note2.textContent = appLang === "fa" ? "تفنگدار در این شب غیرفعال است." : "Gunner is disabled this night."; }
                return;
              }

              // Night limits: (user request) no max total; keep max 1 real per night.
              const d = f.draft || {};
              const nightKey = String(f.day || 1);
              if (!d.nightGunGivesByNight || typeof d.nightGunGivesByNight !== "object") d.nightGunGivesByNight = {};
              let nightGives = Array.isArray(d.nightGunGivesByNight[nightKey]) ? d.nightGunGivesByNight[nightKey] : [];

              // Determine desired type (with self->fake rule and disabled-recipient rule).
              let type = (tp === "fake") ? "fake" : "real";
              if (fromIdx !== null && Number.isFinite(fromIdx) && fromIdx === idx) type = "fake";
              // If the recipient is disabled by Magician this night, downgrade real gun to fake.
              const disabledRecipient = (() => {
                try {
                  const ev2 = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
                  const p2 = ev2 && ev2.data ? ev2.data : null;
                  if (!p2 || p2.magicianDisable === null || p2.magicianDisable === undefined) return null;
                  const n2 = parseInt(p2.magicianDisable, 10);
                  return Number.isFinite(n2) ? n2 : null;
                } catch { return null; }
              })();
              if (disabledRecipient !== null && disabledRecipient === idx) type = "fake";

              // Replace/update existing give to same recipient (doesn't consume extra quota).
              const exAt = nightGives.findIndex((x) => x && Number.isFinite(Number(x.to)) && parseInt(x.to, 10) === idx);
              const realUsed = nightGives.filter((x, i) => x && x.type === "real" && i !== exAt).length;

              if (type === "real" && realUsed >= 1) {
                if (note) { note.style.display = "block"; note.textContent = t("tool.flow.guns.limit1Real"); }
                return;
              }

              const entry = { from: fromIdx, to: idx, type, at: Date.now() };
              if (exAt >= 0) nightGives[exAt] = entry;
              else nightGives = nightGives.concat([entry]);
              d.nightGunGivesByNight[nightKey] = nightGives;
              f.draft = d;

              // Gunslinger can give anyone a gun, but can only give themselves a fake gun.
              if (!f.guns || typeof f.guns !== "object") f.guns = {};
              f.guns[idx] = { type, used: false, givenAt: Date.now() };
              addFlowEvent("gun_give", { from: fromIdx, to: idx, type: f.guns[idx].type });
              saveState(appState);
              showFlowTool();
            };
          }

          // Remove a gun (undo mistakes)
          try {
            const rmBtns = document.querySelectorAll("[data-gun-rm]");
            rmBtns.forEach((btn) => {
              btn.addEventListener("click", () => {
                try {
                  const raw = btn.getAttribute("data-gun-rm");
                  const idx = parseInt(String(raw || ""), 10);
                  if (!Number.isFinite(idx)) return;
                  // Remove gun from holder
                  if (f.guns && typeof f.guns === "object") {
                    try { delete f.guns[idx]; } catch { f.guns[idx] = undefined; }
                  }
                  // Remove from per-night give tracking (all nights, to be safe)
                  const d = f.draft || {};
                  if (d.nightGunGivesByNight && typeof d.nightGunGivesByNight === "object") {
                    for (const nk of Object.keys(d.nightGunGivesByNight)) {
                      const arr = Array.isArray(d.nightGunGivesByNight[nk]) ? d.nightGunGivesByNight[nk] : [];
                      d.nightGunGivesByNight[nk] = arr.filter((x) => !(x && Number.isFinite(Number(x.to)) && parseInt(x.to, 10) === idx));
                    }
                  }
                  f.draft = d;
                  // Cancel the matching gun_give event instead of logging a remove
                  try {
                    if (Array.isArray(f.events)) {
                      const gi = f.events.findIndex((e) =>
                        e && e.kind === "gun_give" &&
                        e.phase === f.phase && e.day === f.day &&
                        e.data && Number.isFinite(Number(e.data.to)) &&
                        parseInt(e.data.to, 10) === idx
                      );
                      if (gi !== -1) {
                        f.events.splice(gi, 1);
                      } else {
                        addFlowEvent("gun_remove", { to: idx });
                      }
                    }
                  } catch { addFlowEvent("gun_remove", { to: idx }); }
                  saveState(appState);
                  showFlowTool();
                } catch {}
              });
            });
          } catch {}

          // Ocean team: add/remove via buttons (undo mistakes)
          const oceanAddBtn = document.getElementById("fl_ocean_add");
          if (oceanAddBtn) {
            oceanAddBtn.onclick = () => {
              try {
                const pick = (document.getElementById("fl_ocean_pick") || {}).value || "";
                if (pick === "") return;
                const idx = parseInt(pick, 10);
                if (!Number.isFinite(idx)) return;
                const d = f.draft || {};
                const nightKey = String(f.day || 1);
                // Persistent team (across all nights, max 2 total).
                if (!d.oceanTeam || !Array.isArray(d.oceanTeam)) d.oceanTeam = [];
                if (d.oceanTeam.length >= 2) return; // quota reached
                if (!d.oceanTeam.includes(idx)) d.oceanTeam.push(idx);
                // Track which night this member was added.
                if (!d.oceanWakeByNight || typeof d.oceanWakeByNight !== "object") d.oceanWakeByNight = {};
                const arr = Array.isArray(d.oceanWakeByNight[nightKey]) ? d.oceanWakeByNight[nightKey].slice() : [];
                if (!arr.includes(idx)) arr.push(idx);
                d.oceanWakeByNight[nightKey] = arr;
                f.draft = d;
                f.draft.oceanWake = arr; // compatibility mirror (current night's picks)
                try {
                  const hid = document.getElementById("fl_ocean_wake");
                  if (hid) hid.value = arr.join(",");
                } catch {}
                snapshotNightActionsFromUI();
                showFlowTool();
              } catch {}
            };
          }
          try {
            const oceanRmBtns = document.querySelectorAll("[data-ocean-rm]");
            oceanRmBtns.forEach((btn) => {
              btn.addEventListener("click", () => {
                try {
                  const raw = btn.getAttribute("data-ocean-rm");
                  const idx = parseInt(String(raw || ""), 10);
                  if (!Number.isFinite(idx)) return;
                  const d = f.draft || {};
                  const nightKey = String(f.day || 1);
                  // Remove from persistent team.
                  if (Array.isArray(d.oceanTeam)) {
                    d.oceanTeam = d.oceanTeam.filter((x) => parseInt(x, 10) !== idx);
                  }
                  // Remove from this night's tracking.
                  if (!d.oceanWakeByNight || typeof d.oceanWakeByNight !== "object") d.oceanWakeByNight = {};
                  const arr = Array.isArray(d.oceanWakeByNight[nightKey]) ? d.oceanWakeByNight[nightKey].slice() : [];
                  const next = arr.filter((x) => parseInt(x, 10) !== idx);
                  d.oceanWakeByNight[nightKey] = next;
                  f.draft = d;
                  f.draft.oceanWake = next;
                  try {
                    const hid = document.getElementById("fl_ocean_wake");
                    if (hid) hid.value = next.join(",");
                  } catch {}
                  snapshotNightActionsFromUI();
                  showFlowTool();
                } catch {}
              });
            });
          } catch {}

          // Nostradamus picks: add/remove (mobile-friendly)
          const nostAddBtn = document.getElementById("fl_nost_add");
          if (nostAddBtn) {
            nostAddBtn.onclick = () => {
              try {
                const pick = (document.getElementById("fl_nost_pick") || {}).value || "";
                if (pick === "") return;
                const idx = parseInt(pick, 10);
                if (!Number.isFinite(idx)) return;
                const nk = String(f.day || 1);
                const d = f.draft || {};
                if (!d.nightActionsByNight || typeof d.nightActionsByNight !== "object") d.nightActionsByNight = {};
                const per = (d.nightActionsByNight[nk] && typeof d.nightActionsByNight[nk] === "object") ? d.nightActionsByNight[nk] : {};
                const arr = Array.isArray(per.nostPick3) ? per.nostPick3.slice() : [];
                if (arr.length >= 3) return;
                if (!arr.includes(idx)) arr.push(idx);
                per.nostPick3 = arr.slice(0, 3);
                d.nightActionsByNight[nk] = per;
                f.draft = d;
                try {
                  const hid = document.getElementById("fl_nost_pick3");
                  if (hid) hid.value = per.nostPick3.join(",");
                } catch {}
                snapshotNightActionsFromUI();
                showFlowTool();
              } catch {}
            };
          }
          try {
            const nostRmBtns = document.querySelectorAll("[data-nost-rm]");
            nostRmBtns.forEach((btn) => {
              btn.addEventListener("click", () => {
                try {
                  const raw = btn.getAttribute("data-nost-rm");
                  const idx = parseInt(String(raw || ""), 10);
                  if (!Number.isFinite(idx)) return;
                  const nk = String(f.day || 1);
                  const d = f.draft || {};
                  if (!d.nightActionsByNight || typeof d.nightActionsByNight !== "object") d.nightActionsByNight = {};
                  const per = (d.nightActionsByNight[nk] && typeof d.nightActionsByNight[nk] === "object") ? d.nightActionsByNight[nk] : {};
                  const arr = Array.isArray(per.nostPick3) ? per.nostPick3.slice() : [];
                  const next = arr.filter((x) => parseInt(x, 10) !== idx);
                  per.nostPick3 = next.slice(0, 3);
                  d.nightActionsByNight[nk] = per;
                  f.draft = d;
                  try {
                    const hid = document.getElementById("fl_nost_pick3");
                    if (hid) hid.value = per.nostPick3.join(",");
                  } catch {}
                  snapshotNightActionsFromUI();
                  showFlowTool();
                } catch {}
              });
            });
          } catch {}

          // Inline Last Move draw (only present in day_elim when a player is picked)
          const lmElimBtn = document.getElementById("lm_draw_elim");
          if (lmElimBtn) {
            lmElimBtn.onclick = () => {
              try {
                const _lmBtnCfg = getScenarioConfig(getScenario());
                const supports = !!_lmBtnCfg.features?.lastMove;
                if (!supports) return;
                const lastMoveCards = _lmBtnCfg.eliminationCards || [];
                const used = new Set((appState.god && appState.god.lastMove && Array.isArray(appState.god.lastMove.used)) ? appState.god.lastMove.used : []);
                const remaining = lastMoveCards.filter((c) => !used.has(c.id));
                const note = document.getElementById("lm_note_elim");
                if (!remaining.length) {
                  if (note) {
                    note.style.display = "block";
                    note.textContent = t("tool.lastMove.allUsed");
                  }
                  return;
                }
                const picked = remaining[Math.floor(Math.random() * remaining.length)];
                if (!appState.god.lastMove || typeof appState.god.lastMove !== "object") appState.god.lastMove = { last: null, at: null, used: [] };
                if (!Array.isArray(appState.god.lastMove.used)) appState.god.lastMove.used = [];
                appState.god.lastMove.last = picked.id;
                appState.god.lastMove.at = Date.now();
                appState.god.lastMove.used.push(picked.id);
                saveState(appState);
                showFlowTool();
              } catch {}
            };
          }

          // UX: if gunslinger gives to self, force fake-only in dropdown.
          (function () {
            const toSel = document.getElementById("fl_gun_give_to");
            const typeSel = document.getElementById("fl_gun_type");
            if (!toSel || !typeSel) return;
            const realOpt = typeSel.querySelector('option[value="real"]');
            const giveBtn = document.getElementById("fl_gun_give");
            const adjust = () => {
              const tv = (toSel.value || "");
              const fidx = (() => {
                try {
                  const draw = appState.draw;
                  if (!draw || !draw.players) return null;
                  for (let i = 0; i < draw.players.length; i++) {
                    const p = draw.players[i];
                    if (p && p.roleId === "gunslinger" && p.alive !== false) return i;
                  }
                } catch {}
                return null;
              })();
              const tidx = tv === "" ? null : parseInt(tv, 10);
              const self = (fidx !== null && tidx !== null && Number.isFinite(fidx) && Number.isFinite(tidx) && fidx === tidx);
              const d = f.draft || {};
              const nightKey = String(f.day || 1);
              const nightGives = (d.nightGunGivesByNight && Array.isArray(d.nightGunGivesByNight[nightKey])) ? d.nightGunGivesByNight[nightKey] : [];
              const exAt = nightGives.findIndex((x) => x && Number.isFinite(Number(x.to)) && parseInt(x.to, 10) === tidx);
              const realUsed = nightGives.filter((x, i) => x && x.type === "real" && i !== exAt).length;
              // Disable real when self OR already used real quota (except editing existing real entry).
              if (realOpt) realOpt.disabled = !!self || (realUsed >= 1);
              if (self && typeSel.value === "real") typeSel.value = "fake";
              if (realUsed >= 1 && typeSel.value === "real") typeSel.value = "fake";

              // Give button is always enabled (no per-night max total).
              if (giveBtn) giveBtn.disabled = false;
            };
            try { toSel.addEventListener("change", adjust); } catch {}
            adjust();
          })();

          const fireGunBtn = document.getElementById("fl_gun_fire");
          if (fireGunBtn) {
            fireGunBtn.onclick = () => {
              const shVal = (document.getElementById("fl_gun_shooter") || {}).value || "";
              const tgVal = (document.getElementById("fl_gun_target") || {}).value || "";
              const note = document.getElementById("fl_gun_note");
              if (shVal === "" || tgVal === "") return;
              const shooter = parseInt(shVal, 10);
              const target = parseInt(tgVal, 10);
              if (!Number.isFinite(shooter) || !Number.isFinite(target)) return;
              const g = (f.guns && f.guns[shooter]) ? f.guns[shooter] : null;
              if (!g || g.used) return;

              // Capture alive state BEFORE marking dead so we can revert later.
              const targetPrevAlive = !!(draw.players[target] && draw.players[target].alive !== false);

              g.used = true;
              addFlowEvent("gun_shot", { shooter, target, type: g.type });

              // Track this shot for back-navigation revert.
              try {
                const dayKey = String(f.day || 1);
                if (!f.draft) f.draft = {};
                if (!f.draft.gunShotAppliedByDay || typeof f.draft.gunShotAppliedByDay !== "object") f.draft.gunShotAppliedByDay = {};
                if (!f.draft.gunShotAppliedByDay[dayKey] || typeof f.draft.gunShotAppliedByDay[dayKey] !== "object") f.draft.gunShotAppliedByDay[dayKey] = { shots: [] };
                if (!Array.isArray(f.draft.gunShotAppliedByDay[dayKey].shots)) f.draft.gunShotAppliedByDay[dayKey].shots = [];
                f.draft.gunShotAppliedByDay[dayKey].shots.push({ shooter, target, type: g.type, targetPrevAlive });
              } catch {}

              // Deaths are NOT applied immediately — they resolve when leaving this step (Next).
              // The pending shots list in the UI shows what has been recorded.
              saveState(appState);
              showFlowTool();
            };
          }

          // Undo an individual pending gun shot
          try {
            document.querySelectorAll("[data-gun-shot-rm]").forEach((btn) => {
              btn.addEventListener("click", () => {
                try {
                  const shooter = parseInt(btn.getAttribute("data-gun-shot-rm"), 10);
                  if (!Number.isFinite(shooter)) return;
                  const dayKey = String(f.day || 1);
                  const d = f.draft || {};
                  if (!d.gunShotAppliedByDay || !d.gunShotAppliedByDay[dayKey]) return;
                  const rec = d.gunShotAppliedByDay[dayKey];
                  if (Array.isArray(rec.shots)) {
                    rec.shots = rec.shots.filter((s) => parseInt(s.shooter, 10) !== shooter);
                  }
                  // Reset the gun's used flag so it can be re-fired
                  if (f.guns && f.guns[shooter]) f.guns[shooter].used = false;
                  // Remove the corresponding gun_shot event
                  if (Array.isArray(f.events)) {
                    f.events = f.events.filter((e) =>
                      !(e && e.kind === "gun_shot" &&
                        e.phase === f.phase && Number(e.day) === Number(f.day) &&
                        e.data && parseInt(e.data.shooter, 10) === shooter)
                    );
                  }
                  f.draft = d;
                  saveState(appState);
                  showFlowTool();
                } catch {}
              });
            });
          } catch {}

          // (No manual "Record actions" / bomb toggle buttons; changes auto-save.)
        }
