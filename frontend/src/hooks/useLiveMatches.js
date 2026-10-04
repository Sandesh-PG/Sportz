import { useCallback, useEffect, useState } from 'react';
import { getMatches } from '../services/api.js';
import useMatchesWebSocket from './useMatchesWebSocket.js';

const supportedSports = new Set(['football', 'cricket']);

// Loads the match list once, then keeps it live from the WebSocket.
// Used by both Home and Matches so they always agree.
export default function useLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setLoading(true);
    setError(null);

    getMatches()
      .then((data) => {
        if (!isCurrent) return;
        setMatches(data.filter((match) => supportedSports.has(match.sport?.toLowerCase())));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryKey]);

  useMatchesWebSocket((message) => {
    const updated = message?.data;
    if (!updated) return;

    if (message.type === 'score_update') {
      setMatches((current) =>
        current.map((match) =>
          match.id === updated.matchId
            ? {
                ...match,
                homeScore: updated.homeScore,
                awayScore: updated.awayScore,
                score: updated.score,
                status: updated.status,
              }
            : match,
        ),
      );
      return;
    }

    if (message.type === 'match_updated') {
      setMatches((current) =>
        current.map((match) => (match.id === updated.id ? updated : match)),
      );
      return;
    }

    if (message.type === 'match_created' && supportedSports.has(updated.sport?.toLowerCase())) {
      setMatches((current) =>
        current.some((match) => match.id === updated.id) ? current : [updated, ...current],
      );
    }
  });

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  return { matches, loading, error, retry };
}