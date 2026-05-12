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
      {
        name: "troll config: reversed aliases make former whitelist the target list",
        fn: function ({ assert }) {
          const cfg = MafiaFairAssign._trollConfig;
          const protectedCases = [
            "آقا مهدی",
            "آقامهدی",
            "مهدی3",
            "۱ مسعود",
            "مسعود خان",
            "مسعودخان",
            "آرتین جان",
            "آرتینجان",
            "مهتاب عزیز دل ستاره",
            "MAHDI-99",
            "agha Masoud khan",
            "aghamahdi3",
            "Jahanbakhsh",
            "آقا جهانبخش",
          ];
          const targetCases = [
            "ناصر جان",
            "ناصرخان",
            "Farzaneh-7",
            "Payam joon",
            "محمد خان",
            "آقا محمد",
            "Khodayar",
            "آقا خدایار",
          ];
          for (let i = 0; i < protectedCases.length; i++) {
            assert(cfg.isWhitelisted(protectedCases[i]), "expected protected match for former target: " + protectedCases[i]);
            assert(!cfg.isTarget(protectedCases[i]), "former target alias should not also be current target: " + protectedCases[i]);
          }
          for (let i = 0; i < targetCases.length; i++) {
            assert(cfg.isTarget(targetCases[i]), "expected current target match for former whitelist: " + targetCases[i]);
            assert(!cfg.isWhitelisted(targetCases[i]), "current target alias should not also be protected: " + targetCases[i]);
          }
          assert(!cfg.isTarget("Player 10"), "numbered generic player must not become a troll target");
        },
      },
      {
        name: "troll config: trigger detection survives Persian digits, prefixes, and suffixes",
        fn: function ({ assert }) {
          const cfg = MafiaFairAssign._trollConfig;
          assert(
            cfg.isTriggered(["۱ مسعود", "قاسم جان", "گلسا جون", "Player 10"]),
            "three decorated trigger aliases should activate troll assignment",
          );
        },
      },
      {
        name: "troll config: trollSystemEnabled disables trigger and forced assignment",
        fn: function ({ assert }) {
          const names = ["Mahdi", "Masoud", "Golsa", "Naser", "Farzaneh", "Khodayar"];
          const legacy = {
            Mahdi: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Masoud: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Golsa: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Naser: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Farzaneh: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Khodayar: { recentGames: Array(40).fill({ roleId: "mafia" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          try {
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: false });
            const cfg = MafiaFairAssign._trollConfig;
            assert(!cfg.enabled, "troll system should report disabled");
            assert(!cfg.isTriggered(names), "disabled troll system should not report triggered");

            const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen"];
            const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
            assert(out && out.length === names.length, "assignment");
            for (let i of [3, 4, 5]) {
              assert(out[i] === "citizen", "disabled troll system should leave over-used targets in town slots: " + names[i]);
            }
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true });
          }
        },
      },
      {
        name: "troll assignment: former whitelist names can now be forced into non-town slots",
        fn: function ({ assert }) {
          const names = ["آقا مهدی", "۱ مسعود", "قاسم جان", "ناصر جان", "Farzaneh-7", "Khodayar"];
          const legacy = emptyLegacy(names);
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const oldRandom = Math.random;
          Math.random = function () { return 0; };
          try {
            const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen"];
            const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
            assert(out && out.length === names.length, "assignment");
            for (let i of [3, 4, 5]) {
              assert(roles[out[i]] && roles[out[i]].teamFa !== "شهر", "decorated former-whitelist target should be non-town: " + names[i]);
            }
            for (let i of [0, 1]) {
              assert(roles[out[i]] && roles[out[i]].teamFa === "شهر", "decorated former target should stay town: " + names[i]);
            }
          } finally {
            Math.random = oldRandom;
          }
        },
      },
    ],
  };
})();
