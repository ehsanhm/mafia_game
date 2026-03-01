/**
 * Dawn resolution step — shown as first step every morning (Day 2+).
 * Displays who died and who was revived during the previous night.
 * Same data as Status Check Eliminated/Revived lists.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  function renderDayDawnResolution(ctx) {
    const { f, names, escapeHtml, t } = ctx;
    const prevNightDay = Math.max(1, (f.day || 1) - 1);
    const eliminated = (typeof getEliminatedForStatusCheck === "function" && f)
      ? getEliminatedForStatusCheck(f, prevNightDay, "night")
      : [];
    const revived = (typeof getRevivedForStatusCheck === "function" && f)
      ? getRevivedForStatusCheck(f, prevNightDay, "night")
      : [];
    const plainNameOf = (idx) => (names && names[idx]) ? names[idx] : (typeof t === "function" ? t("common.playerN", { n: (idx || 0) + 1 }) : "Player " + (idx + 1));
    const elimLabel = t("tool.flow.dawn.eliminated");
    const revLabel = t("tool.flow.dawn.revived");
    const noneLabel = t("tool.flow.dawn.none");
    const elimText = eliminated.length
      ? eliminated.map(plainNameOf).map(escapeHtml).join("،\u200f ")
      : noneLabel;
    const revText = revived.length
      ? revived.map(plainNameOf).map(escapeHtml).join("،\u200f ")
      : noneLabel;
    return `
      <div style="text-align:center; padding:20px 0 10px">
        <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:18px; text-transform:uppercase; letter-spacing:.05em">${escapeHtml(t("tool.flow.dawn.title"))}</div>
        <div style="text-align:${(typeof appLang !== "undefined" && appLang === "fa") ? "right" : "left"}; margin:0 auto; max-width:320px; padding:14px 18px; background:rgba(255,255,255,.06); border-radius:12px; border:1px solid rgba(255,255,255,.12)">
          <div style="margin-bottom:12px; color:rgba(255,110,70,.95); font-weight:1000">${escapeHtml(elimLabel)} ${elimText}</div>
          <div style="color:rgba(74,222,128,.95); font-weight:1000">${escapeHtml(revLabel)} ${revText}</div>
        </div>
      </div>
    `;
  }

  window.registerStepRenderer("day_dawn_resolution", renderDayDawnResolution);
})();
