(function () {
  "use strict";

  function countRoles(arr) {
    const c = {};
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      c[x] = (c[x] || 0) + 1;
    }
    return c;
  }

  /** Same multiset as countRoles, but keys sorted — assertDeepEqual is order-sensitive for object keys in some runners. */
  function countRolesSorted(arr) {
    const c = countRoles(arr);
    const out = {};
    Object.keys(c)
      .sort()
      .forEach(function (k) {
        out[k] = c[k];
      });
    return out;
  }

  function emptyLegacy(names) {
    const mock = {};
    for (let i = 0; i < names.length; i++) mock[names[i]] = { recentGames: [] };
    return mock;
  }

  window.MAFIA_ROLE_ASSIGNER_TESTS = {
    name: "mafia-role-assigner",
    tests: [
      {
        name: "buildAssignment preserves multiset (3 mafia + 7 citizen)",
        fn: function ({ assert, assertDeepEqual }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "expected 10 assignments");
          assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must match pool");
        },
      },
      {
        name: "buildAssignment: independent counts as non-town slot",
        fn: function ({ assert, assertDeepEqual }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const pool = ["zodiac", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "length");
          assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset");
          let z = 0;
          let m = 0;
          for (let i = 0; i < out.length; i++) {
            if (out[i] === "zodiac") z++;
            if (out[i] === "mafia") m++;
          }
          assert(z === 1 && m === 2, "zodiac + 2 mafia in assignment");
        },
      },
      {
        name: "buildAssignment returns null when playerNames too short",
        fn: function ({ assert }) {
          MafiaFairAssign.init({
            getLegacyRecord: function () {
              return { recentGames: [] };
            },
          });
          const out = MafiaFairAssign.buildAssignment(["mafia", "citizen"], ["only"], { roles: roles });
          assert(out === null, "expected null");
        },
      },
      {
        name: "badSideDeficit: same citizen-only rate for long vs short history (no veteran inflation)",
        fn: function ({ assert }) {
          const legacy = {
            vet: { recentGames: Array(20).fill({ roleId: "citizen" }) },
            newp: { recentGames: Array(3).fill({ roleId: "citizen" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const n = 11;
          const bad = 3;
          const dVet = MafiaFairAssign._badSideDeficit("vet", roles, n, bad);
          const dNew = MafiaFairAssign._badSideDeficit("newp", roles, n, bad);
          assert(Math.abs(dVet - dNew) < 1e-9, "0% mafia rate over 20 games should equal 0% over 3 games");
        },
      },
      {
        name: "deficit balancing: under-bad history increases bad-side weight vs over-bad (weighted mode)",
        fn: function ({ assert }) {
          const legacy = {
            A: { recentGames: Array(24).fill({ roleId: "citizen" }) },
            B: { recentGames: Array(24).fill({ roleId: "godfather" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({ groupPickMode: "weighted", balanceMode: true, balanceBoost: 0.55, balancePenalty: 0.65 });
          const wA = MafiaFairAssign._calcNonTownGroupWeight("A", roles, 10, 3);
          const wB = MafiaFairAssign._calcNonTownGroupWeight("B", roles, 10, 3);
          assert(wA > wB, "player with fewer recent bad games should have higher weight for bad side");
          MafiaFairAssign.configure({ groupPickMode: "deficit" });
        },
      },
      {
        name: "deficit mode: player over bad-share is not assigned non-town when others are owed",
        fn: function ({ assert }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          legacy.A.recentGames = Array(20).fill({ roleId: "citizen" });
          legacy.B.recentGames = Array(20).fill({ roleId: "godfather" });
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({ groupPickMode: "deficit" });
          const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "assignment");
          const idxB = names.indexOf("B");
          const townFa = roles[out[idxB]] && roles[out[idxB]].teamFa;
          assert(townFa === "شهر", "chronically over-bad player should get city when others are owed bad slots");
        },
      },
      {
        name: "role coverage: under-seen roleId gets higher weight than over-seen",
        fn: function ({ assert }) {
          const legacy = {
            A: { recentGames: Array(20).fill({ roleId: "detective" }) },
            B: { recentGames: Array(20).fill({ roleId: "citizen" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({
            roleCoverageMode: true,
            roleCoverageBoost: 0.55,
            roleCoveragePenalty: 0.4,
          });
          const wA = MafiaFairAssign._calcRoleSlotWeight("A", "detective", 10, 1);
          const wB = MafiaFairAssign._calcRoleSlotWeight("B", "detective", 10, 1);
          assert(wB > wA, "player who rarely had detective should have higher weight for detective slot");
        },
      },
    ],
  };
})();
