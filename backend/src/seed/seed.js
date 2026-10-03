import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { db } from "../db/db.js";
import { commentary, matches } from "../db/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function buildTimes(match) {
  const now = Date.now();

  const startTime = new Date(
    now + match.startOffsetMinutes * 60 * 1000,
  );

  const endTime = new Date(
    startTime.getTime() + match.durationMinutes * 60 * 1000,
  );

  return { startTime, endTime };
}

function getCommentaryFile(match) {
  const sport = match.sport.toLowerCase();

  return path.join(
    DATA_DIR,
    sport,
    `${match.id}.json`,
  );
}

function getEventMinute(event) {
  if (event.minute !== undefined && event.minute !== null) {
    return Number(event.minute);
  }

  if (event.over !== undefined && event.over !== null) {
    return Number.parseFloat(event.over);
  }

  return 0;
}

function calculateScore(events, startTime) {
  const now = Date.now();

  let homeScore = 0;
  let awayScore = 0;

  for (const event of events) {
    const minute = getEventMinute(event);

    const eventTime = new Date(
      startTime.getTime() + minute * 60 * 1000,
    );

    if (eventTime > now) {
      continue;
    }

    const scoreDelta = event.scoreDelta;

    if (!scoreDelta) {
      continue;
    }

    homeScore += Number(scoreDelta.home || 0);
    awayScore += Number(scoreDelta.away || 0);
  }

  return {
    homeScore,
    awayScore,
  };
}

async function seedMatch(match) {
  const { startTime, endTime } = buildTimes(match);

  const commentaryFile = getCommentaryFile(match);

  let events = [];

  try {
    events = await readJson(commentaryFile);
  } catch {
    console.log(`⚠️ No commentary file for ${match.id}`);
  }

  if (!Array.isArray(events)) {
    events = [];
  }

  const score = calculateScore(events, startTime);

  console.log(
    `🏟️ ${match.homeTeam} vs ${match.awayTeam}`,
  );

  console.log(
    `   Start: ${startTime.toISOString()}`,
  );

  console.log(
    `   End:   ${endTime.toISOString()}`,
  );

  console.log(
    `   Score: ${score.homeScore}-${score.awayScore}`,
  );

  const [createdMatch] = await db
    .insert(matches)
    .values({
      sport: match.sport,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      status: match.status,
      startTime,
      endTime,
      homeScore: score.homeScore,
      awayScore: score.awayScore,
    })
    .returning();

  console.log(`   Match ID: ${createdMatch.id}`);

  if (events.length === 0) {
    console.log("   No commentary events.");
    return;
  }

  const commentaryRows = events.map((event, index) => {
    const minute = getEventMinute(event);

    const eventTime = new Date(
      startTime.getTime() + minute * 60 * 1000,
    );

    return {
      matchId: createdMatch.id,
      minute: Math.floor(minute),
      sequence: index + 1,
      period: event.period ?? "match",
      eventType: event.eventType ?? "update",
      actor: event.actor ?? null,
      team: event.team ?? null,
      message: event.message ?? "Match update",

      metadata: {
        ...(event.metadata ?? {}),
        ...(event.scoreDelta
          ? { scoreDelta: event.scoreDelta }
          : {}),
        ...(event.runs !== undefined
          ? { runs: event.runs }
          : {}),
        ...(event.wicket !== undefined
          ? { wicket: event.wicket }
          : {}),
        ...(event.over !== undefined
          ? { over: event.over }
          : {}),
      },

      tags: event.tags ?? null,

      createdAt: eventTime,
    };
  });

  await db
    .insert(commentary)
    .values(commentaryRows);

  console.log(
    `   📣 Inserted ${commentaryRows.length} commentary events`,
  );
}

async function seed() {
  console.log("🌱 Starting Sportz database seed...\n");

  const matchesData = await readJson(
    path.join(DATA_DIR, "matches.json"),
  );

  if (!Array.isArray(matchesData)) {
    throw new Error("matches.json must contain an array.");
  }

  for (const match of matchesData) {
    await seedMatch(match);
    console.log("");
  }

  console.log("✅ Database seed completed.");
}

seed().catch((error) => {
  console.error("❌ Seed failed:");
  console.error(error);
  process.exit(1);
});