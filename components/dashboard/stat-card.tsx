'use client';

import * as React from 'react';
import {
  FileText,
  MessagesSquare,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, LucideIcon> = {
  FileText,
  MessagesSquare,
  Flame,
  TrendingUp,
};

const accentStyles: Record<string, { icon: string; ring: string }> = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    ring: 'from-primary/10',
  },
  success: {
    icon: 'bg-success/10 text-success',
    ring: 'from-success/10',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    ring: 'from-warning/10',
  },
};

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColor = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

export type StatCardData = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  accent: string;
};

export function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = iconMap[stat.icon] ?? FileText;
  const accent = accentStyles[stat.accent] ?? accentStyles.primary;
  const TrendIcon = trendIcon[stat.trend];
  const trendCls = trendColor[stat.trend];

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <div
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl',
          accent.ring
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl',
              accent.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trendCls
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <span className="text-2xl font-bold tracking-tight">
            {stat.value}
          </span>
          <span className="text-sm text-muted-foreground">{stat.label}</span>
        </div>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {stat.delta}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  );
}
