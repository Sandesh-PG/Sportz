import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Matches from './pages/Matches.jsx';
import MatchDetails from './pages/MatchDetails.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Matches />} path="/matches" />
      <Route element={<MatchDetails />} path="/matches/:matchId" />
    </Routes>
  );
}
