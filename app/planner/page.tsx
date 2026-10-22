'use client';

import * as React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  createStudySession,
  getLearningAnalytics,
  getStudyPlan,
  updateStudySessionStatus,
} from '@/lib/api';
import type { LearningAnalytics, StudyPlanSession } from '@/lib/api';

export default function PlannerPage() {
  const [sessions, setSessions] = React.useState<StudyPlanSession[]>([]);
  const [analytics, setAnalytics] = React.useState<LearningAnalytics | null>(null);
  const [title, setTitle] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [duration, setDuration] = React.useState('30');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    const [nextSessions, nextAnalytics] = await Promise.all([
      getStudyPlan(),
      getLearningAnalytics(),
    ]);
    setSessions(nextSessions);
    setAnalytics(nextAnalytics);
  }, []);

  React.useEffect(() => {
    void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load your study plan.'));
  }, [load]);

  async function addSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createStudySession({
        title: title.trim(),
        subject: subject.trim(),
        scheduled_date: scheduledDate,
        duration_minutes: Number(duration),
      });
      setTitle('');
      setSubject('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the study session.');
    } finally {
      setLoading(false);
    }
  }

  async function completeSession(session: StudyPlanSession) {
    setLoading(true);
    setError('');
    try {
      const updated = await updateStudySessionStatus(session.id, 'completed');
      setSessions((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the study session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Study planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schedule focused sessions and prioritize topics based on quiz performance.</p>
        </header>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}

        {analytics?.weaknesses.length ? (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="font-semibold">Suggested revision focus</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recent quiz results suggest reviewing: {analytics.weaknesses.join(', ')}.</p>
          </section>
        ) : (
          <section className="rounded-xl border p-4 text-sm text-muted-foreground">
            Complete quizzes to get recommendations tailored to topics that need review.
          </section>
        )}

        <form onSubmit={(event) => void addSession(event)} className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Plan a study session</h2>
          <label className="text-sm font-medium">
            Session title
            <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal" />
          </label>
          <label className="text-sm font-medium">
            Subject
            <input required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal" />
          </label>
          <label className="text-sm font-medium">
            Date
            <input required type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal" />
          </label>
          <label className="text-sm font-medium">
            Duration
            <select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal">
              {[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading || !scheduledDate}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add to planner
            </Button>
          </div>
        </form>

        <section className="space-y-3">
          <h2 className="font-semibold">Your sessions</h2>
          {sessions.length === 0 ? (
            <p className="rounded-xl border p-5 text-sm text-muted-foreground">No sessions planned yet. Add your first session above.</p>
          ) : sessions.map((session) => (
            <article key={session.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{session.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{session.subject} · {session.scheduled_date} · {session.duration_minutes} min</p>
              </div>
              {session.status === 'completed' ? (
                <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />Completed</span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => void completeSession(session)} disabled={loading}>Mark complete</Button>
              )}
            </article>
          ))}
        </section>
      </main>
    </AuthGuard>
  );
}
