
'use client';

import * as React from 'react';
import { getLearningStats, updateLearningStats } from '@/lib/api';
import type { LearningStats } from '@/lib/types';

export function EditLearningStats() {
  const [stats, setStats] = React.useState<LearningStats>({
    lessons_completed: 0,
    study_hours: 0,
    quiz_average: 0,
  });

  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    getLearningStats()
      .then(setStats)
      .catch(() => setMessage('Could not load current statistics.'));
  }, []);

  function updateField(
    field: keyof LearningStats,
    value: string
  ) {
    setStats((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const updated = await updateLearningStats(stats);
      setStats(updated);
      setMessage('Learning statistics saved successfully!');
    } catch {
      setMessage('Unable to save. Check the API server and your values.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Edit Learning Statistics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your learning progress.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          Lessons completed
          <input
            type="number"
            min="0"
            step="1"
            required
            value={stats.lessons_completed}
            onChange={(event) =>
              updateField('lessons_completed', event.target.value)
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Study hours
          <input
            type="number"
            min="0"
            step="0.1"
            required
            value={stats.study_hours}
            onChange={(event) =>
              updateField('study_hours', event.target.value)
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Quiz average (%)
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value={stats.quiz_average}
            onChange={(event) =>
              updateField('quiz_average', event.target.value)
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Statistics'}
        </button>

        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
