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

const AUTH_ENDPOINT = import.meta.env.DEV
  ? '/api/auth'
  : 'http://localhost:10000/api/auth';

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_ENDPOINT}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Login failed');
  }

  return payload.data;
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${AUTH_ENDPOINT}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Registration failed');
  }

  return payload.data;
}

export async function getCurrentUser(accessToken) {
  const response = await fetch(`${AUTH_ENDPOINT}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to get current user');
  }

  return payload.data;
}

export async function refreshAccessToken() {
  const response = await fetch(`${AUTH_ENDPOINT}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to refresh access token');
  }

  return payload.data.accessToken;
}

export async function logoutUser() {
  const response = await fetch(`${AUTH_ENDPOINT}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Logout failed');
  }

  return payload;
}