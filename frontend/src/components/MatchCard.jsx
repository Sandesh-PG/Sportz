import MatchStatus from './MatchStatus.jsx';
import { Link } from 'react-router-dom';

const sportDetails = {
  football: { icon: '⚽', label: 'Football' },
  cricket: { icon: '🏏', label: 'Cricket' },
};

function normalizeStatus(status) {
  if (status === 'scheduled') return 'upcoming';
  return status?.toLowerCase() ?? 'unknown';
}

function getInitials(teamName = '') {
  return teamName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMatchTime(match) {
  const status = normalizeStatus(match.status);

  if (status === 'live') return 'Live now';

  const value = status === 'finished' ? match.endTime : match.startTime;
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getCricketScore(match, side) {
  const score = match.score?.[side];

  if (score) {
    return {
      runs: score.runs ?? 0,
      wickets: score.wickets ?? 0,
      overs: score.overs ?? '0.0',
    };
  }

  return {
    runs: match[`${side}Score`] ?? '-',
    wickets: null,
    overs: null,
  };
}

export default function MatchCard({ match }) {
  const sportKey = match.sport?.toLowerCase();
  const sport = sportDetails[sportKey] ?? {
    icon: '•',
    label: match.sport ?? 'Sport',
  };

  const status = normalizeStatus(match.status);
  const isFootball = sportKey === 'football';
  const isCricket = sportKey === 'cricket';

  const homeCricket = getCricketScore(match, 'home');
  const awayCricket = getCricketScore(match, 'away');

  const battingSide = match.score?.battingSide;
  const battingScore =
    battingSide === 'home'
      ? homeCricket
      : battingSide === 'away'
        ? awayCricket
        : null;

  const liveMinute = match.score?.minute;

  return (
    <article
      className={`match-card sport-${sportKey} status-${status}`}
      aria-label={`${match.homeTeam} versus ${match.awayTeam}`}
    >
      <div className="match-card-topline">
        <div className="sport-label">
          <span className="sport-icon" aria-hidden="true">
            {sport.icon}
          </span>
          <span>{sport.label}</span>
        </div>
        <MatchStatus status={match.status} />
      </div>

      <div className="match-card-body">
        <div className="match-card-status">
          <span>
            {status === 'live'
              ? 'LIVE'
              : status === 'finished'
                ? 'FULL TIME'
                : 'UPCOMING'}
          </span>

          {status === 'live' ? (
            <span className="match-card-live-time">
              {isFootball && liveMinute != null
                ? `${liveMinute}'`
                : isCricket && battingScore?.overs != null
                  ? `${battingScore.overs} OV`
                  : 'LIVE'}
            </span>
          ) : null}
        </div>

        <div className={`poster-scoreline ${isCricket ? 'poster-cricket' : ''}`}>
          <div className="poster-team">
            <div className="poster-crest">{getInitials(match.homeTeam)}</div>
            <span className="poster-team-name">{match.homeTeam}</span>
          </div>

          {isFootball ? (
            <div className="poster-score">
              <strong>
                {match.homeScore ?? 0}
                <span>:</span>
                {match.awayScore ?? 0}
              </strong>
              <small>
                {status === 'live' && liveMinute != null
                  ? `${liveMinute}'`
                  : status === 'finished'
                    ? 'FT'
                    : 'VS'}
              </small>
            </div>
          ) : (
            <div className="poster-score">
              <strong>
                {homeCricket.runs}
                {homeCricket.wickets != null ? (
                  <span className="cricket-wickets">/{homeCricket.wickets}</span>
                ) : null}
              </strong>

              <span className="poster-vs">vs</span>

              <strong>
                {awayCricket.runs}
                {awayCricket.wickets != null ? (
                  <span className="cricket-wickets">/{awayCricket.wickets}</span>
                ) : null}
              </strong>

              <small>
                {status === 'live' && battingScore?.overs != null
                  ? `${battingScore.overs} OV`
                  : status === 'finished'
                    ? 'FINAL'
                    : 'VS'}
              </small>
            </div>
          )}

          <div className="poster-team poster-team-away">
            <div className="poster-crest">{getInitials(match.awayTeam)}</div>
            <span className="poster-team-name">{match.awayTeam}</span>
          </div>
        </div>

        {status === 'live' && isFootball ? (
          <div className="poster-live-line">
            <span className="poster-live-dot" />
            Match in progress
          </div>
        ) : null}

        {status === 'live' && isCricket && battingSide ? (
          <div className="poster-live-line">
            <span className="poster-live-dot" />
            {battingSide === 'home' ? match.homeTeam : match.awayTeam} batting
          </div>
        ) : null}
      </div>

      <div className="match-card-footer">
        <span className="match-time">{formatMatchTime(match)}</span>
        <Link className="view-match" to={`/matches/${match.id}`}>
          View Match <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
