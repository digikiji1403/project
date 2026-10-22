
'use client';

import * as React from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { EditLearningStats } from '@/components/dashboard/edit-learning-stats';
import {
  StatCard,
  StatCardSkeleton,
} from '@/components/dashboard/stat-card';
import {
  ActivityChart,
  ActivityChartSkeleton,
} from '@/components/dashboard/activity-chart';
import { RecentDocuments } from '@/components/dashboard/recent-documents';
import { UpcomingSessions } from '@/components/dashboard/upcoming-sessions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { SectionHeader } from '@/components/dashboard/section-header';

import { getLearningStats } from '@/lib/api';
import type { LearningStats } from '@/lib/types';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);

  const [learningStats, setLearningStats] =
    React.useState<LearningStats | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadLearningStats() {
      try {
        const data = await getLearningStats();
        setLearningStats(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load learning statistics'
        );
      } finally {
        setLoading(false);
      }
    }

    loadLearningStats();
  }, []);

  const statCards = learningStats
    ? [
        {
          label: 'Lessons Completed',
          value: String(learningStats.lessons_completed),
          delta: 'Total completed lessons',
          trend: 'neutral' as const,
          icon: 'FileText',
          accent: 'primary',
        },
        {
          label: 'Study Hours',
          value: String(learningStats.study_hours),
          delta: 'Total study time',
          trend: 'neutral' as const,
          icon: 'Flame',
          accent: 'success',
        },
        {
          label: 'Quiz Average',
          value: `${learningStats.quiz_average}%`,
          delta: 'Average quiz score',
          trend: 'neutral' as const,
          icon: 'TrendingUp',
          accent: 'warning',
        },
      ]
    : [];

  return (
    <AuthGuard>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <WelcomeSection />

        {/* Learning statistics from FastAPI */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          ) : error ? (
            <p className="col-span-full text-sm text-red-500">
              Unable to load learning statistics: {error}
            </p>
          ) : (
            statCards.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))
          )}
        </div>

        {/* Activity chart and upcoming sessions */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? <ActivityChartSkeleton /> : <ActivityChart />}
          </div>

          <UpcomingSessions loading={loading} />
        </div>

        {/* Recent documents and quick actions */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentDocuments loading={loading} />
          </div>

          <div className="flex flex-col gap-3">
            <SectionHeader
              title="Quick Actions"
              description="Jump into your workflow"
            />

            <QuickActions />
          </div>
        </div>

        <EditLearningStats />
      </div>
    </AuthGuard>
  );
}
