import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import CricketMatchView from '../features/cricket/CricketMatchView.jsx';
import FootballMatchView from '../features/football/FootballMatchView.jsx';

import { getMatches, getMatchCommentary } from '../services/api.js';
import useMatchWebSocket from '../hooks/useMatchWebSocket.js';

export default function MatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [commentary, setCommentary] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setLoading(true);
    setError(null);

    Promise.all([
      getMatches(),
      getMatchCommentary(matchId),
    ])
      .then(([matchData, commentaryData]) => {
        if (!isCurrent) return;

        setMatches(matchData);
        setCommentary(commentaryData);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [matchId, retryKey]);

  const match = matches.find(
    (candidate) => Number(matchId) === candidate.id,
  );

const {
  isConnected,
  isSubscribed,
  subscribe,
  unsubscribe,
} = useMatchWebSocket(
  matchId,
  (message) => {
    if (message?.type === 'score_update') {
      const updated = message.data;

      if (!updated) return;

      setMatches((current) =>
        current.map((item) =>
          item.id === updated.matchId
            ? {
                ...item,
                homeScore: updated.homeScore,
                awayScore: updated.awayScore,
                score: updated.score,
                status: updated.status,
              }
            : item,
        ),
      );

      return;
    }

    if (message?.type === 'match_updated') {
      const updated = message.data;

      if (!updated) return;

      setMatches((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      return;
    }

    if (message?.type !== 'commentary_update') {
      return;
    }

    const event = message.data;

    if (!event) return;

    setCommentary((current) => {
      const exists = current.some(
        (item) => item.id === event.id,
      );

      if (exists) {
        return current;
      }

      return [event, ...current];
    });

    if (event.match) {
      setMatches((current) =>
        current.map((item) =>
          item.id === event.match.id
            ? event.match
            : item,
        ),
      );
    }
  },
);

  if (loading) {
    return (
      <div className="app-shell detail-state page-state">
        Loading matches...
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell detail-state page-state error-state">
        <strong>Unable to load match</strong>

        <button
          className="retry-button"
          onClick={() => setRetryKey((value) => value + 1)}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="detail-topbar">
      <button
        className="back-link"
        onClick={onBack}
        type="button"
      >
        ← Back to matches
      </button>

      <div className="detail-actions">
        <button
          className="subscribe-button"
          type="button"
          disabled={!isConnected}
          onClick={isSubscribed ? unsubscribe : subscribe}
        >
          {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
        </button>
      </div>
    </div>
    );
  }

  return (
    <div className="app-shell detail-shell">
      {match.sport === 'football' ? (
        <FootballMatchView
          match={match}
          events={commentary}
          onBack={() => navigate('/matches')}
          
        />
      ) : (
        <CricketMatchView
          match={match}
          events={commentary}
          onBack={() => navigate('/matches')}
           subscription={{
            isConnected,
            isSubscribed,
            subscribe,
            unsubscribe,
          }}
        />
      )}
    </div>
  );
}