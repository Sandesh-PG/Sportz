const MATCHES_ENDPOINT = import.meta.env.DEV
  ? '/api/matches'
  : 'http://localhost:10000/matches';

export async function getMatches() {
  const response = await fetch(MATCHES_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Unable to load matches (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getMatchCommentary(matchId) {
  const response = await fetch(
    `${MATCHES_ENDPOINT}/${matchId}/commentary`,
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load commentary (${response.status})`,
    );
  }

  const payload = await response.json();

  return Array.isArray(payload.data) ? payload.data : [];
}