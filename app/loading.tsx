import { StatCardSkeleton } from '@/components/dashboard/stat-card';
import { ActivityChartSkeleton } from '@/components/dashboard/activity-chart';

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="h-36 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChartSkeleton />
        </div>
        <div className="h-[320px] animate-pulse rounded-lg border bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[360px] animate-pulse rounded-lg border bg-muted" />
        <div className="h-[360px] animate-pulse rounded-lg border bg-muted" />
      </div>
    </div>
  );
}
