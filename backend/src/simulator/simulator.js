import { and, asc, eq, gt, lte } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary, matches } from "../db/schema.js";

const INTERVAL_MS = Number(
  process.env.SIMULATION_INTERVAL_MS || 5000,
);

const simulationState = new Map();

async function getLiveMatches() {
  const now = new Date();

  return db
    .select()
    .from(matches)
    .where(
      and(
        lte(matches.startTime, now),
        gt(matches.endTime, now),
      ),
    );
}

async function initializeMatch(match) {
  const existingState = simulationState.get(match.id);

  if (existingState) {
    return existingState;
  }

  // Start the live simulation from the first event.
  // We intentionally do NOT use createdAt here.
  const firstEvent = await db
    .select({
      sequence: commentary.sequence,
    })
    .from(commentary)
    .where(eq(commentary.matchId, match.id))
    .orderBy(asc(commentary.sequence))
    .limit(1);

  const state = {
    nextSequence: firstEvent[0]?.sequence ?? null,
    homeScore: 0,
    awayScore: 0,
  };

  simulationState.set(match.id, state);

  // Reset live match score because we are replaying
  // its events from the beginning.
  await db
    .update(matches)
    .set({
      homeScore: 0,
      awayScore: 0,
    })
    .where(eq(matches.id, match.id));

  return state;
}

async function getNextCommentary(matchId, sequence) {
  if (sequence === null) {
    return null;
  }

  const rows = await db
    .select()
    .from(commentary)
    .where(
      and(
        eq(commentary.matchId, matchId),
        eq(commentary.sequence, sequence),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function processMatch(match, broadcastCommentary) {
  const state = await initializeMatch(match);

  const event = await getNextCommentary(
    match.id,
    state.nextSequence,
  );

  if (!event) {
    return;
  }

  const scoreDelta = event.metadata?.scoreDelta;

  if (scoreDelta) {
    state.homeScore += Number(scoreDelta.home || 0);
    state.awayScore += Number(scoreDelta.away || 0);
  }

  const [updatedMatch] = await db
    .update(matches)
    .set({
      homeScore: state.homeScore,
      awayScore: state.awayScore,
    })
    .where(eq(matches.id, match.id))
    .returning();

  state.nextSequence += 1;

  broadcastCommentary(match.id, {
    ...event,
    match: updatedMatch,
  });

  console.log(
    `📣 ${match.homeTeam} ${state.homeScore} - ${state.awayScore} ${match.awayTeam} | ${event.message}`,
  );
}

async function tick(broadcastCommentary) {
  try {
    const liveMatches = await getLiveMatches();

    for (const match of liveMatches) {
      await processMatch(
        match,
        broadcastCommentary,
      );
    }
  } catch (error) {
    console.error("❌ Simulator error:", error);
  }
}

export function startSimulator({
  broadcastCommentary,
}) {
  console.log("🎮 Simulator started");
  console.log(`⏱️ Interval: ${INTERVAL_MS}ms`);

  const interval = setInterval(() => {
    tick(broadcastCommentary);
  }, INTERVAL_MS);

  return () => {
    clearInterval(interval);
    console.log("🛑 Simulator stopped");
  };
}