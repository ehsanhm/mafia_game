// ─── Scenario Guides ─────────────────────────────────────────────────────────
// Comprehensive bilingual (FA/EN) moderator & player guides for each scenario.
// Dependencies (all globals, resolved at call time): appLang, getScenarioConfig, openToolModal.

// ── internal helpers ──────────────────────────────────────────────────────────
function _gs(title, body) {
  return (
    '<div style="margin-bottom:14px;">' +
    '<div style="font-weight:1050;font-size:13px;padding-bottom:4px;margin-bottom:8px;border-bottom:1px solid var(--border);">' +
    title + '</div>' +
    '<div style="font-size:12px;line-height:1.9;color:var(--muted);">' +
    body + '</div></div>'
  );
}
function _gw(arr) {
  return '<div class="toolBox" style="font-size:12px;line-height:1.75;">' + arr.join('') + '</div>';
}

// ── Guide content ─────────────────────────────────────────────────────────────
const SCENARIO_GUIDES = {

  // ══════════════════════════════════════════════════════════════════════════
  classic: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو پایه‌ای و ساده‌ترین نسخه. مناسب برای ۱۰ تا ۱۴ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + شهروند ساده',
        '<br />نسبت پیشنهادی: به ازای هر ۳ شهروند، ۱ مافیا.',
      ].join('')),
      _gs('شب معارفه (شب صفر)', [
        'همه چشم می‌بندند.',
        '<br />گرداننده: «تیم مافیا چشم باز کنید» → مافیا یکدیگر را می‌شناسند و رئیس مافیا را می‌دانند → چشم می‌بندند.',
        '<br />در شب معارفه معمولاً شلیک/نجات/استعلام انجام نمی‌شود (گرداننده ممکن است پزشک و کارآگاه را هم بیدار کند تا مطمئن شود روند را می‌دانند، ولی نتیجه اعمال نمی‌شود).',
      ].join('')),
      _gs('ترتیب شب (شب اول به بعد)', [
        '<b>۱. تیم مافیا:</b> بیدار می‌شوند → با اشاره هدف شلیک را انتخاب می‌کنند → چشم می‌بندند.',
        '<br /><b>۲. پزشک:</b> بیدار می‌شود → یک نفر را برای نجات انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد (اکثر قوانین).',
        '<br />&nbsp;&nbsp;• نجات خود: فقط یک‌بار در کل بازی مجاز است.',
        '<br /><b>۳. کارآگاه:</b> بیدار می‌شود → یک نفر را نشان می‌دهد → گرداننده با علامت جواب می‌دهد (۱ انگشت = شهروند / بیشتر = مافیا) → چشم می‌بندد.',
        '<br /><b>پایان شب:</b> گرداننده نتیجه را اعلام می‌کند.',
      ].join('')),
      _gs('فاز روز', [
        '<b>اعلام نتیجه:</b> گرداننده می‌گوید چه کسی از بازی خارج شد (یا نجات پیدا کرد).',
        '<br /><br /><b>بحث:</b> هر بازیکن فرصت صحبت دارد. مدت بحث معمولاً ۲ دقیقه است.',
        '<br /><br /><b>رأی‌گیری:</b> بازیکنان روی یک نفر رأی می‌دهند.',
        '<br />&nbsp;&nbsp;• اگر اکثریتِ قانونی (بیشتر از نصف حاضران) روی یک نفر متمرکز شود → آن نفر به دفاعیه می‌رود.',
        '<br />&nbsp;&nbsp;• اگر آرا پراکنده باشد → رأی‌گیری مجدد انجام می‌شود یا شب می‌شود (قوانین میز).',
        '<br /><br /><b>دفاعیه:</b> فرد دفاعیه‌رفته دفاع می‌کند (معمولاً ۳۰–۶۰ ثانیه).',
        '<br /><br /><b>حذف:</b> رأی نهایی. اکثریت می‌توانند حذف کنند → نقش فرد حذف‌شده اعلام می‌شود.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>رئیس مافیا:</b> استعلام کارآگاه همیشه «شهروند» (منفی) نمایش می‌دهد.',
        '<br /><b>مافیا ساده:</b> استعلام کارآگاه «مافیا» (مثبت) نشان می‌دهد.',
        '<br /><b>حرف آخر:</b> بازیکن حذف‌شده معمولاً یک حرف آخر کوتاه دارد (قوانین میز).',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا از بازی خارج شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان باقی‌مانده شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'The base Mafia scenario. Best for 10–14 players (default: 12 players, 4 mafia).',
        '<br /><b>Mafia team:</b> Mafia Boss + Simple Mafia members',
        '<br /><b>City team:</b> Detective + Doctor + Citizens',
        '<br />Recommended ratio: 1 mafia per 3 citizens.',
      ].join('')),
      _gs('Intro Night (Night 0)', [
        'All players close eyes.',
        '<br />Host: "Mafia team, open eyes." Mafia learn each other and identify the Boss → close eyes.',
        '<br />No shots/saves/inquiries occur on Night 0 (Host may run Doctor/Detective through motions so they know the process, but no effects apply).',
      ].join('')),
      _gs('Night Phase (Night 1+)', [
        '<b>1. Mafia team:</b> Open eyes → silently agree on target → close eyes.',
        '<br /><b>2. Doctor:</b> Opens eyes → selects a player to save → closes eyes.',
        '<br />&nbsp;&nbsp;• Cannot protect the same person on consecutive nights (most rule sets).',
        '<br />&nbsp;&nbsp;• Self-save: usually once per game.',
        '<br /><b>3. Detective:</b> Opens eyes → points at a player → Host signals: 1 finger = citizen, more fingers = mafia → closes eyes.',
        '<br /><b>End of night:</b> Host announces result.',
      ].join('')),
      _gs('Day Phase', [
        '<b>Night result:</b> Host announces who was eliminated or saved.',
        '<br /><br /><b>Discussion:</b> Each player speaks in turn (~2 minutes total).',
        '<br /><br /><b>Vote:</b> Players vote on one player to defend.',
        '<br />&nbsp;&nbsp;• Legal majority (more than half) on one player → defense.',
        '<br />&nbsp;&nbsp;• Scattered votes → re-vote or night begins (table rules).',
        '<br /><br /><b>Defense:</b> Defendant speaks (30–60 seconds).',
        '<br /><br /><b>Elimination:</b> Final vote. Majority eliminates → role is revealed.',
      ].join('')),
      _gs('Special Rules', [
        '<b>Mafia Boss:</b> Always shows as "citizen" (negative) to the Detective.',
        '<br /><b>Simple Mafia:</b> Shows as "mafia" (positive) to the Detective.',
        '<br /><b>Last words:</b> Eliminated player may say a brief final statement (table rules).',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia count equals or exceeds remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  bazras: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو بازپرس. مناسب برای ۱۰ تا ۱۲ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + شیاد + مافیا ساده (ناتو اختیاری)',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + بازپرس + محقق (هانتر) + تک‌تیرانداز (اختیاری) + شهروند',
        '<br />شیاد با تیم مافیا آشناست ولی به‌طور مستقل بیدار می‌شود.',
      ].join('')),
      _gs('شب معارفه', [
        'تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />شیاد بیدار می‌شود → تیم مافیا را می‌شناسد → چشم می‌بندد.',
        '<br />محقق <b>شب معارفه لینک نمی‌زند</b> (فقط از شب اول به بعد).',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. محقق (هانتر):</b> بیدار می‌شود → یک نفر را برای لینک انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر محقق با شات شب یا رأی از بازی خارج شود، لینک‌شده هم خارج می‌شود.',
        '<br />&nbsp;&nbsp;• استثنا: اگر لینک‌شده رئیس مافیا باشد، معمولاً رئیس خارج نمی‌شود (قوانین میز).',
        '<br /><b>۲. تیم مافیا:</b> بیدار می‌شوند → هدف شلیک را انتخاب می‌کنند → چشم می‌بندند.',
        '<br /><b>۳. شیاد:</b> بیدار می‌شود → یک نفر را نشان می‌دهد (هدف شیادی) → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر شیاد کارآگاه را هدف قرار دهد → استعلام کارآگاه در آن شب «منفی» (شهروند) می‌شود.',
        '<br />&nbsp;&nbsp;• شیاد بعد از تیم اصلی مافیا بیدار می‌شود.',
        '<br /><b>۴. پزشک:</b> بیدار می‌شود → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br /><b>۵. تک‌تیرانداز (اگر فعال باشد):</b> بیدار می‌شود → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• تک‌تیرانداز فقط یک شلیک در کل بازی دارد.',
        '<br />&nbsp;&nbsp;• اگر به شهروند شلیک کند → خودش از بازی خارج می‌شود (حتی اگر پزشک نجات دهد).',
        '<br /><b>۶. کارآگاه:</b> بیدار می‌شود → استعلام می‌گیرد → گرداننده جواب می‌دهد (اگر شیاد او را هدف زده باشد → جواب همیشه «شهروند» است) → چشم می‌بندد.',
      ].join('')),
      _gs('فاز روز', [
        '<b>بحث و رأی‌گیری:</b> مثل کلاسیک.',
        '<br /><br /><b>بازپرسی (ویژگی بازپرس):</b>',
        '<br />بازپرس می‌تواند <b>یک‌بار در کل بازی</b> بازپرسی انجام دهد.',
        '<br />• بازپرس دو نفر را برای دفاعیه می‌آورد (آن دو نفر مدت کوتاهی صحبت می‌کنند).',
        '<br />• سپس طبق قوانین میز، رأی‌گیری بین همان دو نفر انجام می‌شود یا نه.',
        '<br />• بازپرسی جدا از رأی‌گیری معمولی اعمال می‌شود.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>رئیس مافیا:</b> استعلام کارآگاه → «منفی» (شهروند).',
        '<br /><b>شیاد:</b> اگر به کارآگاه بزند → استعلام آن شب «منفی» می‌شود (صرف‌نظر از هدف واقعی).',
        '<br /><b>محقق:</b> لینک هر شب تغییر می‌کند؛ آخرین لینک هنگام خروج محقق فعال است.',
        '<br /><b>تک‌تیرانداز:</b> شلیک به شهروند = مرگ تک‌تیرانداز، حتی اگر دکتر نجات دهد.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Inspector scenario. Best for 10–12 players (default: 10 players, 3 mafia).',
        '<br /><b>Mafia:</b> Mafia Boss + Charlatan + Simple Mafia (NATO optional)',
        '<br /><b>City:</b> Detective + Doctor + Inspector + Researcher (Hunter) + Sniper (optional) + Citizens',
        '<br />Charlatan knows the mafia team but wakes independently.',
      ].join('')),
      _gs('Intro Night', [
        'Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Charlatan opens eyes → sees the mafia team → closes eyes.',
        '<br />Researcher does <b>not</b> link on the intro night.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Researcher (Hunter):</b> Opens eyes → picks a player to link → closes eyes.',
        '<br />&nbsp;&nbsp;• If Researcher is eliminated (night shot or vote), linked player is also eliminated.',
        '<br />&nbsp;&nbsp;• Exception: if link target is the Mafia Boss, Boss usually survives (table rules).',
        '<br /><b>2. Mafia team:</b> Opens eyes → silently pick shot target → closes eyes.',
        '<br /><b>3. Charlatan:</b> Opens eyes → points at a target → closes eyes.',
        '<br />&nbsp;&nbsp;• If Charlatan targets the Detective player → Detective\'s inquiry result is forced "negative" (citizen) that night.',
        '<br /><b>4. Doctor:</b> Opens eyes → saves someone → closes eyes.',
        '<br /><b>5. Sniper (if active):</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• One shot per game. Shooting a citizen = Sniper is eliminated (Doctor cannot prevent this).',
        '<br /><b>6. Detective:</b> Opens eyes → inquires → Host signals result (if Charlatan targeted Detective, answer is always "citizen") → closes eyes.',
      ].join('')),
      _gs('Day Phase', [
        '<b>Discussion & vote:</b> Same as Classic.',
        '<br /><br /><b>Interrogation (Inspector ability):</b>',
        '<br />The Inspector can call an interrogation <b>once per game</b>.',
        '<br />• Inspector selects two players who briefly defend themselves.',
        '<br />• Then a vote is held specifically between those two players (table rules).',
      ].join('')),
      _gs('Special Rules', [
        '<b>Mafia Boss:</b> Always shows "citizen" to Detective.',
        '<br /><b>Charlatan:</b> Targeting the Detective player forces that night\'s inquiry result to "citizen."',
        '<br /><b>Researcher:</b> Link can change each night; the last active link applies when Researcher exits.',
        '<br /><b>Sniper:</b> Shooting a citizen = Sniper dies, regardless of Doctor save.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia count equals or exceeds remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  namayande: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو نماینده. مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>نکته مهم:</b> «نماینده» در این سناریو یک <b>مکانیک انتخابی</b> است، نه یک نقش ثابت — هر روز دو نماینده از میان تمام بازیکنان با رأی‌گیری انتخاب می‌شوند.',
        '<br /><br /><b>تیم مافیا:</b> دن مافیا + یاغی + هکر',
        '<br /><b>تیم شهر:</b> پزشک + راهنما + مین‌گذار + وکیل + محافظ + شهروند ساده (×۲)',
      ].join('')),
      _gs('نقش‌های مافیا', [
        '<b>دن مافیا:</b> استعلام «منفی» (شهروند). یک‌بار در هر روز می‌تواند «رأی خیانت» بزند: یک رأی از هر نماینده‌ای کم یا به او اضافه کند. نمی‌تواند روی خودش اگر نماینده شد این کار را بکند.',
        '<br /><b>یاغی:</b> نفر دوم تیم مافیاست. اگر دن یا هکر از بازی خارج شوند، یاغی «ترور» می‌شود و می‌تواند قبل از رأی‌گیری روزانه یک نفر را از بازی خارج کند (به‌جز محافظ و کسانی که محافظت می‌شوند).',
        '<br /><b>هکر:</b> هر شب توانایی یک نفر را مسدود می‌کند (مثلاً پزشک نمی‌تواند نجات دهد).',
      ].join('')),
      _gs('نقش‌های شهر', [
        '<b>پزشک:</b> هر شب یک نفر را نجات می‌دهد. نجات خود: <b>دو بار</b> در کل بازی مجاز است.',
        '<br /><b>راهنما:</b> هر شب یک نفر را انتخاب می‌کند:',
        '<br />&nbsp;&nbsp;• اگر آن نفر شهروند باشد → مثل کارآگاه استعلام می‌گیرد.',
        '<br />&nbsp;&nbsp;• اگر آن نفر مافیا باشد → آن مافیا بیدار می‌شود و راهنما را می‌شناسد (راهنما لو می‌رود).',
        '<br />&nbsp;&nbsp;• نمی‌تواند دو شب پشت‌سرهم یک نفر را انتخاب کند.',
        '<br /><b>مین‌گذار:</b> یک‌بار در کل بازی روی یک نفر مین می‌گذارد.',
        '<br />&nbsp;&nbsp;• اگر مافیا آن شب همان نفر را شات کند → مین منفجر می‌شود و یک عضو مافیا (که داوطلب فداکاری شده) هم از بازی خارج می‌شود.',
        '<br /><b>وکیل:</b> یک‌بار در کل بازی یک نفر را انتخاب می‌کند تا روز بعد از حذف با رأی مصون باشد.',
        '<br /><b>محافظ:</b> هر شب یک نفر را از ترور محافظت می‌کند. محافظ خودش نیز مصون از ترور است.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. هکر:</b> بیدار → یک نفر را برای مسدود کردن توانایی انتخاب می‌کند → چشم می‌بندد.',
        '<br /><b>۲. تیم مافیا (دن):</b> بیدار → هدف شلیک را انتخاب می‌کند → چشم می‌بندد.',
        '<br /><b>۳. راهنما:</b> بیدار → یک نفر را انتخاب می‌کند → گرداننده جواب می‌دهد (اگر شهروند: استعلام منفی/مثبت؛ اگر مافیا: آن مافیا بیدار می‌شود و راهنما را می‌بیند) → چشم می‌بندد.',
        '<br /><b>۴. پزشک:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br /><b>۵. محافظ:</b> بیدار → یک نفر را محافظت می‌کند → چشم می‌بندد.',
        '<br /><i>مین‌گذار و وکیل توانایی‌شان یک‌باره است و شبانه اعلام می‌کنند (طبق قوانین میز).</i>',
      ].join('')),
      _gs('فاز روز — انتخاب نمایندگان', [
        'این مکانیک جایگزین رأی‌گیری معمولی می‌شود:',
        '<br /><br /><b>۱. صحبت:</b> هر بازیکن صحبت می‌کند.',
        '<br /><b>۲. رأی‌گیری اول:</b> هر بازیکن یک نفر را به‌عنوان نماینده انتخاب می‌کند. کسی که بیشترین رأی را بیاورد → <b>نماینده اول</b>.',
        '<br /><b>۳. رأی‌گیری دوم:</b> رأی‌گیری مجدد برای <b>نماینده دوم</b>.',
        '<br />&nbsp;&nbsp;• استثنا: اگر در رأی‌گیری اول تساوی باشد → هر دو نماینده می‌شوند و رأی‌گیری دوم انجام نمی‌شود.',
        '<br /><b>۴. استراحت نیم‌روزی:</b> مافیا مشورت می‌کنند. دن «رأی خیانت» را مخفیانه اعمال می‌کند.',
        '<br /><b>۵. اتهام:</b> هر نماینده یک نفر را متهم می‌کند (۲۰ ثانیه صحبت).',
        '<br /><b>۶. دفاع:</b> متهم می‌تواند یک نفر را به‌عنوان مدافع معرفی کند. ابتدا حامیان نمایندگان صحبت می‌کنند، سپس متهم.',
        '<br /><b>۷. رأی‌گیری نهایی:</b> ۴ رأی برای حذف کافی است.',
      ].join('')),
      _gs('یاغی (ترور)', [
        'اگر دن مافیا یا هکر از بازی خارج شوند → یاغی به «ترور» تبدیل می‌شود.',
        '<br />ترور می‌تواند <b>قبل از رأی‌گیری روزانه</b> یک نفر را از بازی خارج کند.',
        '<br />نمی‌تواند محافظ یا افرادی که تحت محافظت هستند را هدف قرار دهد.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
      _gs('یادداشت (پیاده‌سازی این اپلیکیشن)', [
        'نقش‌های فعال در اپ: دن مافیا + یاغی + هکر + پزشک + راهنما + مین‌گذار + وکیل + محافظ.',
        '<br />مکانیک انتخاب نمایندگان و رأی خیانت دن باید توسط گرداننده به‌صورت دستی مدیریت شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Representative scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Important:</b> "Representative" is an <b>election mechanic</b>, not a fixed role — two representatives are voted in by the whole table each day.',
        '<br /><br /><b>Mafia:</b> Don (Mafia leader) + Rebel (Yaghee) + Hacker',
        '<br /><b>City:</b> Doctor + Guide + Minemaker + Lawyer + Bodyguard + Simple Citizens (×2)',
      ].join('')),
      _gs('Mafia Roles', [
        '<b>Don (Mafia leader):</b> Shows "negative" (citizen) to inquiry. Once per day may apply a "betrayal vote": secretly adds or subtracts 1 from any representative\'s vote total. Cannot target themselves if they become a representative.',
        '<br /><b>Rebel (Yaghee):</b> Second in command. If the Don or Hacker is eliminated, the Rebel becomes the Assassin — may eliminate one player before the daily vote (cannot target Bodyguard or protected players).',
        '<br /><b>Hacker:</b> Each night blocks one player\'s ability (e.g., Doctor cannot save that night).',
      ].join('')),
      _gs('City Roles', [
        '<b>Doctor:</b> Saves one player each night. Self-save: allowed <b>twice</b> per game.',
        '<br /><b>Guide:</b> Selects one player each night:',
        '<br />&nbsp;&nbsp;• If citizen → receives an inquiry result (like Detective).',
        '<br />&nbsp;&nbsp;• If mafia → that mafia member wakes up and sees the Guide\'s identity (Guide is exposed).',
        '<br />&nbsp;&nbsp;• Cannot target the same player on consecutive nights.',
        '<br /><b>Minemaker:</b> Once per game, plants a mine on one player.',
        '<br />&nbsp;&nbsp;• If mafia shoots that player the same night → mine activates, also eliminating a volunteering mafia member.',
        '<br /><b>Lawyer:</b> Once per game, grants one player immunity from vote-elimination the following day.',
        '<br /><b>Bodyguard:</b> Protects one player from assassination each night. Bodyguard themselves is also immune to assassination.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Hacker:</b> Opens eyes → picks a player to disable their ability → closes eyes.',
        '<br /><b>2. Mafia team (Don):</b> Opens eyes → picks shot target → closes eyes.',
        '<br /><b>3. Guide:</b> Opens eyes → picks a player → Host signals result (citizen: inquiry answer; mafia: that mafia wakes and sees the Guide) → closes eyes.',
        '<br /><b>4. Doctor:</b> Opens eyes → saves someone → closes eyes.',
        '<br /><b>5. Bodyguard:</b> Opens eyes → protects someone → closes eyes.',
        '<br /><i>Minemaker and Lawyer use their once-per-game powers at night (table rules for timing).</i>',
      ].join('')),
      _gs('Day Phase — Representative Election', [
        'This mechanic replaces the standard vote:',
        '<br /><br /><b>1. Discussion:</b> Each player speaks.',
        '<br /><b>2. First vote:</b> Each player nominates one representative. Most votes → <b>1st Representative</b>.',
        '<br /><b>3. Second vote:</b> Second round to elect <b>2nd Representative</b>.',
        '<br />&nbsp;&nbsp;• Exception: if there is a tie in round 1 → all tied players become representatives and round 2 is skipped.',
        '<br /><b>4. Midday break:</b> Mafia discuss; Don secretly applies the betrayal vote.',
        '<br /><b>5. Accusation:</b> Each representative accuses one player (20 seconds).',
        '<br /><b>6. Defense:</b> Each accused may name one defender. Representatives\' supporters speak first, then the accused.',
        '<br /><b>7. Final vote:</b> 4 votes are required to eliminate.',
      ].join('')),
      _gs('Rebel (Assassin Mode)', [
        'If the Don or Hacker is eliminated → Rebel becomes the Assassin.',
        '<br />Assassin may eliminate one player <b>before</b> the daily vote.',
        '<br />Cannot target the Bodyguard or players currently under protection.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
      _gs('Note (App Implementation)', [
        'Active roles in app: Don + Rebel + Hacker + Doctor + Guide + Minemaker + Lawyer + Bodyguard.',
        '<br />The representative election mechanic and Don\'s betrayal vote must be managed manually by the host.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  mozaker: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو مذاکره. مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + مذاکره‌کننده + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + زره‌پوش + خبرنگار + تک‌تیرانداز (اختیاری) + شهروند',
      ].join('')),
      _gs('ترتیب شب (معمولی)', [
        '<b>۱. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندد.',
        '<br /><b>۲. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۳. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۴. مذاکره‌کننده:</b> معمولاً فقط در شب مذاکره بیدار می‌شود.',
        '<br /><b>۵. خبرنگار:</b> در شب مذاکره بیدار می‌شود.',
      ].join('')),
      _gs('شب مذاکره (ویژه)', [
        'وقتی ۱ یا ۲ نفر از مافیا از بازی خارج شده باشند، مذاکره‌کننده می‌تواند «شب مذاکره» را فعال کند.',
        '<br /><br /><b>روند شب مذاکره:</b>',
        '<br />• در شب مذاکره، <b>مافیا شلیک نمی‌کند</b>.',
        '<br />• مذاکره‌کننده بیدار می‌شود → یک نفر را برای مذاکره انتخاب می‌کند → چشم می‌بندد.',
        '<br />• اگر هدف <b>شهروند ساده</b> یا <b>زره‌پوشِ زره‌دار</b> باشد → مذاکره موفق است → آن نفر به «مافیا ساده» تبدیل می‌شود.',
        '<br />• اگر هدف نقش دیگری (کارآگاه، پزشک، خبرنگار...) باشد → مذاکره شکست می‌خورد (اعلام نمی‌شود چه کسی هدف بوده).',
        '<br /><b>خبرنگار:</b> بیدار می‌شود → گرداننده با علامت نشان می‌دهد آیا هدف مذاکره شهروند/زره‌پوش بود یا نه → چشم می‌بندد.',
        '<br /><br /><b>زره‌پوش:</b>',
        '<br />• شلیک مافیا در شب کشنده نیست.',
        '<br />• اگر با رأی از بازی خارج شود، نقشش اعلام می‌شود و <b>به بازی برمی‌گردد</b>.',
        '<br />• پس از برگشت، دیگر قابل مذاکره نیست (مصونیت از مذاکره).',
      ].join('')),
      _gs('فاز روز', [
        'بحث، رأی‌گیری و دفاعیه مثل کلاسیک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Negotiator scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Mafia Boss + Negotiator + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Armored + Reporter + Sniper (optional) + Citizens',
      ].join('')),
      _gs('Regular Night Phase', [
        '<b>1. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br /><b>2. Doctor:</b> Open eyes → save → close eyes.',
        '<br /><b>3. Detective:</b> Open eyes → inquire → close eyes.',
        '<br /><b>4. Negotiator:</b> Only wakes on Negotiation Night.',
        '<br /><b>5. Reporter:</b> Only wakes on Negotiation Night.',
      ].join('')),
      _gs('Negotiation Night (Special)', [
        'When 1 or 2 mafia members have been eliminated, the Negotiator may activate a Negotiation Night.',
        '<br /><br /><b>Negotiation Night flow:</b>',
        '<br />• <b>No mafia shot</b> during a negotiation night.',
        '<br />• Negotiator opens eyes → picks a player to negotiate → closes eyes.',
        '<br />• If target is a <b>Simple Citizen</b> or <b>Armored (still armored)</b> → negotiation succeeds → target joins mafia as Simple Mafia.',
        '<br />• If target has any other role → negotiation fails (not announced who was targeted).',
        '<br /><b>Reporter:</b> Opens eyes → Host signals whether the negotiation target was a citizen/armored → closes eyes.',
        '<br /><br /><b>Armored:</b>',
        '<br />• Cannot be killed by night shot.',
        '<br />• If voted out during the day → role is revealed and they <b>return to the game</b>.',
        '<br />• After returning, Armored is no longer eligible for negotiation.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  takavar: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو تکاور (کماندو). مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + تک‌تیرانداز + شهروند ساده',
        '<br />تمرکز این سناریو روی مکانیک تک‌تیرانداز است.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندد.',
        '<br /><b>۲. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۳. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۴. تک‌تیرانداز:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
      ].join('')),
      _gs('قوانین تک‌تیرانداز', [
        '<b>تعداد شلیک:</b> فقط یک‌بار در کل بازی می‌تواند شلیک کند.',
        '<br /><b>شلیک صحیح (به مافیا):</b> هدف از بازی خارج می‌شود. پزشک نمی‌تواند جلوی این را بگیرد.',
        '<br /><b>شلیک اشتباه (به شهروند):</b>',
        '<br />&nbsp;&nbsp;• هدف سالم می‌ماند.',
        '<br />&nbsp;&nbsp;• تک‌تیرانداز از بازی خارج می‌شود (دکتر نمی‌تواند نجات دهد).',
        '<br /><b>نکته:</b> تک‌تیرانداز می‌تواند اصلاً شلیک نکند تا زمان مناسب.',
        '<br /><b>زمان شلیک:</b> فقط شب (در این سناریو).',
      ].join('')),
      _gs('فاز روز', [
        'بحث، رأی‌گیری و دفاعیه مثل کلاسیک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Commando (Sniper) scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Mafia Boss + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Sniper + Citizens',
        '<br />This scenario centers on the Sniper mechanic.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br /><b>2. Doctor:</b> Open eyes → save → close eyes.',
        '<br /><b>3. Detective:</b> Open eyes → inquire → close eyes.',
        '<br /><b>4. Sniper:</b> Opens eyes → points at target if shooting → closes eyes.',
      ].join('')),
      _gs('Sniper Rules', [
        '<b>Shots:</b> Only one shot allowed per game.',
        '<br /><b>Correct shot (hits mafia):</b> Target is eliminated. Doctor cannot prevent this.',
        '<br /><b>Wrong shot (hits citizen):</b>',
        '<br />&nbsp;&nbsp;• Target is unharmed.',
        '<br />&nbsp;&nbsp;• Sniper is eliminated (Doctor cannot prevent this).',
        '<br /><b>Note:</b> Sniper may choose not to shoot until confident.',
        '<br /><b>Timing:</b> Night phase only in this scenario.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  kabo: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو کاپو. مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> دن مافیا + جادوگر + جلاد + خبرچین (اختیاری)',
        '<br /><b>تیم شهر:</b> کارآگاه + وارث + عطار + زره‌ساز + کدخدا + مظنون + شهروند',
        '<br />پیچیده‌ترین سناریو از نظر مکانیک‌های ویژه.',
      ].join('')),
      _gs('شب معارفه', [
        'وارث بیدار می‌شود → یک نفر را برای وراثت انتخاب می‌کند → چشم می‌بندد.',
        '<br />تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />در شب معارفه معمولاً عطار زهر نمی‌دهد.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. وارث:</b> بیدار → هر شب انتخاب می‌کند (یا همان نفر اول را نگه می‌دارد طبق قوانین میز) → چشم می‌بندد.',
        '<br /><b>۲. تیم مافیا (جادوگر/دن/جلاد):</b> بیدار → مشورت:',
        '<br />&nbsp;&nbsp;• <b>دن مافیا:</b> هدف شلیک را مشخص می‌کند.',
        '<br />&nbsp;&nbsp;• <b>جادوگر:</b> یک شهروند را انتخاب می‌کند؛ اگر آن شهروند توانایی داشته باشد، توانایی‌اش روی جادوگر اجرا می‌شود (مثلاً اگر کارآگاه را انتخاب کند، جادوگر استعلام می‌گیرد؛ اگر عطار را انتخاب کند، جادوگر زهر می‌زند).',
        '<br />&nbsp;&nbsp;• <b>جلاد:</b> اگر بخواهد، نقش دقیق یک بازیکن را به گرداننده اعلام می‌کند → اگر درست باشد، آن نفر در هر شرایطی از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;→ تیم مافیا چشم می‌بندند.',
        '<br /><b>۳. عطار:</b> بیدار → یک نفر را برای زهر انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• صبح: «زهر وارد بازی شده است» اعلام می‌شود.',
        '<br />&nbsp;&nbsp;• اگر تا پایان روز فرد مسموم از بازی خارج نشود → رأی‌گیری برای پادزهر برگزار می‌شود.',
        '<br />&nbsp;&nbsp;• دن مافیا یک پادزهر دارد و می‌تواند اثر زهر روی خودش را خنثی کند.',
        '<br /><b>۴. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• مظنون: استعلام «مثبت» (مافیا) می‌دهد با اینکه شهروند است.',
        '<br />&nbsp;&nbsp;• خبرچین: استعلام «منفی» (شهروند) می‌دهد.',
        '<br /><b>۵. زره‌ساز:</b> بیدار → اگر می‌خواهد از تنها زره خود استفاده کند، خودش را نشان می‌دهد → چشم می‌بندد.',
        '<br /><b>۶. کدخدا:</b> بیدار → اگر می‌خواهد یک نفر را «لینک» کند، او را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فرد لینک‌شده بیدار می‌شود (با چشمان باز، بدون دانستن نقش کدخدا).',
        '<br />&nbsp;&nbsp;• اگر فرد لینک‌شده شهروند یا خبرچین باشد → اتفاقی نمی‌افتد.',
        '<br />&nbsp;&nbsp;• اگر فرد لینک‌شده مافیا (به‌جز خبرچین) باشد → کدخدا از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• کدخدا می‌تواند ۲ نفر را در طول بازی لینک کند.',
      ].join('')),
      _gs('ویژگی وارث', [
        'شب معارفه یک نفر را برای وراثت انتخاب می‌کند.',
        '<br />تا قبل از اینکه آن نفر از بازی خارج شود، وارث «نامیراست» (مافیا نمی‌تواند او را شات کند).',
        '<br />وقتی فردِ انتخاب‌شده از بازی خارج شود، وارث توانایی آن نقش را به ارث می‌برد (طبق قوانین میز، معمولاً فقط نقش‌هایی مثل کارآگاه، زره‌ساز، عطار).',
        '<br />پس از ارث بردن، وارث دیگر نامیرا نیست.',
      ].join('')),
      _gs('فاز روز', [
        'بحث، رأی‌گیری و دفاعیه مثل کلاسیک.',
        '<br />اگر فردِ مسموم عطار تا پایان روز از بازی خارج نشده باشد → رأی‌گیری «پادزهر» انجام می‌شود.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Capo scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Mafia Don + Witch + Executioner + Informant (optional)',
        '<br /><b>City:</b> Detective + Heir + Herbalist + Armorsmith + Kadkhoda + Suspect + Citizens',
        '<br />The most mechanically complex scenario.',
      ].join('')),
      _gs('Intro Night', [
        'Heir opens eyes → picks a player to inherit from → closes eyes.',
        '<br />Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Herbalist typically does not poison on the intro night.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Heir:</b> Opens eyes → confirms/updates their inheritance target → closes eyes.',
        '<br /><b>2. Mafia team (Witch/Don/Executioner):</b> Open eyes → coordinate:',
        '<br />&nbsp;&nbsp;• <b>Mafia Don:</b> Decides shot target.',
        '<br />&nbsp;&nbsp;• <b>Witch:</b> Picks a citizen; if that citizen has an ability, the ability is applied to the Witch instead (e.g., selecting Detective = Witch gets an inquiry; selecting Herbalist = Witch poisons someone).',
        '<br />&nbsp;&nbsp;• <b>Executioner:</b> If desired, names one player\'s exact role to the Host → if correct, that player is eliminated unconditionally.',
        '<br />&nbsp;&nbsp;→ Mafia team closes eyes.',
        '<br /><b>3. Herbalist:</b> Opens eyes → picks a poison target → closes eyes.',
        '<br />&nbsp;&nbsp;• Morning: Host announces "poison is in play."',
        '<br />&nbsp;&nbsp;• If the poisoned player is not eliminated by end of day → antidote vote is held.',
        '<br />&nbsp;&nbsp;• Mafia Don has one antidote (can neutralize poison aimed at themselves).',
        '<br /><b>4. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br />&nbsp;&nbsp;• Suspect shows "positive" (mafia) even though they are a citizen.',
        '<br />&nbsp;&nbsp;• Informant shows "negative" (citizen).',
        '<br /><b>5. Armorsmith:</b> Opens eyes → signals self-save if desired → closes eyes.',
        '<br /><b>6. Kadkhoda:</b> Opens eyes → points at a player to link → closes eyes.',
        '<br />&nbsp;&nbsp;• Linked player opens eyes (no role revealed).',
        '<br />&nbsp;&nbsp;• If linked player is a citizen or Informant → nothing happens.',
        '<br />&nbsp;&nbsp;• If linked player is mafia (not Informant) → Kadkhoda is eliminated.',
        '<br />&nbsp;&nbsp;• Kadkhoda can link up to 2 players per game.',
      ].join('')),
      _gs('Heir Ability', [
        'On intro night, Heir selects one player whose ability to inherit.',
        '<br />Until that selected player is eliminated, Heir is <b>immortal</b> (immune to night shot).',
        '<br />When the selected player is eliminated, Heir inherits their ability (usually restricted to Detective, Armorsmith, Herbalist — table rules).',
        '<br />After inheriting, Heir is no longer immortal.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  pedarkhande: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو پدرخوانده. مناسب برای ۱۱ نفر (پیش‌فرض: ۱۱ نفر، ۳ مافیا). نقش‌ها از فیلم‌های معروف الهام گرفته‌اند.',
        '<br /><b>تیم مافیا:</b> پدرخوانده + ماتادور + ساول گودمن',
        '<br /><b>تیم شهر:</b> دکتر واتسون + لئون + همشهری کین + کنستانتین + نوستراداموس (مستقل/سایدانتخابی)',
        '<br />ویژگی: <b>کارت حذف</b> — هر بار کسی از بازی خارج می‌شود یک کارت ویژه کشیده می‌شود.',
      ].join('')),
      _gs('شب معارفه', [
        'نوستراداموس بیدار می‌شود → ۳ نفر را نشان می‌دهد → گرداننده تعداد مافیاهای داخل آن ۳ نفر را اعلام می‌کند.',
        '<br />نوستراداموس بر اساس این اطلاعات ساید خود را انتخاب می‌کند:',
        '<br />&nbsp;&nbsp;• اگر هیچ‌کدام مافیا نباشند → معمولاً شهروند می‌شود.',
        '<br />&nbsp;&nbsp;• اگر ۱ نفر مافیا باشد → آزاد است.',
        '<br />&nbsp;&nbsp;• اگر ۲ نفر مافیا باشند → معمولاً مجبور است ساید مافیا را انتخاب کند.',
        '<br />تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />نوستراداموس فقط شب معارفه بیدار می‌شود.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا (پدرخوانده/ماتادور/ساول):</b> بیدار → مشورت:',
        '<br />&nbsp;&nbsp;• <b>پدرخوانده:</b> شلیک یا «حس ششم» (هر شب یک گزینه: شلیک/حس ششم/خرید توسط ساول).',
        '<br />&nbsp;&nbsp;• <b>ماتادور:</b> یک نفر را نشان می‌دهد؛ اگر آن نفر همان شب بیدار شود، گرداننده با علامت ضربدر خبر می‌دهد که توانایی‌اش مسدود شده.',
        '<br />&nbsp;&nbsp;• <b>ساول گودمن:</b> یک‌بار در کل بازی می‌تواند یک «شهروند ساده» را بخرد و به «مافیا ساده» تبدیل کند.',
        '<br />&nbsp;&nbsp;→ تیم مافیا چشم می‌بندند.',
        '<br /><b>۲. دکتر واتسون:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• نجات خود: فقط یک‌بار در کل بازی.',
        '<br /><b>۳. لئون:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را مشخص می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر به شهروند شلیک کند → خودش از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• دکتر واتسون نمی‌تواند لئون را در این حالت نجات دهد.',
        '<br />&nbsp;&nbsp;• لئون یک جلیقه دارد (شلیک اول مافیا را تحمل می‌کند).',
        '<br /><b>۴. همشهری کین:</b> بیدار → یک نفر را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر آن نفر مافیا باشد، صبح ساید او توسط گرداننده اعلام می‌شود (بدون خروج فوری).',
        '<br />&nbsp;&nbsp;• در برخی قوانین، اگر حدسش درست بود، شب بعد خودِ کین از بازی خارج می‌شود.',
        '<br /><b>۵. کنستانتین:</b> بیدار → اگر می‌خواهد یک بازیکن اخراجی را برگرداند، اعلام می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط بازیکنانی که نقششان هنوز اعلام نشده قابل برگشت هستند.',
        '<br />&nbsp;&nbsp;• کنستانتین فقط یک‌بار می‌تواند این کار را بکند.',
      ].join('')),
      _gs('کارت‌های حذف', [
        'وقتی هر بازیکنی از بازی خارج می‌شود، یک کارت از بین کارت‌های زیر کشیده می‌شود:',
        '<br /><b>سکوت بره‌ها:</b> بازیکن بدون حق دفاعیه از بازی خارج می‌شود.',
        '<br /><b>افشای هویت:</b> بازیکن باید نقش واقعی خود را اعلام کند.',
        '<br /><b>ذهن زیبا:</b> بازیکن باید یک پیش‌بینی درباره بازی بگوید.',
        '<br /><b>دستبند:</b> بازیکن مجبور است یک نفر دیگر را همراه خود حذف کند.',
        '<br /><b>تغییر چهره:</b> بازیکن می‌تواند نقش خود را با نقش کسی دیگر عوض کند.',
        '<br /><b>دوئل:</b> بازیکن یک نفر را به دوئل (رأی‌گیری مستقیم) دعوت می‌کند.',
        '<br /><i>جزئیات دقیق هر کارت بسته به قوانین میز متفاوت است.</i>',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
        '<br /><b>نوستراداموس:</b> بسته به ساید انتخابی، شرط پیروزی همان ساید را دارد.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Godfather scenario. Default: 11 players, 3 mafia. Roles inspired by famous movies.',
        '<br /><b>Mafia:</b> Godfather + Matador + Saul Goodman',
        '<br /><b>City:</b> Dr. Watson + Leon + Citizen Kane + Constantine + Nostradamus (side-choosing)',
        '<br />Feature: <b>Elimination Cards</b> — drawn every time a player is eliminated.',
      ].join('')),
      _gs('Intro Night', [
        'Nostradamus opens eyes → selects 3 players → Host reveals how many of those 3 are mafia.',
        '<br />Nostradamus chooses their side based on this info:',
        '<br />&nbsp;&nbsp;• 0 mafia among 3 → usually becomes city.',
        '<br />&nbsp;&nbsp;• 1 mafia among 3 → free choice.',
        '<br />&nbsp;&nbsp;• 2 mafia among 3 → usually must join mafia.',
        '<br />Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Nostradamus only wakes on the intro night.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team (Godfather/Matador/Saul):</b> Open eyes → coordinate:',
        '<br />&nbsp;&nbsp;• <b>Godfather:</b> Chooses one action per night: shoot / use sixth sense / let Saul buy.',
        '<br />&nbsp;&nbsp;• <b>Matador:</b> Points at one player; if that player wakes up this night, Host signals with an X that their ability is blocked.',
        '<br />&nbsp;&nbsp;• <b>Saul Goodman:</b> Once per game can buy a Simple Citizen, converting them to Simple Mafia.',
        '<br />&nbsp;&nbsp;→ Mafia team closes eyes.',
        '<br /><b>2. Dr. Watson:</b> Opens eyes → saves someone → closes eyes.',
        '<br />&nbsp;&nbsp;• Self-save: once per game only.',
        '<br /><b>3. Leon:</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• If shoots a citizen → Leon is eliminated (Watson cannot prevent this).',
        '<br />&nbsp;&nbsp;• Leon has one vest (survives first mafia shot).',
        '<br /><b>4. Citizen Kane:</b> Opens eyes → points at one player → closes eyes.',
        '<br />&nbsp;&nbsp;• If that player is mafia → their side is announced by Host next morning (no immediate elimination).',
        '<br />&nbsp;&nbsp;• In some rule sets, if Kane\'s guess was correct → Kane exits the game the following night.',
        '<br /><b>5. Constantine:</b> Opens eyes → signals if reviving an eliminated player → closes eyes.',
        '<br />&nbsp;&nbsp;• Only players whose roles were not yet announced can be revived.',
        '<br />&nbsp;&nbsp;• Constantine can do this once per game.',
      ].join('')),
      _gs('Elimination Cards', [
        'Every time a player is eliminated, one card is drawn:',
        '<br /><b>Silence of the Lambs:</b> Player exits with no defense.',
        '<br /><b>Identity Reveal:</b> Player must announce their real role.',
        '<br /><b>Beautiful Mind:</b> Player makes a game prediction.',
        '<br /><b>Handcuffs:</b> Player must take another player out with them.',
        '<br /><b>Face Off:</b> Player may swap roles with another player.',
        '<br /><b>Duel:</b> Player challenges another to a direct vote.',
        '<br /><i>Exact card effects depend on table rules.</i>',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
        '<br /><b>Nostradamus:</b> Wins with whichever side they chose.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  zodiac: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو زودیاک. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۳ مافیا). دارای تیم <b>مستقل</b> (زودیاک).',
        '<br /><b>تیم مافیا:</b> آلکاپن + شعبده‌باز + بمب‌گذار + مافیا ساده',
        '<br /><b>تیم مستقل:</b> زودیاک',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + حرفه‌ای + محافظ + اوشن + تفنگدار + شهروند',
        '<br />فاز روز در این سناریو دارای مراحل اضافه (تفنگ) است.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندد.',
        '<br /><b>۲. شعبده‌باز:</b> بیدار → یک نفر از شهر را برای غیرفعال‌سازی انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• آن نفر در همان شب توانایی‌اش ندارد (مثلاً کارآگاه نمی‌تواند استعلام کند).',
        '<br /><b>۳. بمب‌گذار:</b> بیدار → اگر می‌خواهد بمب‌گذاری کند:',
        '<br />&nbsp;&nbsp;• یک عدد بین ۱ تا ۴ را به گرداننده اعلام می‌کند (کد مخفی).',
        '<br />&nbsp;&nbsp;• یک هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• صبح: گرداننده به هدف اعلام می‌کند که بمب‌گذاری شده.',
        '<br />&nbsp;&nbsp;• هدف باید عدد ۱ تا ۴ را حدس بزند → درست = زنده می‌ماند / غلط = از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• محافظ می‌تواند فدا شود (ر.ک. بخش بعد).',
        '<br /><b>۴. زودیاک:</b> بیدار → <b>فقط شب‌های زوج</b> می‌تواند شلیک کند → هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• زودیاک با شلیک شب کشته نمی‌شود.',
        '<br />&nbsp;&nbsp;• اگر به محافظ شلیک کند → زودیاک کشته می‌شود.',
        '<br /><b>۵. حرفه‌ای:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر به شهروند شلیک کند → خودش از بازی خارج می‌شود.',
        '<br /><b>۶. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۷. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۸. تفنگدار:</b> بیدار → یک تفنگ به یک نفر می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• ۳ تفنگ دارد: ۲ تیر مشقی + ۱ تیر جنگی. خودش نمی‌داند کدام‌ها مشقی هستند.',
        '<br />&nbsp;&nbsp;• گیرنده تفنگ روز بعد می‌تواند با آن شلیک کند.',
        '<br /><b>۹. اوشن:</b> بیدار → ۲ بار در کل بازی می‌تواند چند شهروند را بیدار کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر اشتباهاً یک مافیا یا زودیاک را بیدار کند → اوشن از بازی خارج می‌شود.',
      ].join('')),
      _gs('مکانیک بمب‌گذار و محافظ', [
        '<b>بمب‌گذاری:</b>',
        '<br />• بمب‌گذار هدف را مشخص می‌کند و کد ۱–۴ به گرداننده می‌دهد.',
        '<br />• هدف یک بار حدس می‌زند. درست → زنده / غلط → خارج.',
        '<br /><br /><b>محافظ (فدا):</b>',
        '<br />• وقتی بمب اعلام می‌شود، محافظ می‌تواند خودش را فدا کند (جای هدف بمب را می‌گیرد).',
        '<br />• محافظ باید کد خنثی‌سازی را حدس بزند.',
        '<br />• درست → هم محافظ زنده، هم هدف اصلی زنده.',
        '<br />• غلط → محافظ از بازی خارج می‌شود ولی هدف اصلی زنده می‌ماند.',
      ].join('')),
      _gs('فاز روز (مراحل)', [
        '<b>۱. بررسی تفنگ‌ها:</b> گیرندگان تفنگ می‌توانند اعلام کنند که شلیک می‌کنند یا نه.',
        '<br /><b>۲. انقضا تفنگ:</b> اگر کسی با تفنگ به هدفی شلیک کرد، نتیجه بررسی می‌شود.',
        '<br />&nbsp;&nbsp;• تیر جنگی → هدف خارج می‌شود (اگر پزشک یا زودیاک نباشد).',
        '<br />&nbsp;&nbsp;• تیر مشقی → هیچ‌اتفاقی نمی‌افتد.',
        '<br /><b>۳. رأی‌گیری:</b> مثل کلاسیک.',
        '<br /><b>۴. دفاعیه و حذف:</b> مثل کلاسیک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا و زودیاک از بازی خارج شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از باقی‌مانده‌های غیرمافیا شود.',
        '<br /><b>زودیاک:</b> آخرین تیم یا آخرین نفر باقی‌مانده باشد (قوانین میز).',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Zodiac scenario. Default: 12 players, 3 mafia. Has an <b>independent</b> team.',
        '<br /><b>Mafia:</b> Al Capone + Magician + Bomber + Simple Mafia',
        '<br /><b>Independent:</b> Zodiac',
        '<br /><b>City:</b> Detective + Doctor + Professional + Guard + Ocean + Gunslinger + Citizens',
        '<br />Day phase has extra steps (guns).',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br /><b>2. Magician:</b> Opens eyes → picks a city player to disable their ability → closes eyes.',
        '<br /><b>3. Bomber:</b> Opens eyes → if planting a bomb:',
        '<br />&nbsp;&nbsp;• Tells Host a secret code (1–4).',
        '<br />&nbsp;&nbsp;• Points at target → closes eyes.',
        '<br />&nbsp;&nbsp;• Morning: Host announces bomb was planted on that player.',
        '<br />&nbsp;&nbsp;• Target must guess 1–4 → correct = survives / wrong = eliminated.',
        '<br /><b>4. Zodiac:</b> Opens eyes → can shoot <b>only on even nights</b> → points at target → closes eyes.',
        '<br />&nbsp;&nbsp;• Cannot be killed by the night shot.',
        '<br />&nbsp;&nbsp;• If Zodiac shoots Guard → Zodiac is eliminated.',
        '<br /><b>5. Professional:</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• Shooting a citizen → Professional is eliminated.',
        '<br /><b>6. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>7. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>8. Gunslinger:</b> Opens eyes → gives one gun to a player → closes eyes.',
        '<br />&nbsp;&nbsp;• Has 3 guns: 2 blanks + 1 real. Doesn\'t know which are which.',
        '<br />&nbsp;&nbsp;• Recipient may shoot the next day.',
        '<br /><b>9. Ocean:</b> Opens eyes → up to 2 times per game can wake some citizens for silent consultation → closes eyes.',
        '<br />&nbsp;&nbsp;• Waking a mafia member or Zodiac accidentally → Ocean is eliminated.',
      ].join('')),
      _gs('Bomb & Guard Mechanics', [
        '<b>Bomb:</b> Target guesses code (1–4). Correct = survives. Wrong = eliminated.',
        '<br /><b>Guard (sacrifice):</b> When bomb is announced, Guard may step in front of the target.',
        '<br />• Guard then guesses the disarm code.',
        '<br />• Correct → both Guard and original target survive.',
        '<br />• Wrong → Guard is eliminated; original target survives.',
      ].join('')),
      _gs('Day Phase Steps', [
        '<b>1. Gun check:</b> Gun holders decide whether to shoot.',
        '<br /><b>2. Gun expiry:</b> Real bullet eliminates target; blank does nothing.',
        '<br /><b>3. Vote:</b> Same as Classic.',
        '<br /><b>4. Defense & Elimination:</b> Same as Classic.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia and Zodiac eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers all non-mafia survivors.',
        '<br /><b>Zodiac:</b> Be the last team or last player standing (table rules).',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  meeting_epic: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو میتینگ/اپیک. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + ناتو + ناتاشا + دکتر لکتر + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + تک‌تیرانداز + زره‌پوش + قاضی + فرمانده + کشیش + شهروند',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. ناتاشا:</b> بیدار → یک نفر را برای سایلنت فردا انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• هدف فردا نمی‌تواند صحبت کند (سایلنت).',
        '<br />&nbsp;&nbsp;• معمولاً نمی‌تواند دو شب پشت‌سرهم یک نفر را سایلنت کند.',
        '<br /><b>۲. تیم مافیا (رئیس/ناتو):</b> بیدار → هدف شلیک → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• <b>ناتو:</b> یک‌بار در کل بازی می‌تواند به‌جای شلیک، نقش دقیق یک بازیکن را حدس بزند.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ درست → آن بازیکن از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ غلط → هیچ‌اتفاقی نمی‌افتد.',
        '<br /><b>۳. دکتر لکتر:</b> بیدار → یک نفر (معمولاً از تیم مافیا) را نجات می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط یک‌بار می‌تواند خودش را نجات دهد.',
        '<br /><b>۴. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۵. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۶. تک‌تیرانداز (اگر فعال):</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فرمانده بعد از انتخاب هدف بیدار می‌شود و تأیید یا رد می‌کند.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>ناتاشا (سایلنت):</b> هدف روز بعد نمی‌تواند صحبت کند. کشیش می‌تواند این سایلنت را خنثی کند.',
        '<br /><b>دکتر لکتر:</b> اگر شلیک مافیا به یک مافیایی دیگر اصابت کند (اشتباه)، لکتر می‌تواند او را نجات دهد.',
        '<br /><b>قاضی:</b> یک‌بار در کل بازی می‌تواند نتیجه رأی‌گیری روز را ملغی کند (معمولاً شب اعمال می‌شود).',
        '<br /><b>فرمانده:</b> بعد از شلیک تک‌تیرانداز بیدار می‌شود و می‌تواند تأیید یا رد کند.',
        '<br />&nbsp;&nbsp;• اگر رد کند → شلیک اثر ندارد.',
        '<br /><b>کشیش:</b> شب چند نفر را انتخاب می‌کند تا روز بعد وقت صحبت اضافه داشته باشند.',
        '<br />&nbsp;&nbsp;• می‌تواند سایلنت ناتاشا را خنثی کند.',
        '<br /><b>زره‌پوش:</b> با شلیک شب کشته نمی‌شود. اگر با رأی خارج شود، نقش اعلام و به بازی برمی‌گردد.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Meeting/Epic scenario. Default: 12 players, 4 mafia.',
        '<br /><b>Mafia:</b> Mafia Boss + NATO + Natasha + Dr. Lecter + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Sniper + Armored + Judge + Commander + Priest + Citizens',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Natasha:</b> Opens eyes → picks a player to silence tomorrow → closes eyes.',
        '<br />&nbsp;&nbsp;• Target cannot speak during next day. Cannot silence the same player on consecutive nights.',
        '<br /><b>2. Mafia team (Boss/NATO):</b> Open eyes → pick shot → close eyes.',
        '<br />&nbsp;&nbsp;• <b>NATO:</b> Once per game may guess a player\'s exact role instead of shooting.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ Correct → that player is eliminated. Wrong → nothing happens.',
        '<br /><b>3. Dr. Lecter:</b> Opens eyes → saves one player (usually a mafia member) → closes eyes.',
        '<br />&nbsp;&nbsp;• Can save themselves only once per game.',
        '<br /><b>4. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>5. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>6. Sniper (if active):</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• Commander then wakes to confirm or cancel the shot.',
      ].join('')),
      _gs('Special Rules', [
        '<b>Natasha (Silence):</b> Target cannot speak the next day. Priest can neutralize this silence.',
        '<br /><b>Dr. Lecter:</b> Saves mafia members (or anyone) from the night shot; one self-save per game.',
        '<br /><b>Judge:</b> Once per game may void a day vote result (usually declared at night).',
        '<br /><b>Commander:</b> Wakes after Sniper shoots and can confirm or cancel the shot.',
        '<br /><b>Priest:</b> Selects players to receive extra speaking time next day. Can neutralize Natasha\'s silence.',
        '<br /><b>Armored:</b> Immune to night shots. If voted out, role is revealed and they return to game.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  pishrafte: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو پیشرفته. مناسب برای ۱۵ نفر (پیش‌فرض: ۱۵ نفر، ۵ مافیا). بیشترین نقش‌ها.',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + پدرخوانده + دکتر لکتر + جوکر مافیا + ناتو + ناتاشا + شیاد + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + تک‌تیرانداز + حرفه‌ای + زره‌پوش + محقق + بازپرس + رویین‌تن + قاضی + فرمانده + کشیش + شهروند',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. محقق:</b> بیدار → لینک → چشم می‌بندد (شب معارفه لینک نمی‌زند).',
        '<br /><b>۲. شیاد:</b> بیدار → هدف شیادی → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر به کارآگاه بزند → استعلام کارآگاه آن شب «منفی» می‌شود.',
        '<br /><b>۳. ناتاشا:</b> بیدار → هدف سایلنت → چشم می‌بندد.',
        '<br /><b>۴. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• رئیس مافیا + پدرخوانده: هر دو استعلام «منفی» (شهروند) می‌دهند.',
        '<br />&nbsp;&nbsp;• ناتو: یک‌بار می‌تواند نقش دقیق یک نفر را حدس بزند.',
        '<br /><b>۵. دکتر لکتر:</b> بیدار → نجات مافیایی → چشم می‌بندد.',
        '<br /><b>۶. جوکر مافیا:</b> بیدار → می‌تواند یک نفر را برای برعکس‌کردن استعلام انتخاب کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط ۲ بار در کل بازی مجاز است.',
        '<br />&nbsp;&nbsp;• انتخاب تکراری پشت‌سرهم (دو شب متوالی یک نفر) ممنوع است.',
        '<br /><b>۷. حرفه‌ای:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br /><b>۸. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۹. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۱۰. تک‌تیرانداز:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
      ].join('')),
      _gs('ترتیب پردازش استعلام کارآگاه', [
        'استعلام کارآگاه به ترتیب زیر پردازش می‌شود:',
        '<br />۱. <b>شیاد:</b> اگر کارآگاه را هدف زده باشد → استعلام به‌اجبار «منفی» می‌شود (صرف‌نظر از هویت واقعی).',
        '<br />۲. <b>جوکر مافیا:</b> اگر هدف کارآگاه را انتخاب کرده باشد → نتیجه استعلام برعکس می‌شود.',
        '<br />۳. <b>نقش واقعی:</b> رئیس مافیا و پدرخوانده همیشه «منفی» نمایش می‌دهند.',
        '<br />• اگر شیاد زد و جوکر هم فعال بود → شیاد اولویت دارد (نتیجه «منفی» می‌ماند).',
      ].join('')),
      _gs('نقش‌های شهری ویژه', [
        '<b>رویین‌تن:</b> شلیک شبانه مافیا کشنده نیست. فقط با رأی یا شرایط خاص از بازی خارج می‌شود.',
        '<br /><b>زره‌پوش:</b> مثل میتینگ — شلیک شب کشنده نیست؛ با رأی برمی‌گردد.',
        '<br /><b>بازپرس:</b> یک‌بار می‌تواند بازپرسی انجام دهد (دو نفر دفاعیه → رأی‌گیری بین آن‌ها).',
        '<br /><b>محقق:</b> لینک به یک نفر؛ اگر محقق خارج شود، لینک‌شده هم خارج می‌شود.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Advanced scenario. Default: 15 players, 5 mafia. Maximum role count.',
        '<br /><b>Mafia:</b> Boss + Godfather + Dr. Lecter + Mafia Joker + NATO + Natasha + Charlatan + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Sniper + Professional + Armored + Researcher + Inspector + Invulnerable + Judge + Commander + Priest + Citizens',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Researcher:</b> Opens eyes → links → closes eyes (no link on intro night).',
        '<br /><b>2. Charlatan:</b> Opens eyes → picks target → closes eyes.',
        '<br />&nbsp;&nbsp;• If targeting Detective → Detective\'s inquiry is forced "citizen" that night.',
        '<br /><b>3. Natasha:</b> Opens eyes → picks silence target → closes eyes.',
        '<br /><b>4. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br />&nbsp;&nbsp;• Boss + Godfather both show "citizen" to Detective.',
        '<br />&nbsp;&nbsp;• NATO: once may guess exact role instead of shooting.',
        '<br /><b>5. Dr. Lecter:</b> Opens eyes → saves a mafia member → closes eyes.',
        '<br /><b>6. Mafia Joker:</b> Opens eyes → may select a player to flip their Detective result → closes eyes.',
        '<br />&nbsp;&nbsp;• Max 2 times per game. Cannot select the same person on consecutive nights.',
        '<br /><b>7. Professional:</b> Opens eyes → shoots if desired → closes eyes.',
        '<br /><b>8. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>9. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>10. Sniper:</b> Opens eyes → shoots if desired → closes eyes.',
      ].join('')),
      _gs('Detective Inquiry Resolution Order', [
        'Detective inquiry is resolved in this priority order:',
        '<br />1. <b>Charlatan:</b> If Charlatan targeted the Detective → result forced "citizen" regardless.',
        '<br />2. <b>Mafia Joker:</b> If Joker targeted the inquiry subject → result is flipped.',
        '<br />3. <b>True role:</b> Boss and Godfather always show "citizen" (negative).',
        '<br />• If Charlatan hit AND Joker was active → Charlatan takes priority (result stays "citizen").',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  shab_mafia: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو شب مافیا. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا). دارای ویژگی «حرف آخر» و «کارت حذف».',
        '<br /><b>تیم مافیا:</b> پدرخوانده + دکتر لکتر + جوکر مافیا + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + حرفه‌ای + جان‌سخت + روانپزشک + شهردار + فروشنده + شهروند',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا (پدرخوانده):</b> بیدار → هدف شلیک → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• پدرخوانده استعلام «منفی» (شهروند) دارد.',
        '<br /><b>۲. دکتر لکتر:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br /><b>۳. جوکر مافیا:</b> بیدار → اگر می‌خواهد استعلام کارآگاه را برعکس کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط ۲ بار در کل بازی. انتخاب تکراری پشت‌سرهم ممنوع.',
        '<br /><b>۴. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۵. حرفه‌ای:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br /><b>۶. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
      ].join('')),
      _gs('نقش‌های شهری ویژه', [
        '<b>جان‌سخت:</b>',
        '<br />• شلیک اول مافیا کشنده نیست (خودش معمولاً متوجه نمی‌شود).',
        '<br />• ۲ بار در کل بازی می‌تواند وضعیت (ساید) یک بازیکن اخراجی را از گرداننده بپرسد.',
        '<br /><br /><b>روانپزشک:</b>',
        '<br />• ۲ بار در کل بازی می‌تواند توانایی صحبت/مکالمه یک بازیکن را برای آن جلسه از او بگیرد.',
        '<br /><br /><b>شهردار:</b>',
        '<br />• یک‌بار (فقط وقتی حداقل ۲ نفر در دفاعیه باشند و خودش در دفاعیه نباشد) می‌تواند:',
        '<br />&nbsp;&nbsp;• رأی‌گیری را لغو کند، یا',
        '<br />&nbsp;&nbsp;• مستقیماً حکم خروج یکی از افراد دفاعیه را بدهد.',
        '<br /><br /><b>فروشنده:</b>',
        '<br />• یک‌بار می‌تواند توانایی یک نفر را برای <b>کل بازی</b> از او بگیرد.',
        '<br />• فردای همان روز، انتخاب فروشنده توسط گرداننده اعلام می‌شود.',
      ].join('')),
      _gs('کارت‌های حذف', [
        'وقتی هر بازیکنی از بازی خارج می‌شود، یک کارت کشیده می‌شود:',
        '<br /><b>بی‌خوابی:</b> بازیکن باید تمام شب بیدار بماند (بدون خوابیدن در صحنه).',
        '<br /><b>شلیک نهایی:</b> بازیکن می‌تواند یک شلیک نهایی انجام دهد.',
        '<br /><b>ذهن زیبا:</b> بازیکن یک پیش‌بینی از بازی می‌گوید.',
        '<br /><b>دروغ سیزده:</b> بازیکن باید یک دروغ مشخص درباره بازی بگوید.',
        '<br /><b>مسیر سبز:</b> بازیکن می‌تواند یک نفر را از کارت نجات دهد.',
        '<br /><b>فرش قرمز:</b> بازیکن با احترام کامل بازی را ترک می‌کند (اعلام خاص گرداننده).',
        '<br /><i>جزئیات دقیق بسته به قوانین میز متفاوت است.</i>',
      ].join('')),
      _gs('ویژگی حرف آخر', [
        'این سناریو ویژگی «حرف آخر» دارد:',
        '<br />وقتی بازیکنی از بازی خارج می‌شود، قبل از کشیدن کارت، فرصت دارد حرف آخر بزند.',
        '<br />حرف آخر معمولاً محدود (۳۰–۶۰ ثانیه) است.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Mafia Nights scenario. Default: 12 players, 4 mafia. Features "Last Words" and Elimination Cards.',
        '<br /><b>Mafia:</b> Godfather + Dr. Lecter + Mafia Joker + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Professional + Hard John + Psychiatrist + Mayor + Seller + Citizens',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team (Godfather):</b> Open eyes → pick shot → close eyes.',
        '<br />&nbsp;&nbsp;• Godfather shows "citizen" (negative) to Detective.',
        '<br /><b>2. Dr. Lecter:</b> Opens eyes → saves someone → closes eyes.',
        '<br /><b>3. Mafia Joker:</b> Opens eyes → may pick a player to flip Detective\'s inquiry result → closes eyes.',
        '<br />&nbsp;&nbsp;• Max 2 times per game; no consecutive repeat target.',
        '<br /><b>4. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>5. Professional:</b> Opens eyes → shoots if desired → closes eyes.',
        '<br /><b>6. Doctor:</b> Opens eyes → saves → closes eyes.',
      ].join('')),
      _gs('Special City Roles', [
        '<b>Hard John:</b>',
        '<br />• Survives the first mafia night shot (usually doesn\'t know they were shot).',
        '<br />• Twice per game may ask the Host for the side (team) of any eliminated player.',
        '<br /><br /><b>Psychiatrist:</b>',
        '<br />• Twice per game can remove a player\'s ability to speak for that session.',
        '<br /><br /><b>Mayor:</b>',
        '<br />• Once (when 2+ players are in defense and Mayor is not one of them) may:',
        '<br />&nbsp;&nbsp;• Cancel the vote entirely, or',
        '<br />&nbsp;&nbsp;• Directly order one defendant eliminated.',
        '<br /><br /><b>Seller:</b>',
        '<br />• Once can remove a player\'s ability for the <b>rest of the game</b>.',
        '<br />• Next morning the Host announces which player was targeted.',
      ].join('')),
      _gs('Elimination Cards', [
        'When any player is eliminated, one card is drawn:',
        '<br /><b>Insomnia:</b> Player must stay "awake" (no in-scene sleeping).',
        '<br /><b>Final Shot:</b> Player may take one final shot.',
        '<br /><b>Beautiful Mind:</b> Player makes a game prediction.',
        '<br /><b>Thirteen Lies:</b> Player must state one specific lie about the game.',
        '<br /><b>Green Mile:</b> Player may save one person from their card.',
        '<br /><b>Red Carpet:</b> Player exits with special host fanfare.',
        '<br /><i>Exact effects depend on table rules.</i>',
      ].join('')),
      _gs('Last Words Feature', [
        'This scenario features "Last Words":',
        '<br />When eliminated, a player may speak briefly (30–60 seconds) before the elimination card is drawn.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

};

// ── Public API ────────────────────────────────────────────────────────────────
function showScenarioGuide(scenarioId) {
  const cfg = getScenarioConfig(scenarioId);
  const lang = typeof appLang !== 'undefined' ? appLang : 'fa';
  const guide = SCENARIO_GUIDES[scenarioId];
  const title = lang === 'fa'
    ? ('راهنمای سناریو: ' + cfg.name.fa)
    : ('Scenario Guide: ' + cfg.name.en);
  const body = guide
    ? (guide[lang] || guide.fa)
    : '<div class="toolBox">' + (lang === 'fa' ? 'راهنمایی برای این سناریو موجود نیست.' : 'No guide available for this scenario.') + '</div>';
  openToolModal(title, body);
}
