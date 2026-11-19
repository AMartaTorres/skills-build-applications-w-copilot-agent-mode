import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <section><h2>Activities</h2><p role="status">Loading activities...</p></section>;
  if (error) return <section><h2>Activities</h2><p role="alert">{error}</p></section>;
  if (!activities.length) return <section><h2>Activities</h2><p>No activities recorded.</p></section>;
  return <section><h2>Activities</h2><ul>{activities.map((activity, index) =>
    <li key={index}>{activity.type} - {activity.minutes} minutes ({activity.points} points)</li>
  )}</ul></section>;
}
