export const initialScore = {
  football: { home: 0, away: 0, minute: 0, period: null },
  cricket:  { battingTeam: null, runs: 0, wickets: 0, overs: '0.0' },
};

const reducers = {
  football(s, ev) {
    const d = ev.metadata?.scoreDelta ?? {};
    return { ...s, home: s.home + (d.home || 0), away: s.away + (d.away || 0),
             minute: ev.minute, period: ev.period };
  },
  cricket(s, ev) {
    const m = ev.metadata ?? {};
    return { ...s, battingTeam: ev.team ?? s.battingTeam,
             runs: s.runs + (m.runs || 0),
             wickets: s.wickets + (m.wicket ? 1 : 0),
             overs: m.over ?? s.overs };
  },
};

export const getInitialScore = (sport) => initialScore[sport.toLowerCase()] ?? {};
export const applyEvent = (sport, score, ev) =>
  (reducers[sport.toLowerCase()] ?? ((s) => s))(score, ev);