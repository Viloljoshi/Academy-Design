/* FX Academy — deterministic dummy-data engine (educational demo data).
   One seeded generator so Journal, Dashboard and Analytics all show the SAME
   numbers. ~5 months of trades, ~54% win rate, modest honest R multiples.
   Swap for a real API later: every page reads only window.FXData. */
(function (w) {

  // Deterministic PRNG (mulberry32) — same data on every load, every page.
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20260711);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  // Weighted tables: [value, weight, winRate, avgPlannedRR]
  const PAIRS = [
    ['EURUSD', .26, .58], ['GBPUSD', .14, .55], ['GBPJPY', .13, .50],
    ['XAUUSD', .17, .56], ['USDJPY', .12, .49], ['AUDUSD', .10, .53], ['EURGBP', .08, .48]
  ];
  const SETUPS = [
    ['Breakout retest', .26, .60, 2.0], ['Liquidity sweep', .22, .56, 2.2],
    ['Trend continuation', .20, .56, 1.8], ['Range fade', .12, .46, 1.4],
    ['Support bounce', .12, .52, 1.7], ['News fade', .08, .40, 1.6]
  ];
  const SESSIONS = [['Asia', .18, .47], ['London', .40, .61], ['New York', .30, .55], ['Overlap', .12, .52]];
  // Friday discipline leak — the story the analytics tell
  const DOW_ADJ = { 1: 0, 2: .05, 3: .04, 4: .01, 5: -.14 };

  const NOTES_WIN = [
    'Followed the plan start to finish. No urge to move the stop.',
    'Waited for the retest instead of chasing. Patience paid.',
    'Sized correctly, walked away after entry. Calm.',
    'Setup matched the playbook exactly. Textbook London move.',
    'Took partials at 1R as planned, let the rest run.',
    'Felt neutral before entry — good sign. Executed clean.'
  ];
  const NOTES_LOSS = [
    'Valid setup, market disagreed. Loss taken at plan — fine.',
    'Entered late after hesitating. Half-size saved me.',
    'Forced it after the first loss. Revenge-trade pattern again.',
    'Ignored the session filter. Rule broken, paid for it.',
    'Stop was too tight for the volatility. Note for the playbook.',
    'News spike took the stop. Should have flattened before release.'
  ];
  const NOTES_BE = [
    'Moved to breakeven at 1R, market reversed. No harm.',
    'Scratched it when momentum stalled. Protecting capital.',
    'Exit at entry after the setup invalidated. Discipline held.'
  ];

  function weighted(table) {
    let r = rand(), acc = 0;
    for (const row of table) { acc += row[1]; if (r <= acc) return row; }
    return table[0];
  }

  // ---- Generate ~5 months of trades (Feb 9 – Jul 10, 2026) ----
  const trades = [];
  const start = new Date(2026, 1, 9), end = new Date(2026, 6, 10);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;                    // weekdays only
    const n = rand() < .18 ? 0 : rand() < .55 ? 1 : rand() < .85 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const pair = weighted(PAIRS), setup = weighted(SETUPS), session = weighted(SESSIONS);
      const pWin = Math.max(.32, Math.min(.70,
        (pair[2] + setup[2] + session[2]) / 3 + .05 + (DOW_ADJ[dow] || 0)));
      const roll = rand();
      const outcome = roll < pWin ? 'win' : roll < pWin + .07 ? 'be' : 'loss';
      const plannedRR = +(setup[3] + (rand() - .5) * .6).toFixed(1);
      let r;
      if (outcome === 'win') r = +(plannedRR * (0.55 + rand() * 0.65)).toFixed(1);
      else if (outcome === 'be') r = +((rand() * .3) - .1).toFixed(1);
      else r = +(-(0.7 + rand() * 0.4)).toFixed(1);
      trades.push({
        date: new Date(d),
        pair: pair[0],
        dir: rand() < .54 ? 'long' : 'short',
        setup: setup[0],
        session: session[0],
        riskPct: +(0.75 + rand() * 0.5).toFixed(2),
        plannedRR,
        outcome,
        r,
        note: outcome === 'win' ? pick(NOTES_WIN) : outcome === 'be' ? pick(NOTES_BE) : pick(NOTES_LOSS),
        discipline: outcome === 'loss' && rand() < .3 ? Math.ceil(3 + rand() * 3) : Math.ceil(7 + rand() * 3),
        shot: true // screenshot placeholder available
      });
    }
  }

  // ---- Aggregates ----
  const round1 = (v) => Math.round(v * 10) / 10;
  function summarize(list) {
    const wins = list.filter(t => t.outcome === 'win'),
          losses = list.filter(t => t.outcome === 'loss'),
          bes = list.filter(t => t.outcome === 'be');
    const netR = round1(list.reduce((a, t) => a + t.r, 0));
    const decided = wins.length + losses.length;
    return {
      n: list.length, wins: wins.length, losses: losses.length, be: bes.length,
      netR,
      winRate: decided ? Math.round(wins.length / decided * 100) : 0,
      avgRR: list.length ? round1(list.reduce((a, t) => a + t.plannedRR, 0) / list.length) : 0,
      avgWinR: wins.length ? round1(wins.reduce((a, t) => a + t.r, 0) / wins.length) : 0,
      best: list.length ? Math.max(...list.map(t => t.r)) : 0,
      worst: list.length ? Math.min(...list.map(t => t.r)) : 0
    };
  }
  function groupBy(list, key) {
    const m = {};
    list.forEach(t => { (m[t[key]] = m[t[key]] || []).push(t); });
    return Object.entries(m).map(([k, v]) => ({ key: k, ...summarize(v) }));
  }
  const daysAgo = (n) => { const d = new Date(end); d.setDate(d.getDate() - n); return d; };
  const last30 = trades.filter(t => t.date >= daysAgo(30));
  const last90 = trades.filter(t => t.date >= daysAgo(90));
  const thisWeek = trades.filter(t => t.date >= daysAgo(4));

  // Equity curve (cumulative R over all trades) + a last-30-trades slice
  let cum = 0;
  const equity = trades.map(t => { cum = round1(cum + t.r); return cum; });

  // Current win/loss streak (by trade) + logged-days streak
  let streak = 0, sType = null;
  for (let i = trades.length - 1; i >= 0; i--) {
    const o = trades[i].outcome; if (o === 'be') continue;
    if (!sType) { sType = o; streak = 1; }
    else if (o === sType) streak++;
    else break;
  }
  const byDow = [1, 2, 3, 4, 5].map(dw => {
    const list = last90.filter(t => t.date.getDay() === dw);
    return { key: ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dw], ...summarize(list) };
  });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = (d) => MONTHS[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, ' ');

  w.FXData = {
    trades, equity,
    stats: {
      all: summarize(trades), last90: summarize(last90), last30: summarize(last30),
      week: summarize(thisWeek),
      streak: { type: sType, n: streak },
      loggedDays: 12 // display streak used across UI copy
    },
    byPair: groupBy(last90, 'pair'),
    bySetup: groupBy(last90, 'setup'),
    bySession: groupBy(last90, 'session'),
    byDow,
    months: [...new Set(trades.map(t => MONTHS[t.date.getMonth()] + ' ' + t.date.getFullYear()))],
    fmtDate, MONTHS
  };
})(window);
