import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from '../db/db.js';
import { commentary, matches } from '../db/schema.js';
import { revealDue } from '../services/liveEngine.js';
import { getMatchStatus } from '../utils/matches-status.js';
import { computeWindow } from '../utils/schedule.js';
import { getInitialScore, isCricket, toTotals } from '../utils/scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));

// Seconds into the match at which an event becomes visible.
//  football: proportional to the match minute (90' + stoppage ~ 95')
//  cricket : spread evenly across the live window
function offsetFor(fixture, event, index, total) {
  const live = fixture.liveMinutes * 60;
  const fraction = isCricket(fixture.sport)
    ? (index + 1) / (total + 1)
    : Math.min(0.97, Math.max(0.01, Number(event.minute ?? 0) / 95));
  return Math.max(1, Math.round(fraction * live));
}

function toRow(fixture, event, index, total) {
  return {
    minute: Math.floor(Number(event.minute ?? 0)),
    sequence: index + 1,
    offsetSeconds: offsetFor(fixture, event, index, total),
    period: event.period ?? 'match',
    eventType: event.eventType ?? 'update',
    actor: event.actor ?? null,
    team: event.team ?? null,
    message: event.message ?? 'Match update',
    metadata: event.metadata ?? {},
    tags: event.tags ?? null,
  };
}

async function seedFixture(fixture, slots) {
  const meta = {
    slug: fixture.id,
    slot: fixture.slot,
    slots,
    liveMinutes: fixture.liveMinutes,
    ...(fixture.maxOvers ? { maxOvers: fixture.maxOvers } : {}),
  };

  const { startTime, endTime } = computeWindow(meta);
  const status = getMatchStatus(startTime, endTime);

  let events = [];
  try {
    events = await readJson(path.join(DATA_DIR, fixture.sport, `${fixture.id}.json`));
  } catch {
    console.log(`⚠️ No commentary file for ${fixture.id} (run: node scripts/generate-data.js)`);
  }

  const score = getInitialScore(fixture.sport);

  const [created] = await db
    .insert(matches)
    .values({
      sport: fixture.sport,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      competition: fixture.competition,
      venue: fixture.venue,
      status,
      startTime,
      endTime,
      score,
      ...toTotals(fixture.sport, score),
      currentSequence: 0,
      meta,
    })
    .returning();

  if (events.length > 0) {
    const rows = events.map((e, i) => toRow(fixture, e, i, events.length));
    await db.insert(commentary).values(rows.map((r) => ({ ...r, matchId: created.id })));
  }

  // Bring the match to where the clock says it should be (finished -> everything revealed).
  const revealed = await revealDue(created);

  console.log(`🏟️  #${created.id} ${fixture.homeTeam} v ${fixture.awayTeam} [${status}] ${events.length} events, ${revealed} revealed`);
}

async function seed() {
  console.log('🌱 Seeding Sportz...\n');

  // node src/seed/seed.js --reset  -> wipe matches first (commentary cascades)
  if (process.argv.includes('--reset')) {
    await db.delete(matches);
    console.log('🧹 Cleared existing matches and commentary\n');
  }

  const fixtures = await readJson(path.join(DATA_DIR, 'matches.json'));
  if (!Array.isArray(fixtures)) throw new Error('matches.json must contain an array.');

  for (const fixture of fixtures) {
    await seedFixture(fixture, fixtures.length);
  }

  console.log('\n✅ Seed completed.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});