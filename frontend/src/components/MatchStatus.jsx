import LiveIndicator from './LiveIndicator.jsx';

const statusLabels = {
  upcoming: 'UPCOMING',
  finished: 'FINISHED',
};

export default function MatchStatus({ status }) {
  if (status === 'live') {
    return <LiveIndicator />;
  }

  const displayStatus = status === 'scheduled' ? 'upcoming' : status;

  return (
    <span className={`match-status status-${displayStatus}`}>
      {statusLabels[displayStatus] ?? displayStatus?.toUpperCase()}
    </span>
  );
}
