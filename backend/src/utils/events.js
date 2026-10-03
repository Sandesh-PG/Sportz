// Wall-clock time of an event = match start + its offset into the match.
export function withOccurredAt(row, match) {
  const start = new Date(match.startTime).getTime();
  return {
    ...row,
    occurredAt: new Date(start + (row.offsetSeconds ?? 0) * 1000).toISOString(),
  };
}