/**
 * Standard flow — mozaker, takavar, meeting_epic, pishrafte, shab_mafia.
 * day_vote → day_elim, no end cards. Each scenario has explicit night steps.
 */
(function () {
  "use strict";
  const FLOW = window.FLOW_CONFIGS || {};
  window.FLOW_CONFIGS = FLOW;

  const dayBase = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: { steps: ["day_vote", "day_elim"] },
  };

  FLOW.mozaker = Object.assign({}, dayBase, {
    night: ["night_mafia", "night_doctor", "night_detective", "night_negotiator", "night_reporter"],
  });
  FLOW.takavar = Object.assign({}, dayBase, {
    night: ["night_mafia", "night_doctor", "night_detective", "night_sniper"],
  });
  FLOW.meeting_epic = Object.assign({}, dayBase, {
    night: ["night_natasha", "night_mafia", "night_lecter", "night_doctor", "night_detective", "night_sniper"],
  });
  FLOW.pishrafte = Object.assign({}, dayBase, {
    night: [
      "night_researcher",
      "night_swindler",
      "night_natasha",
      "night_mafia",
      "night_lecter",
      "night_joker_mafia",
      "night_professional",
      "night_doctor",
      "night_detective",
      "night_sniper",
    ],
  });
  FLOW.shab_mafia = Object.assign({}, dayBase, {
    night: ["night_mafia", "night_lecter", "night_joker_mafia", "night_detective", "night_professional", "night_doctor"],
  });
})();
