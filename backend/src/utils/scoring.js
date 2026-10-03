// Sport-specific score state, rebuilt by folding commentary events.
//
// football: { home, away, minute, period, result }
// cricket : {
//   innings, target, battingSide: 'home'|'away',
//   home: {runs, wickets, balls, overs}, away: {...},
//   batters: [{name, runs, balls, fours, sixes, onStrike}],
//   bowler: {name, overs, maidens, runs, wickets},
//   lastBalls: ['1','•','4','W',...],
//   crr, rrr, runsNeeded, ballsLeft, result,
//   batting / bowling: internal per-player maps
// }

const sportKey = (sport) => String(sport ?? '').toLowerCase();
export const isCricket = (sport) => sportKey(sport) === 'cricket';

const fmtOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const round2 = (n) => Math.round(n * 100) / 100;
const maxBalls = (match) => (match.meta?.maxOvers ?? 20) * 6;
const blankBatter = () => ({ runs: 0, balls: 0, fours: 0, sixes: 0 });

export function getInitialScore(sport, base = {}) {
  if (isCricket(sport)) {
    const line = (b = {}) => ({ runs: 0, wickets: 0, balls: 0, overs: '0.0', ...b });
    return {
      innings: 1,
      target: null,
      battingSide: base.battingSide ?? 'home',
      home: line(base.home),
      away: line(base.away),
      batters: [],
      bowler: null,
      lastBalls: [],
      crr: 0,
      rrr: null,
      runsNeeded: null,
      ballsLeft: null,
      result: null,
      batting: {},
      bowling: {},
    };
  }

  return {
    home: base.home ?? 0,
    away: base.away ?? 0,
    minute: 0,
    period: null,
    result: null,
  };
}

export function scoreFromTotals(sport, home = 0, away = 0) {
  return isCricket(sport)
    ? getInitialScore(sport, { home: { runs: home }, away: { runs: away } })
    : getInitialScore(sport, { home, away });
}

const sideOf = (match, team) =>
  team === match.homeTeam ? 'home' : team === match.awayTeam ? 'away' : null;

function footballReducer(match, score, ev) {
  const d = ev.metadata?.scoreDelta ?? {};
  return {
    ...score,
    home: score.home + (Number(d.home) || 0),
    away: score.away + (Number(d.away) || 0),
    minute: ev.minute,
    period: ev.period,
    result: ev.eventType === 'full_time' ? ev.message : score.result,
  };
}

function cricketReducer(match, score, ev) {
  const m = ev.metadata ?? {};
  const limit = maxBalls(match);

  if (ev.eventType === 'innings_break') {
    const done = score[score.battingSide];
    const target = done.runs + 1;
    return {
      ...score,
      innings: 2,
      target,
      battingSide: score.battingSide === 'home' ? 'away' : 'home',
      batters: [],
      bowler: null,
      lastBalls: [],
      batting: {},
      bowling: {},
      crr: 0,
      runsNeeded: target,
      ballsLeft: limit,
      rrr: round2(target / (limit / 6)),
    };
  }

  if (ev.eventType === 'match_end') {
    return { ...score, result: m.result ?? ev.message };
  }

  if (!m.ball) return score; // only deliveries change the innings

  const side = sideOf(match, ev.team) ?? score.battingSide;
  const cur = score[side];
  const runs = Number(m.runs) || 0;
  const wicket = Boolean(m.wicket);
  const balls = cur.balls + 1;
  const total = cur.runs + runs;
  const wickets = cur.wickets + (wicket ? 1 : 0);
  const overDone = Number(m.ball) === 6;

  // batting card
  const batting = { ...(score.batting ?? {}) };
  const bt = batting[m.batter] ?? blankBatter();
  batting[m.batter] = {
    runs: bt.runs + runs,
    balls: bt.balls + 1,
    fours: bt.fours + (runs === 4 ? 1 : 0),
    sixes: bt.sixes + (runs === 6 ? 1 : 0),
  };
  if (m.nonStriker && !batting[m.nonStriker]) batting[m.nonStriker] = blankBatter();
  if (m.incoming && !batting[m.incoming]) batting[m.incoming] = blankBatter();

  // bowling card
  const bowling = { ...(score.bowling ?? {}) };
  const bw = bowling[m.bowler] ?? { balls: 0, runs: 0, wickets: 0, maidens: 0, overRuns: 0 };
  const overRuns = bw.overRuns + runs;
  const nextBw = {
    balls: bw.balls + 1,
    runs: bw.runs + runs,
    wickets: bw.wickets + (wicket ? 1 : 0),
    maidens: bw.maidens + (overDone && overRuns === 0 ? 1 : 0),
    overRuns: overDone ? 0 : overRuns,
  };
  bowling[m.bowler] = nextBw;

  // who is at the crease after this ball
  let striker = wicket ? (m.incoming ?? null) : m.batter;
  let other = m.nonStriker ?? null;
  const swap = () => {
    const t = striker;
    striker = other;
    other = t;
  };
  if (runs % 2 === 1) swap();
  if (overDone) swap();

  const batters = [striker, other]
    .filter(Boolean)
    .map((name) => ({ name, ...batting[name], onStrike: name === striker }));

  const lastBalls = [
    ...(score.lastBalls ?? []),
    wicket ? 'W' : runs === 0 ? '•' : String(runs),
  ].slice(-6);

  const chasing = score.innings === 2 && score.target != null;
  const runsNeeded = chasing ? Math.max(0, score.target - total) : null;
  const ballsLeft = chasing ? limit - balls : null;

  return {
    ...score,
    battingSide: side,
    [side]: { runs: total, wickets, balls, overs: fmtOvers(balls) },
    batting,
    bowling,
    batters,
    bowler: {
      name: m.bowler,
      overs: fmtOvers(nextBw.balls),
      maidens: nextBw.maidens,
      runs: nextBw.runs,
      wickets: nextBw.wickets,
    },
    lastBalls,
    crr: round2(total / (balls / 6)),
    runsNeeded,
    ballsLeft,
    rrr: chasing && ballsLeft > 0 ? round2(runsNeeded / (ballsLeft / 6)) : null,
  };
}

export function applyEvent(match, score, event) {
  if (isCricket(match.sport)) return cricketReducer(match, score, event);
  if (sportKey(match.sport) === 'football') return footballReducer(match, score, event);
  return score;
}

// Plain totals for homeScore / awayScore columns.
export function toTotals(sport, score) {
  return isCricket(sport)
    ? { homeScore: score.home.runs, awayScore: score.away.runs }
    : { homeScore: score.home, awayScore: score.away };
}

// Changes only on key moments: a goal, any runs, a wicket, an innings change.
export function scoreSignature(sport, score) {
  return isCricket(sport)
    ? `${score.innings}|${score.home.runs}/${score.home.wickets}|${score.away.runs}/${score.away.wickets}`
    : `${score.home}-${score.away}`;
}