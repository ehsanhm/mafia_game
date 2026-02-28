// ─── Scenario Configs ────────────────────────────────────────────────────
// Single source of truth for all per-scenario data.
// To add a new scenario: add one entry here + one <option> in the HTML <select id="scenario">.
//
// Each entry shape:
//   id              – matches the <option value>
//   name            – { fa, en } display name
//   defaults        – { nPlayers, mafiaCount } recommended table size
//   allowedRoles    – which special roles are available in Setup
//   defaultToggles  – which of those are ON by default
//   wakeOrder       – { fa[], en[] } narrator wake-up order shown in the Wake tool
//   features        – { lastMove, endCards } boolean flags for scenario-exclusive UI
//   eliminationCards– [] or array of { id, fa, en } cards drawn on elimination
//   roleOverrides   – { roleId: { descFa } } per-scenario role description overrides

const SCENARIO_CONFIGS = {
  classic: {
    id: "classic",
    name: { fa: "کلاسیک", en: "Classic" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["mafiaBoss", "detective", "doctor"],
    defaultToggles: ["mafiaBoss", "detective", "doctor"],
    wakeOrder: {
      fa: ["تیم مافیا", "پزشک", "کارآگاه"],
      en: ["Mafia team", "Doctor", "Detective"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {},
  },
  bazras: {
    id: "bazras",
    name: { fa: "بازپرس", en: "Inspector" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "nato", "swindler", "detective", "doctor", "investigator", "researcher", "sniper", "invulnerable"],
    defaultToggles: ["mafiaBoss", "nato", "swindler", "detective", "doctor", "investigator", "researcher"],
    wakeOrder: {
      fa: ["محقق", "تیم مافیا", "شیاد", "پزشک", "تک‌تیرانداز", "کارآگاه", "بازپرس"],
      en: ["Researcher", "Mafia team", "Charlatan", "Doctor", "Sniper", "Detective", "Inspector"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {
      doctor: { descFa: "هر شب می‌تواند جان یک نفر را از شلیک نجات دهد. نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد. در سناریو بازپرس، نجات خودش دو بار در کل بازی مجاز است." },
      swindler: { descFa: "هر شب یک نفر را «می‌زند». اگر به کارآگاه بزند، استعلامِ کارآگاه برای همه «منفی» می‌شود. در سناریو بازپرس می‌تواند دو شب پشت‌سرهم یک نفر را هدف بزند (تکرار مجاز است). شیاد با تیم مافیا آشناست و بعد از بیداری مافیا، مستقل بیدار می‌شود." },
      sniper: { descFa: "فقط یک شلیک در کل بازی دارد. اگر به شهروند شلیک کند → خودش خارج می‌شود (حتی اگر پزشک نجات دهد). در سناریو بازپرس: شلیک به رئیس مافیا → هیچ‌کس خارج نمی‌شود؛ شلیک به ناتو/شیاد/مافیا ساده (بدون سیو پزشک) → آن نفر خارج می‌شود." },
      investigator: { descFa: "هر شب دو نفر را برای بازپرسی انتخاب می‌کند. اگر هر دو نفر صبح روز بعد زنده باشند، بازپرسی آغاز می‌شود — هر کدام دو بار صحبت می‌کنند. بازپرس تصمیم می‌گیرد رأی‌گیری بین آن دو انجام شود یا نه." },
      researcher: { descFa: "محقق (هانتر): به‌جز شب معارفه می‌تواند هر شب خودش را به یک نفر «گره» بزند. در سناریو بازپرس: اگر لینک‌شده ناتو یا شیاد باشد، هنگام خروج محقق آن نفر هم خارج می‌شود. اگر رئیس مافیا باشد، رئیس خارج نمی‌شود." },
    },
  },
  namayande: {
    id: "namayande",
    name: { fa: "نماینده", en: "Representative" },
    // 10 players: 3 mafia (Don, Rebel, Hacker) + 7 city (Guide, Doctor, Minemaker, Bodyguard, Lawyer + 2 Citizens)
    // 12 players: + NATO (mafia) + Soldier (city) → 4 mafia + 8 city
    // 13 players: + NATO (mafia) + Soldier (city) + Citizen (city) → 4 mafia + 9 city
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["don", "rebel", "hacker", "nato", "doctor", "guide", "minemaker", "bodyguard", "lawyer", "soldier", "citizen"],
    defaultToggles: ["don", "rebel", "hacker", "doctor", "guide", "minemaker", "bodyguard", "lawyer"],
    wakeOrder: {
      fa: ["هکر", "تیم مافیا (دن)", "راهنما", "پزشک", "محافظ", "سرباز", "مین‌گذار", "وکیل"],
      en: ["Hacker", "Mafia team (Don)", "Guide", "Doctor", "Bodyguard", "Soldier", "Minemaker", "Lawyer"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {
      doctor: { descFa: "هر شب می‌تواند جان یک نفر را نجات دهد. نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد. در سناریو نماینده، نجات خودش دو بار در کل بازی مجاز است." },
      rebel: { descFa: "در سناریو نماینده: هر زمان که یکی از یارهای تیم مافیا (دون مافیا یا هکر یا ناتو) از بازی خارج شود، ضامن یاغی آزاد می‌شود. یاغی می‌تواند تا قبل از شروع رأی‌گیری اول، با یکی از شهروندان منفجر شود. اگر هدف توسط محافظ محافظت شده باشد یا خودش محافظ باشد، یاغی به تنهایی خارج می‌شود." },
      guide: { descFa: "هر شب یکی از بازیکنان را برای راهنمایی انتخاب می‌کند. در سناریو نماینده نمی‌تواند اسپم کند (شب‌های متوالی روی یک نفر). اگر یکی از مافیاها را انتخاب کند، هویت راهنما برای تیم مافیا افشا می‌شود." },
    },
  },
  mozaker: {
    id: "mozaker",
    name: { fa: "مذاکره", en: "Negotiator" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "negotiator", "detective", "doctor", "armored", "reporter", "sniper"],
    defaultToggles: ["mafiaBoss", "negotiator", "detective", "doctor", "armored", "reporter"],
    wakeOrder: {
      fa: ["تیم مافیا", "پزشک", "کارآگاه", "مذاکره‌کننده", "خبرنگار"],
      en: ["Mafia team", "Doctor", "Detective", "Negotiator", "Reporter"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {
      negotiator: { descFa: "اگر یک یا دو نفر از اعضای مافیا از بازی خارج شده باشند، مذاکره‌کننده می‌تواند در شب مذاکره انجام دهد و یک شهروند ساده یا زره‌پوشِ زره‌دار را به مافیای ساده تبدیل کند. اگر نقش دیگری را انتخاب کند مذاکره شکست می‌خورد. در شب مذاکره، مافیا حق شلیک ندارد." },
    },
  },
  takavar: {
    id: "takavar",
    name: { fa: "تکاور", en: "Commando" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "detective", "doctor", "sniper"],
    defaultToggles: ["mafiaBoss", "detective", "doctor", "sniper"],
    wakeOrder: {
      fa: ["تیم مافیا", "پزشک", "کارآگاه", "تک‌تیرانداز"],
      en: ["Mafia team", "Doctor", "Detective", "Sniper"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {},
  },
  kabo: {
    id: "kabo",
    name: { fa: "کاپو", en: "Capo" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["danMafia", "witch", "executioner", "detective", "heir", "herbalist", "armorsmith", "suspect", "informant", "kadkhoda"],
    defaultToggles: ["danMafia", "witch", "executioner", "detective", "heir", "herbalist", "armorsmith", "suspect"],
    wakeOrder: {
      fa: ["وارث", "عطار", "تیم مافیا (جادوگر/دن/جلاد)", "کارآگاه", "زره‌ساز", "کدخدا"],
      en: ["Heir", "Herbalist", "Mafia team (Witch/Don/Executioner)", "Detective", "Armorsmith", "Village Chief"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {
      danMafia: { descFa: "رهبر تیم مافیا در سناریو کاپو. تفنگ کاپو: هر شب ترتیب صف گلوله را بین مظنون‌ها تعیین می‌کند. صبح روز بعد (از روز ۲ به بعد) نفر اول صف یک‌بار دفاع می‌کند، سپس کاپو شلیک می‌کند یا رها می‌کند." },
    },
  },
  pedarkhande: {
    id: "pedarkhande",
    name: { fa: "پدرخوانده", en: "Godfather" },
    defaults: { nPlayers: 11, mafiaCount: 3 },
    allowedRoles: ["godfather", "matador", "saulGoodman", "watson", "leon", "citizenKane", "constantine", "nostradamus"],
    defaultToggles: ["godfather", "matador", "saulGoodman", "watson", "leon", "citizenKane", "constantine", "nostradamus"],
    voteThreshold: "half_minus_one", // نصف منهای یک: defense threshold = (eligible/2) - 1
    wakeOrder: {
      fa: ["نوستراداموس (فقط شب معارفه)", "تیم مافیا (پدرخوانده/ماتادور/ساول)", "دکتر واتسون", "لئون", "همشهری کین", "کنستانتین"],
      en: ["Nostradamus (intro night only)", "Mafia team (Godfather/Matador/Saul)", "Dr. Watson", "Leon", "Citizen Kane", "Constantine"],
    },
    features: { lastMove: false, endCards: true },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [
      { id: "silence_lambs", fa: "سکوت بره‌ها", en: "Silence of the Lambs" },
      { id: "identity_reveal", fa: "افشای هویت", en: "Identity reveal" },
      { id: "beautiful_mind", fa: "ذهن زیبا", en: "Beautiful Mind" },
      { id: "handcuffs", fa: "دستبند", en: "Handcuffs" },
      { id: "face_change", fa: "تغییر چهره", en: "Face Off" },
    ],
    roleOverrides: {
      godfather: { descFa: "در سناریو پدرخوانده یک جلیقه دارد و «حس ششم» دارد. تیم مافیا هر شب معمولاً یکی را انتخاب می‌کند: یا شلیک، یا استفاده از حس ششم، یا خرید توسط ساول (طبق قوانین سناریو)." },
      matador: { descFa: "شب‌ها با تیم مافیا بیدار می‌شود. هر شب یک نفر را نشان می‌دهد؛ آن نفر ۲۴ ساعت قابلیت ندارد. نمی‌تواند دو شب متوالی یک نفر را انتخاب کند (طبق سناریو پدرخوانده)." },
      saulGoodman: { descFa: "معمولاً فقط یک‌بار می‌تواند یک «شهروند ساده» را بخرد و به «مافیا ساده» تبدیل کند؛ در شبی که خرید انجام می‌شود، گرداننده اعلام می‌کند خریداری انجام خواهد شد (طبق سناریو پدرخوانده)." },
      watson: { descFa: "مثل پزشک عمل می‌کند: هر شب می‌تواند جان یک نفر را نجات دهد و جان خودش را فقط یک‌بار در کل بازی می‌تواند نجات دهد (طبق سناریو پدرخوانده)." },
      leon: { descFa: "می‌تواند (طبق قوانین سناریو) محدود شلیک کند؛ اگر به شهروند شلیک کند، خودش کشته می‌شود و معمولاً دکتر نمی‌تواند او را نجات دهد. یک جلیقه هم دارد (طبق سناریو پدرخوانده)." },
      citizenKane: { descFa: "یک‌بار یک نفر را نشان می‌دهد؛ اگر مافیا باشد، گرداننده روز بعد نقشش را افشا می‌کند (در بازی می‌ماند) و همان شب کین با تیر غیب خارج می‌شود. اگر اشتباه: اتفاقی نمی‌افتد، کین قابلیتش را از دست می‌دهد (طبق سناریو پدرخوانده)." },
      constantine: { descFa: "یک‌بار می‌تواند یکی از بازیکنان اخراجی (نقش افشا نشده) را برگرداند. نمی‌تواند کسی که با حس ششم یا کارت افشای هویت خارج شده را برگرداند (طبق سناریو پدرخوانده)." },
      nostradamus: { descFa: "فقط شب معارفه بیدار می‌شود. ۳ نفر را نشان می‌دهد و گرداننده تعداد مافیاهای داخل این ۳ نفر را اعلام می‌کند. سپس نوستراداموس ساید خود را انتخاب می‌کند؛ اگر بین ۳ نفر، ۲ مافیا باشد معمولاً مجبور است در ساید مافیا بازی کند (طبق سناریو پدرخوانده)." },
    },
  },
  zodiac: {
    id: "zodiac",
    name: { fa: "زودیاک", en: "Zodiac" },
    defaults: { nPlayers: 12, mafiaCount: 3 },
    allowedRoles: ["alcapone", "zodiac", "magician", "bomber", "detective", "doctor", "professional", "guard", "ocean", "gunslinger"],
    defaultToggles: ["alcapone", "zodiac", "magician", "bomber", "detective", "doctor", "professional", "guard", "ocean", "gunslinger"],
    wakeOrder: {
      fa: ["تیم مافیا", "شعبده‌باز", "بمب‌گذار", "حرفه‌ای", "پزشک", "کارآگاه", "تفنگدار", "اوشن", "زودیاک"],
      en: ["Mafia team", "Magician", "Bomber", "Professional", "Doctor", "Detective", "Gunslinger", "Ocean", "Zodiac"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_guns", "day_gun_expiry", "day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {},
  },
  meeting_epic: {
    id: "meeting_epic",
    name: { fa: "میتینگ/اپیک", en: "Meeting/Epic" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["mafiaBoss", "nato", "natasha", "doctorLecter", "detective", "doctor", "sniper", "armored", "judge", "commander", "priest"],
    defaultToggles: ["mafiaBoss", "nato", "natasha", "doctorLecter", "detective", "doctor", "sniper", "armored"],
    wakeOrder: {
      fa: ["ناتاشا", "تیم مافیا (رئیس/ناتو)", "دکتر لکتر", "پزشک", "کارآگاه", "تک‌تیرانداز"],
      en: ["Natasha", "Mafia team (Boss/NATO)", "Dr. Lecter", "Doctor", "Detective", "Sniper"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {},
  },
  pishrafte: {
    id: "pishrafte",
    name: { fa: "پیشرفته", en: "Advanced" },
    defaults: { nPlayers: 15, mafiaCount: 5 },
    allowedRoles: ["mafiaBoss", "godfather", "doctorLecter", "jokerMafia", "nato", "natasha", "swindler", "detective", "doctor", "sniper", "professional", "armored", "invulnerable", "judge", "commander", "priest", "researcher", "investigator"],
    defaultToggles: ["mafiaBoss", "doctorLecter", "jokerMafia", "nato", "natasha", "detective", "doctor", "sniper", "armored", "professional", "researcher"],
    wakeOrder: {
      fa: ["محقق", "شیاد", "ناتاشا", "تیم مافیا", "دکتر لکتر", "جوکر مافیا", "حرفه‌ای", "پزشک", "کارآگاه", "تک‌تیرانداز"],
      en: ["Researcher", "Charlatan", "Natasha", "Mafia team", "Dr. Lecter", "Mafia Joker", "Professional", "Doctor", "Detective", "Sniper"],
    },
    features: { lastMove: false, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [],
    roleOverrides: {},
  },
  shab_mafia: {
    id: "shab_mafia",
    name: { fa: "شب مافیا", en: "Mafia Nights" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["godfather", "doctorLecter", "jokerMafia", "detective", "doctor", "professional", "hardJohn", "psychologist", "mayor", "seller"],
    defaultToggles: ["godfather", "doctorLecter", "jokerMafia", "detective", "doctor", "professional", "hardJohn", "psychologist", "mayor", "seller"],
    wakeOrder: {
      fa: ["تیم مافیا", "دکتر لکتر", "جوکر مافیا", "کارآگاه", "حرفه‌ای", "پزشک"],
      en: ["Mafia team", "Dr. Lecter", "Mafia Joker", "Detective", "Professional", "Doctor"],
    },
    features: { lastMove: true, endCards: false },
    dayPhaseConfig: { steps: ["day_vote", "day_elim"] },
    eliminationCards: [
      { id: "insomnia", fa: "بی‌خوابی", en: "Insomnia" },
      { id: "final_shot", fa: "شلیک نهایی", en: "Final Shot" },
      { id: "beautiful_mind", fa: "ذهن زیبا", en: "Beautiful Mind" },
      { id: "thirteen_lies", fa: "دروغ سیزده", en: "Thirteen Lies" },
      { id: "green_mile", fa: "مسیر سبز", en: "Green Mile" },
      { id: "red_carpet", fa: "فرش قرمز", en: "Red Carpet" },
    ],
    roleOverrides: {
      godfather: { descFa: "در «شب‌های مافیا»، پدرخوانده/آل‌کاپون شلیکِ شب را تعیین می‌کند و استعلام او برای کارآگاه «شهروند» نمایش داده می‌شود." },
    },
  },
};

function getScenarioConfig(scenarioId) {
  return SCENARIO_CONFIGS[scenarioId] || SCENARIO_CONFIGS["classic"];
}
