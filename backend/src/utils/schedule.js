// Rolling demo schedule.
//
// Every fixture repeats a cycle:   [ upcoming | live | finished ]
//   cycle     = DEMO_CYCLE_MINUTES      (default 45)
//   upcoming  = DEMO_UPCOMING_MINUTES   (default 15)
//   live      = liveMinutes (per fixture, ~12-16)
//   finished  = the rest of the cycle
// Fixtures are staggered by `slot`, so at any moment a visitor sees a mix of all three.
// The window is a pure function of the clock: no state, safe across restarts.

const MIN = 60_000;

export const CYCLE_MINUTES = Number(process.env.DEMO_CYCLE_MINUTES || 45);
export const UPCOMING_MINUTES = Number(process.env.DEMO_UPCOMING_MINUTES || 15);

export function computeWindow({ slot, slots, liveMinutes }, nowMs = Date.now()) {
  if (UPCOMING_MINUTES + liveMinutes >= CYCLE_MINUTES) {
    throw new Error('DEMO_CYCLE_MINUTES must be larger than upcoming + live minutes');
  }

  const cycle = CYCLE_MINUTES * MIN;
  const shift = (slot / slots) * cycle;
  const phase = (((nowMs - shift) % cycle) + cycle) % cycle;
  const cycleStart = nowMs - phase;

  const startTime = new Date(cycleStart + UPCOMING_MINUTES * MIN);
  const endTime = new Date(startTime.getTime() + liveMinutes * MIN);
  return { startTime, endTime };
}