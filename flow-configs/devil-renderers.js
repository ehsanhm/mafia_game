/**
 * Renderers for the Devil scenario.
 *
 * These renderers deliberately keep game-state effects small and explicit:
 * Imp kills reuse mafiaShot, Monk protection reuses doctorSave, and Poisoner
 * disruption reuses magicianDisable. Clocktower information screens compute the
 * rules-based result from the current draw, with notes where Storyteller
 * discretion, poison, or registration can still matter.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  const DEVIL_ROLES = [
    "devilWasherwoman", "devilLibrarian", "devilInvestigator", "devilChef", "devilEmpath", "devilFortuneTeller", "devilUndertaker",
    "devilMonk", "devilRavenkeeper", "devilVirgin", "devilSlayer", "devilSoldier", "devilMayor",
    "devilButler", "devilDrunk", "devilRecluse", "devilSaint",
    "devilPoisoner", "devilSpy", "devilScarletWoman", "devilBaron", "devilImp",
  ];
  const MINION_ROLES = ["devilPoisoner", "devilSpy", "devilScarletWoman", "devilBaron", "devilMinion"];

  function tx(ctx, fa, en) {
    return ctx.appLang === "fa" ? fa : en;
  }

  function roleTypeLabel(ctx, type) {
    const labels = {
      townsfolk: ["شهروند نیک", "Townsfolk"],
      outsider: ["غریبه", "Outsider"],
      minion: ["دستیار شیطان", "Minion"],
      demon: ["شیطان", "Demon"],
    };
    const pair = labels[type] || [type, type];
    return tx(ctx, pair[0], pair[1]);
  }

  function roleLabel(ctx, rid) {
    const r = ctx.roles && ctx.roles[rid];
    if (!r) return rid;
    if (ctx.appLang === "fa") return r.faName || rid;
    return (ctx.ROLE_I18N && ctx.ROLE_I18N[rid] && ctx.ROLE_I18N[rid].name) || r.faName || rid;
  }

  function playerName(ctx, idx) {
    return ctx.names[idx] || ctx.t("common.playerN", { n: idx + 1 });
  }

  function allIdxs(ctx) {
    return (ctx.draw.players || []).map(function (_, i) { return i; });
  }

  function roleIdx(ctx, roleId) {
    for (let i = 0; i < (ctx.draw.players || []).length; i++) {
      const p = ctx.draw.players[i];
      if (p && p.roleId === roleId) return i;
    }
    return null;
  }

  function aliveRoleIdx(ctx, roleId) {
    for (let i = 0; i < (ctx.draw.players || []).length; i++) {
      const p = ctx.draw.players[i];
      if (p && p.roleId === roleId && p.alive !== false) return i;
    }
    return null;
  }

  function hasRole(ctx, roleId) {
    return roleIdx(ctx, roleId) !== null;
  }

  function roleType(ctx, rid) {
    const r = ctx.roles && ctx.roles[rid];
    return r && r.botcType ? String(r.botcType) : "";
  }

  function stepSaved(ctx, stepId) {
    const d = ctx.f.draft || {};
    return (d.stepInputs && d.stepInputs[stepId]) ? d.stepInputs[stepId] : {};
  }

  function nightSaved(ctx) {
    const d = ctx.f.draft || {};
    const key = String(ctx.f.day || 1);
    return (d.nightActionsByNight && d.nightActionsByNight[key]) ? d.nightActionsByNight[key] : {};
  }

  function refreshOnChangeAttr() {
    return " onchange=\"try{clearTimeout(window.__devilFlowRefreshTimer);window.__devilFlowRefreshTimer=setTimeout(function(){if(typeof showFlowTool==='function')showFlowTool();},0);}catch(e){}\"";
  }

  function selectPlayers(ctx, id, selected, filterFn, includeBlank) {
    const s = selected == null ? "" : String(selected);
    const opts = includeBlank === false ? [] : [`<option value="" ${s === "" ? "selected" : ""}>-</option>`];
    for (const idx of allIdxs(ctx)) {
      const p = ctx.draw.players[idx];
      if (!p) continue;
      if (filterFn && !filterFn(p, idx)) continue;
      const v = String(idx);
      opts.push(`<option value="${ctx.escapeHtml(v)}" ${s === v ? "selected" : ""}>${ctx.escapeHtml(playerName(ctx, idx))}</option>`);
    }
    return `<select id="${ctx.escapeHtml(id)}"${refreshOnChangeAttr()}>${opts.join("")}</select>`;
  }

  function selectRoles(ctx, id, selected, typeFilter) {
    const s = selected == null ? "" : String(selected);
    const seen = new Set();
    const opts = [`<option value="" ${s === "" ? "selected" : ""}>-</option>`];
    for (const rid of DEVIL_ROLES) {
      if (seen.has(rid)) continue;
      if (typeFilter && roleType(ctx, rid) !== typeFilter) continue;
      seen.add(rid);
      opts.push(`<option value="${ctx.escapeHtml(rid)}" ${s === rid ? "selected" : ""}>${ctx.escapeHtml(roleLabel(ctx, rid))}</option>`);
    }
    return `<select id="${ctx.escapeHtml(id)}"${refreshOnChangeAttr()}>${opts.join("")}</select>`;
  }

  function inPlayRoleIds(ctx) {
    const ids = new Set();
    (ctx.draw.players || []).forEach(function (p) {
      if (p && p.roleId) ids.add(p.roleId);
    });
    return ids;
  }

  function demonBluffRoleIds(ctx) {
    const inPlay = inPlayRoleIds(ctx);
    return DEVIL_ROLES.filter(function (rid) {
      const type = roleType(ctx, rid);
      return (type === "townsfolk" || type === "outsider") && !inPlay.has(rid);
    });
  }

  function selectBluffRole(ctx, id, selected, used) {
    const s = selected == null ? "" : String(selected);
    const usedSet = used || new Set();
    const candidates = demonBluffRoleIds(ctx).slice();
    if (s && !candidates.includes(s)) candidates.unshift(s);
    const opts = [`<option value="" ${s === "" ? "selected" : ""}>-</option>`];
    candidates.forEach(function (rid) {
      if (usedSet.has(rid) && rid !== s) return;
      opts.push(`<option value="${ctx.escapeHtml(rid)}" ${s === rid ? "selected" : ""}>${ctx.escapeHtml(roleLabel(ctx, rid))}</option>`);
    });
    return `<select id="${ctx.escapeHtml(id)}"${refreshOnChangeAttr()}>${opts.join("")}</select>`;
  }

  function suggestedBluffs(ctx, saved) {
    const savedVals = [
      saved.devil_bluff_1 || "",
      saved.devil_bluff_2 || "",
      saved.devil_bluff_3 || "",
    ];
    if (savedVals.some(function (rid) { return !!rid; })) return savedVals;
    return demonBluffRoleIds(ctx).slice(0, 3);
  }

  function demonBluffControls(ctx, saved) {
    const values = suggestedBluffs(ctx, saved);
    while (values.length < 3) values.push("");
    const used = new Set(values.filter(Boolean));
    const availableCount = demonBluffRoleIds(ctx).length;
    const warning = availableCount < 3
      ? `<div class="note warn" style="margin-top:8px">${ctx.escapeHtml(tx(ctx, "کمتر از سه نقش خوبِ خارج از بازی برای پوشش دیوچه باقی مانده است.", "Fewer than three not-in-play good roles are available for Demon bluffs."))}</div>`
      : "";
    return `
      <div style="display:grid; gap:8px; margin-top:8px">
        <label>${ctx.escapeHtml(tx(ctx, "پوشش ۱", "Bluff 1"))} ${selectBluffRole(ctx, "devil_bluff_1", values[0], used)}</label>
        <label>${ctx.escapeHtml(tx(ctx, "پوشش ۲", "Bluff 2"))} ${selectBluffRole(ctx, "devil_bluff_2", values[1], used)}</label>
        <label>${ctx.escapeHtml(tx(ctx, "پوشش ۳", "Bluff 3"))} ${selectBluffRole(ctx, "devil_bluff_3", values[2], used)}</label>
      </div>
      ${warning}
    `;
  }

  function section(ctx, title, html) {
    return `
      <div style="border-top:1px solid rgba(255,255,255,.12); padding-top:12px; margin-top:12px">
        <div style="font-weight:1100; margin-bottom:8px">${ctx.escapeHtml(title)}</div>
        ${html}
      </div>`;
  }

  function compactRoster(ctx) {
    return (ctx.draw.players || []).map(function (p, idx) {
      const rid = (p && p.roleId) || "citizen";
      return `<div style="padding:3px 0">${ctx.escapeHtml(playerName(ctx, idx))} - ${ctx.escapeHtml(roleLabel(ctx, rid))}</div>`;
    }).join("");
  }

  function evilRoster(ctx) {
    const evil = (ctx.draw.players || []).map(function (p, idx) { return { p, idx }; })
      .filter(function (x) { return x.p && ctx.roles[x.p.roleId] && ctx.roles[x.p.roleId].teamFa === "مافیا"; });
    if (!evil.length) return `<div class="note">${ctx.escapeHtml(tx(ctx, "هیچ بازیکن بدی در این قرعه نیست.", "No evil players are in this draw."))}</div>`;
    return evil.map(function (x) {
      return `<div style="padding:3px 0">${ctx.escapeHtml(playerName(ctx, x.idx))} - ${ctx.escapeHtml(roleLabel(ctx, x.p.roleId))}</div>`;
    }).join("");
  }

  function infoResultSelect(ctx, id, selected, max) {
    const s = selected == null ? "" : String(selected);
    const opts = [`<option value="" ${s === "" ? "selected" : ""}>-</option>`];
    for (let i = 0; i <= max; i++) {
      const label = (ctx.appLang === "fa" && typeof window.toFarsiNum === "function") ? window.toFarsiNum(i) : String(i);
      opts.push(`<option value="${i}" ${s === String(i) ? "selected" : ""}>${ctx.escapeHtml(label)}</option>`);
    }
    return `<select id="${ctx.escapeHtml(id)}"${refreshOnChangeAttr()}>${opts.join("")}</select>`;
  }

  function parseIdx(ctx, raw) {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 && n < (ctx.draw.players || []).length ? n : null;
  }

  function roleIdAt(ctx, idx) {
    const p = idx !== null && idx !== undefined ? ctx.draw.players[idx] : null;
    return (p && p.roleId) ? p.roleId : "citizen";
  }

  function roleLine(ctx, idx) {
    if (idx === null || idx === undefined || !ctx.draw.players[idx]) return "-";
    const rid = roleIdAt(ctx, idx);
    return `${playerName(ctx, idx)} - ${roleLabel(ctx, rid)}`;
  }

  function idxsByType(ctx, type) {
    return allIdxs(ctx).filter(function (idx) { return roleType(ctx, roleIdAt(ctx, idx)) === type; });
  }

  function isEvilIdx(ctx, idx) {
    const rid = roleIdAt(ctx, idx);
    const type = roleType(ctx, rid);
    const team = ctx.roles && ctx.roles[rid] && ctx.roles[rid].teamFa;
    return type === "minion" || type === "demon" || team === "مافیا";
  }

  function isDemonIdx(ctx, idx) {
    const rid = roleIdAt(ctx, idx);
    return roleType(ctx, rid) === "demon" || rid === "devilImp";
  }

  function isPoisoned(saved, idx) {
    return idx !== null && idx !== undefined &&
      saved && saved.magicianDisable !== null && saved.magicianDisable !== undefined &&
      parseInt(saved.magicianDisable, 10) === parseInt(idx, 10);
  }

  function computedClue(ctx, type, noMatchText, avoidRoleId) {
    const allMatchesForType = idxsByType(ctx, type);
    const matches = avoidRoleId
      ? allMatchesForType.filter(function (idx) { return roleIdAt(ctx, idx) !== avoidRoleId; })
      : allMatchesForType;
    const usableMatches = matches.length ? matches : allMatchesForType;
    if (!usableMatches.length) {
      return `<div class="note result">${ctx.escapeHtml(noMatchText)}</div>`;
    }
    const actual = usableMatches[0];
    const decoy = allIdxs(ctx).find(function (idx) { return idx !== actual; });
    const rid = roleIdAt(ctx, actual);
    const allMatches = allMatchesForType.map(function (idx) { return roleLine(ctx, idx); }).join(", ");
    const suggestion = decoy === undefined
      ? tx(ctx, `${roleLine(ctx, actual)}.`, `${roleLine(ctx, actual)}.`)
      : tx(
          ctx,
          `${roleLine(ctx, actual)}. پیشنهاد نمایش: ${playerName(ctx, actual)} و ${playerName(ctx, decoy)}؛ نقش ${roleLabel(ctx, rid)}.`,
          `${roleLine(ctx, actual)}. Suggested show: ${playerName(ctx, actual)} and ${playerName(ctx, decoy)}; character ${roleLabel(ctx, rid)}.`,
        );
    return `
      <div class="note result">${ctx.escapeHtml(suggestion)}</div>
      <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, `گزینه‌های واقعی در بازی: ${allMatches}`, `True in-play options: ${allMatches}`))}</div>
    `;
  }

  function chefPairCount(ctx) {
    const players = ctx.draw.players || [];
    const n = players.length;
    if (n < 2) return 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (isEvilIdx(ctx, i) && isEvilIdx(ctx, j)) count++;
    }
    return count;
  }

  function computedImpKill(ctx, saved) {
    const shot = parseIdx(ctx, saved && saved.mafiaShot);
    if (shot === null) return null;
    const impIdx = roleIdx(ctx, "devilImp");
    if (impIdx !== null && isPoisoned(saved, impIdx)) return null;
    const monkIdx = roleIdx(ctx, "devilMonk");
    const protectedIdx = monkIdx !== null && isPoisoned(saved, monkIdx) ? null : parseIdx(ctx, saved && saved.doctorSave);
    if (protectedIdx !== null && shot === protectedIdx) return null;
    const target = ctx.draw.players[shot];
    if (!target || target.alive === false) return null;
    if (roleIdAt(ctx, shot) === "devilSoldier" && !isPoisoned(saved, shot)) return null;
    return shot;
  }

  function effectiveAliveSetAfterNight(ctx, saved) {
    const alive = new Set(ctx.aliveIdxs);
    const killed = computedImpKill(ctx, saved);
    if (killed !== null) alive.delete(killed);
    return alive;
  }

  function empathCount(ctx, saved) {
    const empathIdx = roleIdx(ctx, "devilEmpath");
    const n = (ctx.draw.players || []).length;
    if (empathIdx === null || n < 2) return null;
    const alive = saved ? effectiveAliveSetAfterNight(ctx, saved) : new Set(ctx.aliveIdxs);
    if (!alive.has(empathIdx)) return null;
    const neighbors = [];
    for (let step = 1; step < n; step++) {
      const idx = (empathIdx - step + n) % n;
      if (alive.has(idx)) { neighbors.push(idx); break; }
    }
    for (let step = 1; step < n; step++) {
      const idx = (empathIdx + step) % n;
      if (alive.has(idx) && !neighbors.includes(idx)) { neighbors.push(idx); break; }
    }
    return neighbors.reduce(function (count, idx) { return count + (isEvilIdx(ctx, idx) ? 1 : 0); }, 0);
  }

  function introSaved(ctx) {
    return stepSaved(ctx, "devil_intro_night");
  }

  function fortuneTellerResult(ctx, saved) {
    const a = parseIdx(ctx, saved && saved.botcFortuneTellerA);
    const b = parseIdx(ctx, saved && saved.botcFortuneTellerB);
    if (a === null || b === null) return null;
    const red = parseIdx(ctx, introSaved(ctx).devil_red_herring);
    return (isDemonIdx(ctx, a) || isDemonIdx(ctx, b) || a === red || b === red) ? "yes" : "no";
  }

  window.registerStepRenderer("devil_intro_night", function (ctx) {
    const saved = stepSaved(ctx, "devil_intro_night");
    const pieces = [];
    pieces.push(section(ctx, tx(ctx, "اطلاعات تیم بد و نقش‌های پوششی شیطان", "Evil info and Demon bluffs"), `
      <div class="note fl-moderator-info">${ctx.escapeHtml(tx(ctx, "برای ۷ بازیکن به بالا، دستیارها و شیطان را طبق چیدمان برج ساعت بیدار کنید. به دیوچه سه نقش خوبِ خارج از بازی به عنوان پوشش بدهید.", "For 7+ players, wake Minions and Demon according to Clocktower setup. Give the Imp three not-in-play good character bluffs."))}</div>
      <div style="margin-top:8px">${evilRoster(ctx)}</div>
      <div style="margin-top:8px; font-weight:1000">${ctx.escapeHtml(tx(ctx, "نقش‌های پوششی شیطان", "Demon bluffs"))}</div>
      ${demonBluffControls(ctx, saved)}
    `));

    if (hasRole(ctx, "devilWasherwoman")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilWasherwoman"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "دو بازیکن و یک نقش شهروند نیک را نشان بدهید. یکی از آن دو همان شهروند نیک است.", "Show two players and one Townsfolk character. One of the two is that Townsfolk."))}</div>
        ${computedClue(ctx, "townsfolk", tx(ctx, "هیچ شهروند نیکی در این قرعه پیدا نشد.", "No Townsfolk was found in this draw."), "devilWasherwoman")}
      `));
    }
    if (hasRole(ctx, "devilLibrarian")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilLibrarian"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "دو بازیکن و یک نقش غریبه را نشان بدهید؛ یا ثبت کنید که غریبه‌ای در بازی نیست.", "Show two players and one Outsider, or record that no Outsiders are in play."))}</div>
        ${computedClue(ctx, "outsider", tx(ctx, "غریبه‌ای در بازی نیست.", "No Outsiders are in play."))}
      `));
    }
    if (hasRole(ctx, "devilInvestigator")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilInvestigator"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "دو بازیکن و یک نقش دستیار شیطان را نشان بدهید. یکی از آن دو همان دستیار است.", "Show two players and one Minion. One of the two is that Minion."))}</div>
        ${computedClue(ctx, "minion", tx(ctx, "دستیار شیطانی در این قرعه پیدا نشد.", "No Minion was found in this draw."))}
        <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "اگر گوشه‌نشین را عمداً به عنوان دستیار ثبت می‌کنید، می‌توانید نتیجه را شفاهی عوض کنید.", "If you intentionally register the Recluse as a Minion, adjust the shown clue verbally."))}</div>
      `));
    }
    if (hasRole(ctx, "devilChef")) {
      const pairs = chefPairCount(ctx);
      const pairLabel = (ctx.appLang === "fa" && typeof window.toFarsiNum === "function") ? window.toFarsiNum(pairs) : String(pairs);
      pieces.push(section(ctx, roleLabel(ctx, "devilChef"), `
        <div class="note result">${ctx.escapeHtml(tx(ctx, `نتیجه: ${pairLabel} جفت همسایه بد.`, `Result: ${pairLabel} evil neighbor pair(s).`))}</div>
        <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "این عدد بر اساس نقش‌های واقعی محاسبه شده است؛ ثبت‌های خاص مثل گوشه‌نشین می‌تواند با تصمیم گرداننده فرق کند.", "This is computed from true roles; special registration such as the Recluse can change it by Storyteller choice."))}</div>
      `));
    }
    if (hasRole(ctx, "devilEmpath")) {
      const count = empathCount(ctx, null);
      const countLabel = count === null ? "-" : ((ctx.appLang === "fa" && typeof window.toFarsiNum === "function") ? window.toFarsiNum(count) : String(count));
      pieces.push(section(ctx, roleLabel(ctx, "devilEmpath"), `
        <div class="note result">${ctx.escapeHtml(tx(ctx, `نتیجه شب اول: ${countLabel}`, `First-night result: ${countLabel}`))}</div>
        <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "بازیکنان مرده نادیده گرفته می‌شوند؛ در شب اول معمولاً همه زنده‌اند.", "Dead players are skipped; on the first night everyone is usually alive."))}</div>
      `));
    }
    if (hasRole(ctx, "devilFortuneTeller")) {
      pieces.push(section(ctx, tx(ctx, "چیدمان فال‌گیر", "Fortune Teller setup"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "اگر از طعمه قرمز استفاده می‌کنید، آن را انتخاب کنید.", "Pick the red herring, if you are using one."))}</div>
        <label>${ctx.escapeHtml(tx(ctx, "طعمه قرمز", "Red herring"))} ${selectPlayers(ctx, "devil_red_herring", saved.devil_red_herring)}</label>
      `));
    }
    if (hasRole(ctx, "devilButler")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilButler"), `
        <label>${ctx.escapeHtml(tx(ctx, "ارباب", "Master"))} ${selectPlayers(ctx, "devil_intro_butler_master", saved.devil_intro_butler_master)}</label>
      `));
    }
    if (hasRole(ctx, "devilSpy")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilSpy"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "دفتر کامل نقش‌ها را به جاسوس نشان بدهید.", "Show the Spy the grimoire."))}</div>
        <div class="toolBox" style="margin-top:8px">${compactRoster(ctx)}</div>
      `));
    }
    return pieces.join("");
  });

  window.registerStepRenderer("devil_day_actions", function (ctx) {
    const saved = stepSaved(ctx, "devil_day_actions");
    const d = ctx.f.draft || {};
    const slayerUsed = !!d.devilSlayerUsed;
    const virginUsed = !!d.devilVirginUsed;
    const mayorAlive = aliveRoleIdx(ctx, "devilMayor") !== null;
    const pieces = [];
    pieces.push(section(ctx, tx(ctx, "توانایی‌های روز", "Day abilities"), `
      <div class="note">${ctx.escapeHtml(tx(ctx, "توانایی‌های روز سناریوی شیطان را اینجا و قبل از رأی‌گیری عادی ثبت کنید.", "Record Clocktower day abilities here before the normal vote."))}</div>
    `));
    if (hasRole(ctx, "devilVirgin")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilVirgin"), virginUsed ? `
        <div class="note warn">${ctx.escapeHtml(tx(ctx, "توانایی پاکدامن قبلاً استفاده شده است.", "Virgin ability has already been used."))}</div>
      ` : `
        <div class="note">${ctx.escapeHtml(tx(ctx, "اگر اولین نامزدکننده شهروند نیک باشد، همان لحظه اعدام می‌شود.", "If the first nominator is a Townsfolk, they are executed immediately."))}</div>
        <label>${ctx.escapeHtml(tx(ctx, "نامزدکننده", "Nominator"))} ${selectPlayers(ctx, "fl_devil_virgin_nominator", saved.fl_devil_virgin_nominator)}</label>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px"><input id="fl_devil_virgin_first" type="checkbox" ${saved.fl_devil_virgin_first ? "checked" : ""}> ${ctx.escapeHtml(tx(ctx, "اجرای توانایی نامزدی اول پاکدامن", "Apply Virgin first-nomination ability"))}</label>
      `));
    }
    if (hasRole(ctx, "devilSlayer")) {
      pieces.push(section(ctx, roleLabel(ctx, "devilSlayer"), slayerUsed ? `
        <div class="note warn">${ctx.escapeHtml(tx(ctx, "شلیک شکارچی شیطان قبلاً استفاده شده است.", "Slayer shot has already been used."))}</div>
      ` : `
        <div class="note">${ctx.escapeHtml(tx(ctx, "اگر هدف دیوچه فعلی باشد، هدف می‌میرد.", "If the target is the current Imp, the target dies."))}</div>
        <label>${ctx.escapeHtml(tx(ctx, "هدف", "Target"))} ${selectPlayers(ctx, "fl_devil_slayer_target", saved.fl_devil_slayer_target)}</label>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px"><input id="fl_devil_slayer_fire" type="checkbox" ${saved.fl_devil_slayer_fire ? "checked" : ""}> ${ctx.escapeHtml(tx(ctx, "شلیک شکارچی شیطان", "Fire Slayer shot"))}</label>
      `));
    }
    if (mayorAlive) {
      pieces.push(section(ctx, roleLabel(ctx, "devilMayor"), `
        <div class="note">${ctx.escapeHtml(tx(ctx, "اگر دقیقاً سه بازیکن زنده باشند و امروز بدون اعدام تمام شود، تیم خوب برنده می‌شود. تغییر هدف حمله شیطان با انتخاب گرداننده است؛ اگر رخ داد در یادداشت‌ها ثبت کنید.", "If exactly three players are alive and today ends with no execution, good wins. Demon attack redirection is a Storyteller choice; use notes if it happens."))}</div>
      `));
    }
    return pieces.join("");
  });

  window.registerStepRenderer("devil_night_poisoner", function (ctx) {
    const saved = nightSaved(ctx);
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "مسموم‌کننده، چشمانت را باز کن. یک بازیکن را برای مسموم کردن انتخاب کن.", "Poisoner, open your eyes. Choose a player to poison."))}</div>
      ${ctx.mkNightTargetCards("fl_magician_disable", saved.magicianDisable, tx(ctx, "بازیکن مسموم", "Poisoned player"))}
      <div class="note fl-moderator-info" style="margin-top:8px">${ctx.escapeHtml(tx(ctx, "مسمومیت از فیلد غیرفعال‌سازی برنامه استفاده می‌کند: توانایی بازیکن انتخاب‌شده امشب بسته می‌شود و گرداننده می‌تواند تا فردا روز اطلاعات غلط بدهد.", "Poison reuses the app's disable field: the chosen player's ability is blocked tonight, and the host may give false info through tomorrow day."))}</div>
    `;
  });

  window.registerStepRenderer("devil_night_monk", function (ctx) {
    const saved = nightSaved(ctx);
    const monkIdx = roleIdx(ctx, "devilMonk");
    const targets = monkIdx === null ? ctx.aliveIdxs : ctx.aliveIdxs.filter(function (idx) { return idx !== monkIdx; });
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "راهب، چشمانت را باز کن. یک بازیکن دیگر را برای محافظت از حمله شیطان انتخاب کن.", "Monk, open your eyes. Choose another player to protect from the Demon."))}</div>
      ${ctx.mkNightTargetCards("fl_doctor_save", saved.doctorSave, tx(ctx, "بازیکن محافظت‌شده", "Protected player"), targets)}
    `;
  });

  window.registerStepRenderer("devil_night_imp", function (ctx) {
    const saved = nightSaved(ctx);
    const impIdx = roleIdx(ctx, "devilImp");
    const selected = saved.mafiaShot == null ? null : parseInt(saved.mafiaShot, 10);
    const selfKill = impIdx !== null && selected === impIdx;
    const minionIdxs = ctx.aliveIdxs.filter(function (idx) {
      const p = ctx.draw.players[idx];
      return p && MINION_ROLES.includes(p.roleId);
    });
    const successor = selfKill ? `
      <div style="height:10px"></div>
      <label>${ctx.escapeHtml(tx(ctx, "دیوچه جدید در صورت خودکشی", "New Imp if self-kill"))} ${selectPlayers(ctx, "fl_devil_imp_successor", saved.botcImpSuccessor, function (p, idx) { return minionIdxs.includes(idx); })}</label>
      <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "اگر جانشینی انتخاب نشود، اولین دستیار زنده به دیوچه تبدیل می‌شود.", "If no successor is selected, the first alive Minion is promoted."))}</div>
    ` : "";
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "دیوچه، چشمانت را باز کن. یک بازیکن را برای مرگ انتخاب کن.", "Imp, open your eyes. Choose a player to die."))}</div>
      ${ctx.mkNightTargetCards("fl_mafia_shot", saved.mafiaShot, tx(ctx, "کشتار دیوچه", "Imp kill"))}
      ${successor}
    `;
  });

  window.registerStepRenderer("devil_night_ravenkeeper", function (ctx) {
    const saved = nightSaved(ctx);
    const ravenIdx = roleIdx(ctx, "devilRavenkeeper");
    const monkIdx = roleIdx(ctx, "devilMonk");
    const monkPoisoned = monkIdx !== null && saved.magicianDisable != null && parseInt(saved.magicianDisable, 10) === monkIdx;
    const protectedIdx = monkPoisoned ? null : parseInt(saved.doctorSave, 10);
    const killedTonight = ravenIdx !== null && saved.mafiaShot != null && parseInt(saved.mafiaShot, 10) === ravenIdx && protectedIdx !== ravenIdx;
    if (!killedTonight) {
      return `<div class="note">${ctx.escapeHtml(tx(ctx, "نگهبان کلاغ فقط اگر شب کشته شده باشد بیدار می‌شود. فعلاً کاری برای نگهبان کلاغ ثبت نشده است.", "Ravenkeeper only wakes if killed at night. No Ravenkeeper action is pending."))}</div>`;
    }
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "نگهبان کلاغ، چشمانت را باز کن. یک بازیکن را انتخاب کن تا نقشش را بدانی.", "Ravenkeeper, open your eyes. Choose a player to learn their character."))}</div>
      ${ctx.mkNightTargetCards("fl_devil_ravenkeeper_query", saved.botcRavenkeeperQuery, tx(ctx, "بازیکن بررسی‌شده", "Player checked"), allIdxs(ctx))}
      ${(() => {
        const queryIdx = parseIdx(ctx, saved.botcRavenkeeperQuery);
        if (queryIdx === null) return `<div class="note" style="margin-top:8px">${ctx.escapeHtml(tx(ctx, "یک بازیکن را انتخاب کنید تا برنامه نقش واقعی او را نشان دهد.", "Choose a player and the app will show their true character."))}</div>`;
        const poisoned = isPoisoned(saved, ravenIdx);
        return `
          <div class="note result" style="margin-top:8px">${ctx.escapeHtml(tx(ctx, `نتیجه: ${roleLine(ctx, queryIdx)}`, `Result: ${roleLine(ctx, queryIdx)}`))}</div>
          ${poisoned ? `<div class="note warn" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "نگهبان کلاغ امشب مسموم است؛ نتیجه واقعی بالا برای کمک به گرداننده است و نباید الزاماً به بازیکن گفته شود.", "The Ravenkeeper is poisoned tonight; the true result above is for moderator help and should not necessarily be told to the player."))}</div>` : ""}
        `;
      })()}
    `;
  });

  window.registerStepRenderer("devil_night_empath", function (ctx) {
    const saved = nightSaved(ctx);
    const count = empathCount(ctx, saved);
    const empathIdx = roleIdx(ctx, "devilEmpath");
    const poisoned = isPoisoned(saved, empathIdx);
    const countLabel = count === null ? "-" : ((ctx.appLang === "fa" && typeof window.toFarsiNum === "function") ? window.toFarsiNum(count) : String(count));
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "همدل، چشمانت را باز کن. تعداد همسایه‌های زنده بدت را بدان.", "Empath, open your eyes. Learn how many living neighbors are evil."))}</div>
      <input type="hidden" id="fl_devil_empath_count" value="${ctx.escapeHtml(count === null ? "" : String(count))}">
      <div class="note result">${ctx.escapeHtml(tx(ctx, `نتیجه: ${countLabel}`, `Result: ${countLabel}`))}</div>
      <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "این عدد بعد از حمله دیوچه و با نادیده گرفتن بازیکنان مرده محاسبه می‌شود.", "This number is computed after the Imp attack, skipping dead players."))}</div>
      ${poisoned ? `<div class="note warn" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "همدل امشب مسموم است؛ می‌توانید اطلاعات غلط بدهید.", "The Empath is poisoned tonight; you may give false information."))}</div>` : ""}
    `;
  });

  window.registerStepRenderer("devil_night_fortune_teller", function (ctx) {
    const saved = nightSaved(ctx);
    const result = fortuneTellerResult(ctx, saved);
    const ftIdx = roleIdx(ctx, "devilFortuneTeller");
    const poisoned = isPoisoned(saved, ftIdx);
    const resultLabel = result === null
      ? tx(ctx, "دو بازیکن را انتخاب کنید تا نتیجه محاسبه شود.", "Choose two players to compute the result.")
      : result === "yes"
        ? tx(ctx, "نتیجه: بله، یکی شیطان یا طعمه قرمز است.", "Result: Yes, one is the Demon or red herring.")
        : tx(ctx, "نتیجه: نه.", "Result: No.");
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "فال‌گیر، چشمانت را باز کن. دو بازیکن را انتخاب کن.", "Fortune Teller, open your eyes. Choose two players."))}</div>
      <label>${ctx.escapeHtml(tx(ctx, "بازیکن الف", "Player A"))} ${selectPlayers(ctx, "fl_devil_ft_a", saved.botcFortuneTellerA)}</label>
      <label>${ctx.escapeHtml(tx(ctx, "بازیکن ب", "Player B"))} ${selectPlayers(ctx, "fl_devil_ft_b", saved.botcFortuneTellerB)}</label>
      <input type="hidden" id="fl_devil_ft_result" value="${ctx.escapeHtml(result || "")}">
      <div class="note result" style="margin-top:8px">${ctx.escapeHtml(resultLabel)}</div>
      <div class="note fl-moderator-info" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "طعمه قرمز از شب معارفه خوانده می‌شود. اگر انتخاب نشده باشد، برنامه فقط شیطان را حساب می‌کند.", "The red herring is read from intro night. If none is selected, the app only checks the Demon."))}</div>
      ${poisoned ? `<div class="note warn" style="margin-top:6px">${ctx.escapeHtml(tx(ctx, "فال‌گیر امشب مسموم است؛ نتیجه واقعی بالا برای کمک به گرداننده است و می‌توانید نتیجه غلط بدهید.", "The Fortune Teller is poisoned tonight; the true result above is for moderator help and you may give false information."))}</div>` : ""}
    `;
  });

  window.registerStepRenderer("devil_night_undertaker", function (ctx) {
    const saved = nightSaved(ctx);
    const prevDay = String(ctx.f.day || 1);
    const elim = ctx.f.draft && ctx.f.draft.dayElimAppliedByDay && ctx.f.draft.dayElimAppliedByDay[prevDay];
    const outIdx = elim && elim.out != null ? parseInt(elim.out, 10) : null;
    const roleId = outIdx !== null && ctx.draw.players[outIdx] ? ctx.draw.players[outIdx].roleId : "";
    const resultText = outIdx === null
      ? tx(ctx, "امروز اعدامی ثبت نشده است.", "No execution recorded today.")
      : tx(ctx, `${playerName(ctx, outIdx)} نقش ${roleLabel(ctx, roleId)} داشت.`, `${playerName(ctx, outIdx)} was ${roleLabel(ctx, roleId)}`);
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "گورکن، چشمانت را باز کن. نقشی را که امروز اعدام شد بدان.", "Undertaker, open your eyes. Learn which character was executed today."))}</div>
      <div class="note result">${ctx.escapeHtml(resultText)}</div>
      <label>${ctx.escapeHtml(tx(ctx, "نقش ثبت‌شده یا جایگزین", "Override/recorded role"))} ${selectRoles(ctx, "fl_devil_undertaker_role", saved.botcUndertakerRole || roleId)}</label>
    `;
  });

  window.registerStepRenderer("devil_night_butler", function (ctx) {
    const saved = nightSaved(ctx);
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "پیشخدمت، چشمانت را باز کن. اربابت را انتخاب کن.", "Butler, open your eyes. Choose your master."))}</div>
      ${ctx.mkNightTargetCards("fl_devil_butler_master", saved.botcButlerMaster, tx(ctx, "ارباب", "Master"))}
    `;
  });

  window.registerStepRenderer("devil_night_spy", function (ctx) {
    return `
      <div class="fl-say-label">${ctx.escapeHtml(ctx.t("fl.label.sayAloud"))}</div>
      <div class="fl-script">${ctx.escapeHtml(tx(ctx, "جاسوس، چشمانت را باز کن. دفتر کامل نقش‌ها را ببین.", "Spy, open your eyes. Look at the grimoire."))}</div>
      <div class="toolBox" style="margin-top:8px">${compactRoster(ctx)}</div>
    `;
  });
})();
