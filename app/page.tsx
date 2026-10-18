'use client';

import * as React from 'react';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import {
  ActivityChart,
  ActivityChartSkeleton,
} from '@/components/dashboard/activity-chart';
import { RecentDocuments } from '@/components/dashboard/recent-documents';
import { UpcomingSessions } from '@/components/dashboard/upcoming-sessions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { SectionHeader } from '@/components/dashboard/section-header';
import { stats } from '@/lib/mock-data';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <WelcomeSection />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? <ActivityChartSkeleton /> : <ActivityChart />}
        </div>
        <UpcomingSessions loading={loading} />
      </div>

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
    </div>
  );
}
