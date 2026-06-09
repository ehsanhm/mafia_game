/**
 * Devil scenario - Blood on the Clocktower Trouble Brewing inspired flow.
 *
 * Intro night handles setup information and Demon/Minion information.
 * Regular nights resolve Poisoner -> Monk -> Imp -> information roles.
 */
(function () {
  "use strict";
  const FLOW = window.FLOW_CONFIGS || {};
  window.FLOW_CONFIGS = FLOW;

  FLOW.devil = {
    intro_day: ["intro_day_run"],
    intro_night: ["devil_intro_night"],
    day: { steps: ["devil_day_actions", "day_vote", "day_elim"] },
    night: [
      "devil_night_poisoner",
      "devil_night_monk",
      "devil_night_imp",
      "devil_night_ravenkeeper",
      "devil_night_empath",
      "devil_night_fortune_teller",
      "devil_night_undertaker",
      "devil_night_butler",
      "devil_night_spy",
    ],
  };
})();
