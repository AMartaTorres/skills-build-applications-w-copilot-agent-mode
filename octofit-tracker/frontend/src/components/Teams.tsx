import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members?: unknown[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p role="status">Loading teams...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!teams.length) return <p>No teams available.</p>;
  return <section><h2>Teams</h2><ul>{teams.map((team, index) => <li key={index}>{team.name}</li>)}</ul></section>;
}
