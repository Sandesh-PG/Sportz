// Generates demo data: src/data/matches.json + src/data/<sport>/<fixture>.json
// Deterministic (seeded per fixture), so re-running gives identical files.
//
//   node scripts/generate-data.js
//
// Player names are fictional. Edit FIXTURES / POOLS to taste.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../src/data');

/* ------------------------------- fixtures -------------------------------- */

const FIXTURES = [
  { id: 'arsenal-liverpool', sport: 'football', competition: 'Premier League · Matchday 28', venue: 'Emirates Stadium, London', homeTeam: 'Arsenal', awayTeam: 'Liverpool', slot: 0, liveMinutes: 12, result: [2, 1] },
  { id: 'india-australia', sport: 'cricket', competition: 'ICC Champions Trophy · Group A', venue: 'Dubai International Stadium', homeTeam: 'India', awayTeam: 'Australia', slot: 1, liveMinutes: 16, maxOvers: 20, innings: [{ runs: 176, wickets: 5, balls: 120 }, { runs: 171, wickets: 7, balls: 120 }] },
  { id: 'real-barcelona', sport: 'football', competition: 'La Liga · El Clasico', venue: 'Santiago Bernabeu, Madrid', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', slot: 2, liveMinutes: 12, result: [2, 2] },
  { id: 'man-city-chelsea', sport: 'football', competition: 'Premier League · Matchday 28', venue: 'Etihad Stadium, Manchester', homeTeam: 'Manchester City', awayTeam: 'Chelsea', slot: 3, liveMinutes: 12, result: [2, 1] },
  { id: 'nepal-netherlands', sport: 'cricket', competition: 'ICC T20 World Cup · Group B', venue: 'Kirtipur Oval, Kathmandu', homeTeam: 'Nepal', awayTeam: 'Netherlands', slot: 4, liveMinutes: 16, maxOvers: 20, innings: [{ runs: 148, wickets: 8, balls: 120 }, { runs: 149, wickets: 5, balls: 112 }] },
  { id: 'chelsea-tottenham', sport: 'football', competition: 'Premier League · Matchday 27', venue: 'Stamford Bridge, London', homeTeam: 'Chelsea', awayTeam: 'Tottenham', slot: 5, liveMinutes: 12, result: [3, 1] },
  { id: 'england-south-africa', sport: 'cricket', competition: 'ICC T20 World Cup · Group C', venue: "Lord's, London", homeTeam: 'England', awayTeam: 'South Africa', slot: 6, liveMinutes: 16, maxOvers: 20, innings: [{ runs: 187, wickets: 6, balls: 120 }, { runs: 181, wickets: 8, balls: 120 }] },
  { id: 'milan-inter', sport: 'football', competition: 'Serie A · Derby della Madonnina', venue: 'San Siro, Milan', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', slot: 7, liveMinutes: 12, result: [1, 1] },
];

/* --------------------------------- names --------------------------------- */

const POOLS = {
  english: 'Hartley Whitcombe Bramley Thorne Ashworth Pemberton Corrigan Fenwick Maddox Garrity Langley Holloway Tindall Rushworth Calloway Prescott Wyndham Estcourt',
  spanish: 'Cordero Almagro Beltran Quintero Salvatierra Oropeza Castellanos Maldonado Ferrer Montoya Villalba Zamora Arroyo Bustamante Olmedo Sandoval Peralta Linares',
  italian: 'Bellandi Ferraro Costanzo Marchetti Lombardi Santoro Barbieri Moretti Greco Cattaneo Fontana Sartori Benedetti Rinaldi Vitale Orsini Palumbo Gentile',
  indian: 'Deshmukh Rathore Patil Bhandari Kulkarni Joshi Menon Chauhan Naidu Saxena Trivedi Bajaj Pillai Khanna Sethi Gokhale Mishra Rawat',
  aussie: 'Harrington Mackenzie Gallagher Donovan Burrows Kingsley Blackwood Thornton Sinclair Whitaker Pritchard Langford Ellison Cartwright Redmond Hasting',
  nepali: 'Thapa Gurung Rana Karki Basnet Shrestha Adhikari Pokhrel Bista Dhami Khadka Magar Tamang Poudel Oli Regmi',
  dutch: 'Bakker Visser Smit Meijer Mulder Kok Dekker Brouwer Hendriks Peeters Vos Jacobs Willems Kuipers Schouten Hoekstra',
  safrican: 'Botha Pretorius Nkosi Dlamini Mokoena Jansen Naidoo Mahlangu Venter Swanepoel Khumalo Marais Coetzee Ndlovu Radebe Fourie',
};

const TEAM_POOL = {
  Arsenal: 'english', Liverpool: 'english', Chelsea: 'english', Tottenham: 'english',
  'Manchester City': 'english', England: 'english',
  'Real Madrid': 'spanish', Barcelona: 'spanish',
  'AC Milan': 'italian', 'Inter Milan': 'italian',
  India: 'indian', Australia: 'aussie', Nepal: 'nepali', Netherlands: 'dutch', 'South Africa': 'safrican',
};

const INITIALS = 'ABCDEFGHJKLMNPRSTVW'.split('');

/* ---------------------------------- rng ---------------------------------- */

function makeRng(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function makeSquad(rng, team, n) {
  const surnames = shuffle(rng, POOLS[TEAM_POOL[team]].split(' '));
  return Array.from({ length: n }, (_, i) => `${pick(rng, INITIALS)}. ${surnames[i % surnames.length]}`);
}

/* -------------------------------- football ------------------------------- */

function genFootball(f) {
  const rng = makeRng(f.id);
  const { homeTeam: home, awayTeam: away } = f;
  const squads = { [home]: makeSquad(rng, home, 14), [away]: makeSquad(rng, away, 14) };
  const other = (team) => (team === home ? away : home);
  const outfield = (team, lo, hi) => squads[team][int(rng, lo, hi)];

  const items = []; // { minute, prio, type, team, ... }

  items.push({ minute: 1, prio: -1, type: 'kickoff' });
  items.push({ minute: 45, prio: 99, type: 'half_time' });
  items.push({ minute: 90, prio: 99, type: 'full_time' });

  // goals: distinct minutes, never 45
  const goalTeams = shuffle(rng, [...Array(f.result[0]).fill(home), ...Array(f.result[1]).fill(away)]);
  const minutes = new Set();
  while (minutes.size < goalTeams.length) {
    const m = int(rng, 3, 88);
    if (m !== 45) minutes.add(m);
  }
  [...minutes].sort((a, b) => a - b).forEach((minute, i) => {
    const team = goalTeams[i];
    const scorer = pick(rng, [5, 6, 7, 8, 9, 9, 10, 10]);
    let assist = int(rng, 4, 10);
    if (assist === scorer) assist = scorer === 10 ? 9 : scorer + 1;
    items.push({ minute, prio: 0, type: 'goal', team, scorer: squads[team][scorer], assist: squads[team][assist] });
  });

  for (let i = 0; i < 6; i++) {
    const team = pick(rng, [home, away]);
    items.push({ minute: int(rng, 2, 89), prio: 0, type: 'shot', team, player: outfield(team, 5, 10) });
  }
  for (let i = 0; i < 4; i++) {
    const shooterTeam = pick(rng, [home, away]);
    const team = other(shooterTeam); // the keeper's team
    items.push({ minute: int(rng, 2, 89), prio: 0, type: 'save', team, keeper: squads[team][0], shooter: outfield(shooterTeam, 5, 10) });
  }
  for (let i = 0; i < 3; i++) {
    const team = pick(rng, [home, away]);
    items.push({ minute: int(rng, 10, 88), prio: 0, type: 'yellow_card', team, player: outfield(team, 1, 8) });
  }
  for (let i = 0; i < 4; i++) {
    const team = i < 2 ? home : away;
    items.push({ minute: int(rng, 55, 82), prio: 0, type: 'substitution', team, out: outfield(team, 5, 10), inn: squads[team][11 + (i % 2)] });
  }

  items.forEach((it, idx) => { it.idx = idx; });
  items.sort((a, b) => a.minute - b.minute || a.prio - b.prio || a.idx - b.idx);

  let h = 0;
  let a = 0;
  return items.map((it) => {
    const period = it.minute <= 45 ? '1st half' : '2nd half';
    const base = { minute: it.minute, period, eventType: it.type, actor: null, team: it.team ?? null, metadata: {} };

    switch (it.type) {
      case 'kickoff':
        return { ...base, message: `Kick-off! ${home} v ${away} is under way.` };
      case 'half_time':
        return { ...base, period: '1st half', message: `Half time. ${home} ${h}-${a} ${away}.` };
      case 'full_time':
        return { ...base, period: '2nd half', message: `Full time. ${home} ${h}-${a} ${away}.`, tags: ['highlight'] };
      case 'goal': {
        const delta = it.team === home ? { home: 1, away: 0 } : { home: 0, away: 1 };
        if (it.team === home) h++; else a++;
        return {
          ...base,
          actor: it.scorer,
          message: `GOAL! ${it.scorer} (${it.team}) ${pick(rng, ['finishes from close range', 'curls it into the corner', 'smashes it past the keeper', 'heads home from the corner', 'tucks away the rebound'])}. ${home} ${h}-${a} ${away}.`,
          metadata: { scoreDelta: delta, assist: it.assist },
          tags: ['highlight'],
        };
      }
      case 'shot':
        return { ...base, actor: it.player, message: `${it.player} (${it.team}) ${pick(rng, ['fires just wide of the post', 'sees the effort blocked', 'drags a low shot across goal', 'blazes it over the bar'])}.` };
      case 'save':
        return { ...base, actor: it.keeper, message: `${it.keeper} (${it.team}) ${pick(rng, ['palms away a powerful strike', 'makes a strong save', 'tips the shot round the post', 'gets down well to smother it'])}.`, metadata: { shooter: it.shooter } };
      case 'yellow_card':
        return { ...base, actor: it.player, message: `Yellow card for ${it.player} (${it.team}) for ${pick(rng, ['a late challenge', 'a mistimed tackle', 'persistent fouling', 'dissent'])}.` };
      case 'substitution':
        return { ...base, actor: it.inn, message: `Substitution (${it.team}): ${it.inn} replaces ${it.out}.`, metadata: { playerIn: it.inn, playerOut: it.out } };
      default:
        return { ...base, message: 'Match update' };
    }
  });
}

/* --------------------------------- cricket -------------------------------- */

const MSG = {
  dot: ['Dot ball.', 'Good length, defended.', 'Beaten outside off!', 'Pushed back to the bowler.', 'Solid forward defence.'],
  run: ['Quick single.', 'Worked to the leg side for one.', 'Pushed into the gap for a single.'],
  two: ['Two runs taken.', 'Placed in the gap, they come back for the second.'],
  three: ['Three runs! Great running between the wickets.'],
  four: ['FOUR! Driven through the covers.', 'FOUR! Cracked past point.', 'FOUR! Flicked off the pads to the fence.'],
  six: ['SIX! Pulled over mid-wicket.', 'SIX! Smashed straight down the ground.', 'SIX! Launched over long-on.'],
};
const TYPE = { 0: 'dot', 1: 'run', 2: 'two', 3: 'three', 4: 'four', 6: 'six' };
const WEIGHTS = [[0, 34], [1, 30], [2, 8], [3, 1], [4, 14], [6, 7]];

function weightedRuns(rng) {
  const total = WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let x = rng() * total;
  for (const [runs, w] of WEIGHTS) {
    if ((x -= w) < 0) return runs;
  }
  return 0;
}

function genInnings({ rng, no, batTeam, bowlTeam, batSquad, bowlSquad, spec, bowlers }) {
  const { runs: total, wickets: W, balls: B } = spec;
  const chaseEndsEarly = no === 2 && B < 120;

  const wicketIdx = new Set(shuffle(rng, Array.from({ length: B - 6 }, (_, i) => i + 3)).slice(0, W));
  const runs = Array.from({ length: B }, (_, i) => (wicketIdx.has(i) ? 0 : weightedRuns(rng)));
  if (chaseEndsEarly) runs[B - 1] = Math.max(1, runs[B - 1]);

  let sum = runs.reduce((s, r) => s + r, 0);
  for (let guard = 0; sum !== total && guard < 20000; guard++) {
    const up = sum < total;
    const candidates = [];
    for (let i = 0; i < B; i++) {
      if (wicketIdx.has(i)) continue;
      const r = runs[i];
      if (!up && chaseEndsEarly && i === B - 1 && r <= 1) continue;
      if (up ? r < 6 && r + 1 !== 5 : r > 0 && r - 1 !== 5) candidates.push(i);
    }
    const idx = pick(rng, candidates);
    runs[idx] += up ? 1 : -1;
    sum += up ? 1 : -1;
  }
  if (sum !== total) throw new Error(`could not reach ${total} for ${batTeam}`);

  const events = [];
  let striker = batSquad[0];
  let nonStriker = batSquad[1];
  let nextIdx = 2;
  const swap = () => { const t = striker; striker = nonStriker; nonStriker = t; };

  for (let i = 0; i < B; i++) {
    const over = Math.floor(i / 6);
    const ball = (i % 6) + 1;
    const label = `${over}.${ball}`;
    const bowler = bowlers[over % bowlers.length];
    const r = runs[i];
    const wk = wicketIdx.has(i);
    const incoming = wk ? batSquad[nextIdx] : undefined;

    let eventType;
    let message;
    if (wk) {
      eventType = 'wicket';
      const fielder = pick(rng, bowlSquad);
      message = `WICKET! ${striker} ${pick(rng, [`b ${bowler}`, `c ${fielder} b ${bowler}`, `lbw b ${bowler}`, `c ${fielder} b ${bowler}`])}.`;
    } else {
      eventType = TYPE[r];
      message = pick(rng, MSG[eventType]);
    }
    if (no === 2 && i === B - 1 && chaseEndsEarly) message += " That's the match!";

    events.push({
      minute: over,
      period: `${no === 1 ? '1st' : '2nd'} innings`,
      eventType,
      actor: striker,
      team: batTeam,
      message,
      metadata: { innings: no, over: label, ball, runs: r, wicket: wk, batter: striker, nonStriker, bowler, ...(incoming ? { incoming } : {}) },
      ...(wk || r >= 4 ? { tags: ['highlight'] } : {}),
    });

    if (wk) { striker = incoming; nextIdx++; }
    if (r % 2 === 1) swap();
    if (ball === 6) swap();
  }
  return events;
}

function genCricket(f) {
  const rng = makeRng(f.id);
  const { homeTeam: home, awayTeam: away } = f;
  const squads = { [home]: makeSquad(rng, home, 11), [away]: makeSquad(rng, away, 11) };
  const bowlersOf = (t) => squads[t].slice(-5);

  const [i1, i2] = f.innings;
  const events = [];

  events.push(...genInnings({ rng, no: 1, batTeam: home, bowlTeam: away, batSquad: squads[home], bowlSquad: squads[away], spec: i1, bowlers: bowlersOf(away) }));
  events.push({
    minute: Math.floor(i1.balls / 6), period: 'innings break', eventType: 'innings_break', actor: null, team: home,
    message: `Innings break. ${home} finish on ${i1.runs}/${i1.wickets}. ${away} need ${i1.runs + 1} to win.`,
    metadata: { innings: 1, total: i1.runs, wickets: i1.wickets, target: i1.runs + 1 }, tags: ['highlight'],
  });
  events.push(...genInnings({ rng, no: 2, batTeam: away, bowlTeam: home, batSquad: squads[away], bowlSquad: squads[home], spec: i2, bowlers: bowlersOf(home) }));

  let result;
  if (i2.runs > i1.runs) {
    result = `${away} won by ${10 - i2.wickets} wickets (${120 - i2.balls} balls left).`;
  } else if (i2.runs < i1.runs) {
    result = `${home} won by ${i1.runs - i2.runs} runs.`;
  } else {
    result = 'Match tied.';
  }
  events.push({
    minute: Math.floor(i2.balls / 6), period: 'result', eventType: 'match_end', actor: null, team: i2.runs > i1.runs ? away : home,
    message: result, metadata: { result }, tags: ['highlight'],
  });
  return events;
}

/* ---------------------------------- main --------------------------------- */

for (const sport of ['football', 'cricket']) {
  fs.mkdirSync(path.join(DATA_DIR, sport), { recursive: true });
}

const catalog = [];
for (const f of FIXTURES) {
  const events = f.sport === 'football' ? genFootball(f) : genCricket(f);
  fs.writeFileSync(path.join(DATA_DIR, f.sport, `${f.id}.json`), JSON.stringify(events, null, 2));

  const { result, innings, ...entry } = f;
  catalog.push(entry);
  console.log(`✔ ${f.id.padEnd(22)} ${events.length} events`);
}
fs.writeFileSync(path.join(DATA_DIR, 'matches.json'), JSON.stringify(catalog, null, 2));
console.log(`✔ matches.json (${catalog.length} fixtures) -> ${DATA_DIR}`);