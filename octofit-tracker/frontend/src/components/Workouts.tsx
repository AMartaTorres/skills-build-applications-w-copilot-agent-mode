import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p role="status">Loading workout suggestions...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!suggestions.length) return <p>No workout suggestions available.</p>;
  return <section><h2>Workout suggestions</h2><ul>{suggestions.map((suggestion, index) =>
    <li key={index}>{suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}</li>
  )}</ul></section>;
}
