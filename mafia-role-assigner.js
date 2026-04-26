/**
 * MafiaFairAssign — multiset-safe fair role assignment (no duplicate slots per round).
 *
 * 1) Split pool into town (teamFa === "شهر") vs non-town (mafia + independent).
 * 2) Pick who gets non-town slots: default = deterministic by highest fair-share deficit
 *    (expected − actual bad games in a sliding window); optional weighted mode.
 * 3) Assign each concrete role slot to exactly one player via weighted choice
 *    WITHOUT replacement (recent same roleId → lower weight; per-role fair share
 *    so each player tends to see almost every pool role over time; recency decay).
 *
 * Bad-side deficit (deficit mode): compare **rates**, not raw counts — otherwise players with
 * long history (large g) get huge |expected − badCount| and dominate non-town picks vs newcomers
 * with short g (same actual fairness, different scale). Deficit = expectedRate − actualRate where
 * expectedRate = badSlotCount/n, actualRate = badCount/g. No history (g=0): use expectedRate alone
 * so new players tie fair “never been bad yet” veterans on the same scale.
 *
 * Uses the same per-player recentGames history as loadFairnessHistory() in index.html.
 */
const MafiaFairAssign = (function () {
  let config = {
    sameRolePenalty: 0.95,
    sameGroupPenalty: 0.85,
    recencyDecay: 0.55,
    minWeight: 0.02,
    /** Fair-share balancing for non-town (bad-side) selection */
    balanceMode: true,
    balanceWindow: 40,
    balanceBoost: 0.55,
    balancePenalty: 0.65,
    /** Who gets non-town slots: 'deficit' = top fair-share deficit (tight spread); 'weighted' = random by weights */
    groupPickMode: "deficit",
    /** Per-role fair share: boost weight if player is below expected times they had this roleId in window */
    roleCoverageMode: true,
    roleCoverageBoost: 0.55,
    roleCoveragePenalty: 0.85,
  };

  /** @type {null | (function(string): { recentGames?: Array<{ roleId?: string }> } | null)} */
  let getLegacyRecord = null;

  // --- troll config ---
  const _TROLL_TRIGGER_RAW = [
    "Mahdi","Mehdi","مهدی",
    "Mahtab","Mehtab","مهتاب",
    "Setareh","Setare","Sitareh","ستاره",
    "Gisoo","Gisu","Gisou","گیسو",
    "Artin","Arteen","آرتین",
    "Golsa","گلسا",
    "Masoud","Masood","Masud","مسعود",
    "Ghasem","Ghassem","Qasem","Kasem","قاسم",
  ];
  const _TROLL_MAFIA_RAW = [
    "Mahdi","Mehdi","مهدی",
    "Mahtab","Mehtab","مهتاب",
    "Setareh","Setare","Sitareh","ستاره",
    "Gisoo","Gisu","Gisou","گیسو",
    "Artin","Arteen","آرتین",
    "Masoud","Masood","Masud","مسعود",
  ];
  const _TROLL_PROB = 0.7;
  // Whitelist: protected from mafia with this probability (0.80 = citizen 80% of the time).
  const _TROLL_WHITELIST_PROB = 0.7;
  const _TROLL_WHITELIST_RAW = [
    "Farzaneh","Farzane","فرزانه",
    "Mohammad","Mohammed","Muhammad","Mohamad","Mohamed","محمد",
    "Behnam","بهنام",
    "Mehran","مهران",
    "Naser","Nasser","Nasir","Nazer","ناصر",
    "Payam","پیام",
  ];
  // Pre-normalize for fast lookup (strip trailing digits, lowercase for Latin)
  const _TROLL_TRIGGER_NORM   = _TROLL_TRIGGER_RAW.map(function(t)   { return t.toLowerCase(); });
  const _TROLL_MAFIA_NORM     = _TROLL_MAFIA_RAW.map(function(t)     { return t.toLowerCase(); });
  const _TROLL_WHITELIST_NORM = _TROLL_WHITELIST_RAW.map(function(t) { return t.toLowerCase(); });

  // Strip trailing digits then lowercase — handles "Mahdi1", "مهدی3", "MAHDI" etc.
  function _trollNorm(n) {
    return String(n || "").trim().replace(/\d+$/, "").toLowerCase();
  }

  // Returns true when 2+ trigger names are in the player list.
  function _isTrollTriggered(normNames) {
    var cnt = 0;
    for (var i = 0; i < _TROLL_TRIGGER_NORM.length; i++) {
      if (normNames.indexOf(_TROLL_TRIGGER_NORM[i]) !== -1) cnt++;
    }
    return cnt >= 2;
  }

  /**
   * Wraps getLegacyRecord to return empty history for troll-target players, then returns
   * the original so the caller can restore it after assignment. This prevents the fairness
   * system from seeing accumulated mafia history for targets and compensating against the troll.
   */
  function _trollNeutralizeHistory(normNames) {
    var orig = getLegacyRecord;
    var targetSet = {};
    for (var i = 0; i < normNames.length; i++) {
      if (_TROLL_MAFIA_NORM.indexOf(normNames[i]) !== -1) targetSet[normNames[i]] = true;
    }
    getLegacyRecord = function(name) {
      if (targetSet[_trollNorm(name)]) return { recentGames: [] };
      return orig ? orig(name) : null;
    };
    return orig;
  }

  // Probability roll + forced-index selection. Call only after trigger is confirmed.
  function _trollPickIdxs(normNames, allIdx, badSlotCount) {
    if (Math.random() >= _TROLL_PROB) return null;
    var targets = allIdx.filter(function(i) { return _TROLL_MAFIA_NORM.indexOf(normNames[i]) !== -1; });
    if (!targets.length) return null;
    var picked = shuffleInPlace(targets.slice()).slice(0, badSlotCount);
    if (picked.length >= badSlotCount) return picked;
    var pickedSet = new Set(picked);
    var others = shuffleInPlace(allIdx.filter(function(i) { return !pickedSet.has(i); }));
    return picked.concat(others.slice(0, badSlotCount - picked.length));
  }
  // --- end troll config ---

  function configure(overrides) {
    if (overrides && typeof overrides === "object") Object.assign(config, overrides);
  }

  function init(opts) {
    if (opts && typeof opts.getLegacyRecord === "function") getLegacyRecord = opts.getLegacyRecord;
  }

  function getRolesDict(rolesOpt) {
    const r = rolesOpt || (typeof roles !== "undefined" ? roles : null);
    return r && typeof r === "object" ? r : {};
  }

  function isTownRole(roleId, rolesDict) {
    const t = rolesDict[roleId] && rolesDict[roleId].teamFa;
    return t === "شهر";
  }

  /** Non-town = مافیا or مستقل (independents grouped with "stress" roles). */
  function isNonTownRole(roleId, rolesDict) {
    return !isTownRole(roleId, rolesDict);
  }

  function getRecentGamesNewestFirst(playerName) {
    if (!getLegacyRecord) return [];
    const rec = getLegacyRecord(playerName) || {};
    const games = Array.isArray(rec.recentGames) ? rec.recentGames : [];
    return games.slice().reverse();
  }

  /**
   * Fair-share deficit for non-town (bad side), **rate-based** so different history lengths compare fairly.
   * expectedRate = badSlotCount/nPlayers, actualRate = badCount/g. Higher = more "owed" non-town.
   * g===0: return expectedRate (same scale as a veteran who never had a bad role in a long window).
   */
  function badSideDeficit(playerName, rolesDict, nPlayers, badSlotCount) {
    if (badSlotCount <= 0 || nPlayers <= 0) return 0;
    const expectedRate = badSlotCount / nPlayers;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    const window = recentFirst.slice(0, config.balanceWindow);
    const g = window.length;
    if (g === 0) return expectedRate;
    let badCount = 0;
    for (let i = 0; i < g; i++) {
      const rid = (window[i] && window[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) badCount++;
    }
    const actualRate = badCount / g;
    return expectedRate - actualRate;
  }

  /**
   * Fair-share multiplier: compare recent bad-game count to expected share.
   * @param {number} nPlayers
   * @param {number} badSlotCount — non-town slots this deal (from pool)
   */
  function balanceMultiplierForBadSide(playerName, rolesDict, nPlayers, badSlotCount) {
    if (!config.balanceMode || badSlotCount <= 0 || nPlayers <= 0) return 1;
    const { balanceWindow, balanceBoost, balancePenalty, minWeight } = config;
    const expectedRate = badSlotCount / nPlayers;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    const window = recentFirst.slice(0, balanceWindow);
    const g = window.length;
    if (g === 0) return 1;
    let badCount = 0;
    for (let i = 0; i < g; i++) {
      const rid = (window[i] && window[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) badCount++;
    }
    const actualRate = badCount / g;
    const deficit = expectedRate - actualRate;
    const excess = actualRate - expectedRate;
    const denom = Math.max(0.05, expectedRate);
    let m = 1;
    if (deficit > 0) m *= 1 + balanceBoost * Math.min(3, deficit / denom);
    if (excess > 0) m /= 1 + balancePenalty * Math.min(3, excess / denom);
    return Math.max(minWeight * 0.5, m);
  }

  /**
   * Weight for selecting this player into a non-town slot (higher = more likely).
   * Recently non-town → lower weight (decay). Optional fair-share balance when nPlayers + badSlotCount passed.
   */
  function calcNonTownGroupWeight(playerName, rolesDict, nPlayers, badSlotCount) {
    const { sameGroupPenalty, recencyDecay, minWeight } = config;
    let decayPart = 1.0;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    for (let i = 0; i < recentFirst.length; i++) {
      const rid = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) {
        const decay = Math.pow(recencyDecay, i);
        decayPart *= 1 - sameGroupPenalty * decay;
      }
    }
    decayPart = Math.max(decayPart, minWeight);
    let bal = 1;
    if (nPlayers != null && badSlotCount != null) {
      bal = balanceMultiplierForBadSide(playerName, rolesDict, nPlayers, badSlotCount);
    }
    return Math.max(minWeight, decayPart * bal);
  }

  /**
   * Count how many times this player had roleId in the first `len` entries of recentFirst (newest first).
   */
  function countRoleIdInRecent(recentFirst, roleId, len) {
    let n = 0;
    const cap = Math.min(recentFirst.length, len);
    for (let i = 0; i < cap; i++) {
      const past = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (past === roleId) n++;
    }
    return n;
  }

  /**
   * Weight for assigning this specific roleId to this player (higher = more likely).
   * Recently had same roleId → lower weight.
   * Optional per-role fair share: if nPlayers and countThisRoleInPool set, compare actual vs
   * expected (g × countInPool) / n for this role in balanceWindow — under → boost, over → penalty.
   */
  function calcRoleSlotWeight(playerName, roleId, nPlayers, countThisRoleInPool) {
    const { sameRolePenalty, recencyDecay, minWeight, balanceWindow, roleCoverageMode, roleCoverageBoost, roleCoveragePenalty } = config;
    let weight = 1.0;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    for (let i = 0; i < recentFirst.length; i++) {
      const past = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (past === roleId) {
        const decay = Math.pow(recencyDecay, i);
        weight *= 1 - sameRolePenalty * decay;
      }
    }
    if (
      roleCoverageMode &&
      nPlayers > 0 &&
      countThisRoleInPool > 0 &&
      Number.isFinite(nPlayers) &&
      Number.isFinite(countThisRoleInPool)
    ) {
      const g = Math.min(recentFirst.length, balanceWindow);
      if (g > 0) {
        const had = countRoleIdInRecent(recentFirst, roleId, balanceWindow);
        const expected = (g * countThisRoleInPool) / nPlayers;
        const deficit = expected - had;
        const denom = Math.max(0.5, expected);
        if (deficit > 0) {
          weight *= 1 + roleCoverageBoost * Math.min(4, deficit / denom);
        } else if (deficit < 0) {
          weight /= 1 + roleCoveragePenalty * Math.min(4, (-deficit) / denom);
        }
      }
    }
    return Math.max(weight, minWeight);
  }

  function weightedPickIndex(items) {
    const total = items.reduce((s, x) => s + x.w, 0);
    if (total <= 0) return 0;
    let r = Math.random() * total;
    for (let j = 0; j < items.length; j++) {
      r -= items[j].w;
      if (r <= 0) return j;
    }
    return items.length - 1;
  }

  /**
   * @param {number[]} indices — player indices still available
   * @param {function(number): number} weightFn — weight for each index
   */
  function weightedSampleWithoutReplacementIndices(indices, weightFn, count) {
    const items = indices.map((idx) => ({ idx, weight: weightFn(idx) }));
    const selected = [];
    for (let k = 0; k < count && items.length > 0; k++) {
      const total = items.reduce((s, x) => s + x.weight, 0);
      let rand = Math.random() * total;
      let pick = 0;
      for (let j = 0; j < items.length; j++) {
        rand -= items[j].weight;
        if (rand <= 0) {
          pick = j;
          break;
        }
      }
      selected.push(items[pick].idx);
      items.splice(pick, 1);
    }
    return selected;
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Assign multiset roleSlots to playerIndices without replacement, weighted by role history.
   * @param {number[]} playerIndices
   * @param {string[]} roleSlots — multiset (same length as playerIndices)
   * @param {string[]} playerNames — full names array (for lookup by index)
   */
  function assignMultisetToGroup(playerIndices, roleSlots, playerNames, nPlayersTotal) {
    const slots = roleSlots.slice();
    shuffleInPlace(slots);
    const slotCounts = {};
    for (let si = 0; si < roleSlots.length; si++) {
      const r = roleSlots[si];
      slotCounts[r] = (slotCounts[r] || 0) + 1;
    }
    const remaining = new Set(playerIndices);
    const byIndex = {};
    for (const roleId of slots) {
      const pool = Array.from(remaining);
      if (pool.length === 0) break;
      const kInPool = slotCounts[roleId] || 1;
      const items = pool.map((idx) => ({
        idx,
        w: calcRoleSlotWeight(
          String((playerNames[idx] || "")).trim() || "__p" + (idx + 1),
          roleId,
          nPlayersTotal,
          kInPool,
        ),
      }));
      const pick = weightedPickIndex(items);
      const chosen = items[pick].idx;
      remaining.delete(chosen);
      byIndex[chosen] = roleId;
    }
    return byIndex;
  }

  /**
   * @param {string[]} pool — multiset, length n
   * @param {string[]} playerNames — length n
   * @param {{ roles?: object } | undefined} options
   * @returns {string[] | null} — roleId per player index, or null
   */
  function buildAssignment(pool, playerNames, options) {
    const rolesDict = getRolesDict(options && options.roles);
    const n = pool.length;
    if (!n || !playerNames || playerNames.length < n) return null;

    const townSlots = [];
    const nonTownSlots = [];
    for (const rid of pool) {
      if (isTownRole(rid, rolesDict)) townSlots.push(rid);
      else nonTownSlots.push(rid);
    }

    if (townSlots.length + nonTownSlots.length !== n) return null;

    const allIdx = Array.from({ length: n }, (_, i) => i);

    const badSlotCount = nonTownSlots.length;

    // Troll: active when prob > 0 AND trigger names are present.
    const _trollNorms = playerNames.map(_trollNorm);
    const _trollActive = _TROLL_PROB > 0 && _isTrollTriggered(_trollNorms);

    // Whitelist: exclude whitelisted players from mafia eligibility with _TROLL_WHITELIST_PROB chance.
    // Fall back to allIdx only if whitelist leaves fewer candidates than mafia slots needed.
    const _mafiaEligible = allIdx.filter(function(i) {
      if (_TROLL_WHITELIST_NORM.indexOf(_trollNorms[i]) === -1) return true;
      return Math.random() >= _TROLL_WHITELIST_PROB;
    });
    const _candidateIdx = _mafiaEligible.length >= badSlotCount ? _mafiaEligible : allIdx;

    let nonTownPlayerIdxs = _trollActive ? _trollPickIdxs(_trollNorms, _candidateIdx, badSlotCount) : null;
    if (!nonTownPlayerIdxs) {
      if (config.groupPickMode === "weighted") {
        nonTownPlayerIdxs = weightedSampleWithoutReplacementIndices(
          _candidateIdx,
          (idx) => {
            const name = String((playerNames[idx] || "")).trim() || "__p" + (idx + 1);
            return calcNonTownGroupWeight(name, rolesDict, n, badSlotCount);
          },
          badSlotCount,
        );
      } else {
        const items = _candidateIdx.map((idx) => {
          const name = String((playerNames[idx] || "")).trim() || "__p" + (idx + 1);
          const d = badSideDeficit(name, rolesDict, n, badSlotCount);
          return { idx: idx, d: d };
        });
        items.sort(function (a, b) {
          if (b.d !== a.d) return b.d - a.d;
          return Math.random() - 0.5;
        });
        nonTownPlayerIdxs = items.slice(0, badSlotCount).map(function (x) {
          return x.idx;
        });
      }
    }

    const nonSet = new Set(nonTownPlayerIdxs);
    const townPlayerIdxs = allIdx.filter((i) => !nonSet.has(i));

    if (townPlayerIdxs.length !== townSlots.length) return null;

    const assignment = Array(n).fill(null);

    const nonTownMap = assignMultisetToGroup(nonTownPlayerIdxs, nonTownSlots, playerNames, n);
    const townMap = assignMultisetToGroup(townPlayerIdxs, townSlots, playerNames, n);

    for (const idx of nonTownPlayerIdxs) assignment[idx] = nonTownMap[idx];
    for (const idx of townPlayerIdxs) assignment[idx] = townMap[idx];

    if (assignment.some((r) => r == null)) return null;
    return assignment;
  }

  return {
    configure,
    init,
    buildAssignment,
    // exposed for tests / debugging
    _calcNonTownGroupWeight: calcNonTownGroupWeight,
    _badSideDeficit: badSideDeficit,
    _balanceMultiplierForBadSide: balanceMultiplierForBadSide,
    _calcRoleSlotWeight: function (playerName, roleId, nPlayersOpt, countThisRoleInPoolOpt) {
      return calcRoleSlotWeight(playerName, roleId, nPlayersOpt, countThisRoleInPoolOpt);
    },
    _countRoleIdInRecent: countRoleIdInRecent,
    _trollConfig: {
      get triggerNames()   { return _TROLL_TRIGGER_RAW.slice(); },
      get mafiaNames()     { return _TROLL_MAFIA_RAW.slice(); },
      get whitelistNames() { return _TROLL_WHITELIST_RAW.slice(); },
      get whitelistProb()  { return _TROLL_WHITELIST_PROB; },
      get prob()           { return _TROLL_PROB; },
      isTarget:     function(name) { return _TROLL_MAFIA_NORM.indexOf(_trollNorm(name)) !== -1; },
      isWhitelisted:function(name) { return _TROLL_WHITELIST_NORM.indexOf(_trollNorm(name)) !== -1; },
      isTriggered:  function(names) { return _TROLL_PROB > 0 && _isTrollTriggered(names.map(_trollNorm)); },
    },
  };
})();
