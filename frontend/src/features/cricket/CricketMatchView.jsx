import MatchStatus from '../../components/MatchStatus.jsx';
import CricketCommentary from './CricketCommentary.jsx';
import CricketScoreboard from './CricketScoreboard.jsx';

export default function CricketMatchView({ match, events = [], onBack, subscription }) {
  return (
    <main className="detail-page cricket-detail">
      <div className="detail-topbar">
        <button className="back-link" onClick={onBack} type="button">
          ← Back to matches
        </button>

        <div className="detail-actions">
          <div className="detail-sport-badge cricket-badge">
            <span>🏏</span> Cricket <MatchStatus status={match.status} />
          </div>

          <button
            className="subscribe-button"
            type="button"
            disabled={!subscription?.isConnected}
            onClick={
              subscription?.isSubscribed
                ? subscription.unsubscribe
                : subscription.subscribe
            }
          >
            {subscription?.isSubscribed
              ? '✓ Live updates'
              : subscription?.isConnected
                ? 'Subscribe'
                : 'Connecting...'}
          </button>
        </div>
      </div>

      <header className="detail-heading">
        <p className="eyebrow">
          <span className="eyebrow-line cricket-line" /> Match schedule
        </p>

        <h1>
          {match.homeTeam} <span>vs</span> {match.awayTeam}
        </h1>
      </header>

      <CricketScoreboard match={match} />

      <div className="cricket-detail-grid">
        <section className="batting-panel detail-card">
          <div className="detail-section-heading">
            <div>
              <p className="section-kicker cricket-kicker">At the crease</p>
              <h2>Current batters</h2>
            </div>
          </div>

          {match.score?.batters?.length > 0 ? (
            match.score.batters.map((batter) => (
              <div className="player-row" key={batter.name}>
                <strong>
                  {batter.name}
                  {batter.onStrike ? ' *' : ''}
                </strong>

                <span>
                  {batter.runs ?? 0}{' '}
                  <small>({batter.balls ?? 0})</small>
                </span>
              </div>
            ))
          ) : (
            <p className="empty-player-state">
              Batting details will appear when the innings begins.
            </p>
          )}

          <div className="bowler-block">
            <p>Current bowler</p>

            {match.score?.bowler ? (
              <div className="player-row">
                <strong>{match.score.bowler.name}</strong>

                <span>
                  {match.score.bowler.overs ?? '0.0'} -{' '}
                  {match.score.bowler.maidens ?? 0} -{' '}
                  {match.score.bowler.runs ?? 0} -{' '}
                  {match.score.bowler.wickets ?? 0}
                </span>
              </div>
            ) : (
              <p className="empty-player-state">
                Bowler details will appear when the innings begins.
              </p>
            )}
          </div>

          <div className="last-over">
            <p>Last over</p>

            <div className="over-balls">
              {match.score?.lastBalls?.length > 0 ? (
                match.score.lastBalls.map((ball, index) => (
                  <span
                    key={`${ball}-${index}`}
                    className={
                      index === match.score.lastBalls.length - 1
                        ? 'over-highlight'
                        : ''
                    }
                  >
                    {ball}
                  </span>
                ))
              ) : (
                <span className="empty-over">—</span>
              )}
            </div>
          </div>
        </section>

        <CricketCommentary events={events}   score={match.score}/>
      </div>
    </main>
  );
}