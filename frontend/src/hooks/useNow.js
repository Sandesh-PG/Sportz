import { useEffect, useState } from 'react';

// Re-renders the component every `intervalMs` and returns the current time (ms).
// Drives the live football clock and the "starts in" countdowns.
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}