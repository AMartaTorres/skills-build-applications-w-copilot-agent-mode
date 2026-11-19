import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p role="status">Loading leaderboard...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!entries.length) return <p>No leaderboard rankings yet.</p>;
  return <section><h2>Leaderboard</h2><ol>{entries.map((entry) => <li key={entry.rank}>{entry.teamName}: {entry.totalPoints}</li>)}</ol></section>;
}
