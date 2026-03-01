/**
 * Dusk resolution step — shown as last step every day.
 * Displays who left the game during the day (vote-out, kabo shot, gun expiry, etc.).
 * Same data as Status Check Eliminated for day phase.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  function renderDayDuskResolution(ctx) {
    const { f, names, escapeHtml, t, getEliminatedForStatusCheck } = ctx;
    const currentDay = f.day || 1;
    const eliminated = (typeof getEliminatedForStatusCheck === "function" && f)
      ? getEliminatedForStatusCheck(f, currentDay, "day")
      : [];
    const plainNameOf = (idx) => (names && names[idx]) ? names[idx] : (typeof t === "function" ? t("common.playerN", { n: (idx || 0) + 1 }) : "Player " + (idx + 1));
    const elimLabel = t("tool.flow.dusk.eliminated");
    const noneLabel = t("tool.flow.dusk.none");
    const elimText = eliminated.length
      ? eliminated.map(plainNameOf).map(escapeHtml).join("،\u200f ")
      : noneLabel;
    return `
      <div style="text-align:center; padding:20px 0 10px">
        <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:18px; text-transform:uppercase; letter-spacing:.05em">${escapeHtml(t("tool.flow.dusk.title"))}</div>
        <div style="text-align:${(typeof appLang !== "undefined" && appLang === "fa") ? "right" : "left"}; margin:0 auto; max-width:320px; padding:14px 18px; background:rgba(255,255,255,.06); border-radius:12px; border:1px solid rgba(255,255,255,.12)">
          <div style="color:rgba(255,110,70,.95); font-weight:1000">${escapeHtml(elimLabel)} ${elimText}</div>
        </div>
      </div>
    `;
  }

  window.registerStepRenderer("day_dusk_resolution", renderDayDuskResolution);
})();
