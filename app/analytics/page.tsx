'use client';

import * as React from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { getLearningAnalytics } from '@/lib/api';
import type { LearningAnalytics } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<LearningAnalytics | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    getLearningAnalytics()
      .then(setAnalytics)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load learning analytics.'));
  }, []);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Learning analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use quiz results and learning stats to guide your next revision.</p>
        </header>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
        {!analytics && !error && <p className="rounded-xl border p-5 text-sm text-muted-foreground">Loading your learning data…</p>}
        {analytics && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Lessons completed', analytics.lessons_completed],
                ['Study hours', analytics.study_hours],
                ['Quiz average', `${analytics.quiz_average}%`],
                ['Quiz attempts', analytics.quiz_attempts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-semibold">Topic performance</h2>
                {analytics.topic_performance.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Complete a generated quiz to start tracking strengths and topics to revisit.</p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {analytics.topic_performance.map((item) => (
                      <li key={item.topic}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="truncate">{item.topic}</span>
                          <span className="shrink-0 font-medium">{item.average_score}% · {item.attempt_count} attempt{item.attempt_count === 1 ? '' : 's'}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${item.average_score < 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.max(0, Math.min(100, item.average_score))}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-5">
                  <h2 className="font-semibold">Strengths</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{analytics.strengths.length ? analytics.strengths.join(', ') : 'Keep taking quizzes; strengths appear after results reach 80%.'}</p>
                </div>
                <div className="rounded-2xl border bg-card p-5">
                  <h2 className="font-semibold">Revision recommendations</h2>
                  <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-muted-foreground">
                    {analytics.recommendations.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </AuthGuard>
  );
}
