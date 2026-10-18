'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type StudySession, upcomingSessions } from '@/lib/mock-data';

const typeStyles: Record<StudySession['type'], string> = {
  Review: 'bg-primary/10 text-primary',
  Quiz: 'bg-warning/10 text-warning',
  Reading: 'bg-success/10 text-success',
  Tutor: 'bg-chart-4/10 text-chart-4',
};

export function UpcomingSessions({
  sessions = upcomingSessions,
  loading = false,
}: {
  sessions?: StudySession[];
  loading?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">
            Upcoming Sessions
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Your planned study time
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <Link href="/planner">
            Planner
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No upcoming sessions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Plan your next study block to stay on track.
              </p>
            </div>
            <Button asChild size="sm" className="mt-1">
              <Link href="/planner">Schedule a session</Link>
            </Button>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-[10px] font-medium uppercase leading-none">
                  {session.date === 'Today'
                    ? 'Now'
                    : session.date === 'Tomorrow'
                    ? 'Tmr'
                    : session.date.slice(0, 3)}
                </span>
                <Clock className="mt-0.5 h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {session.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.subject} · {session.startTime} ·{' '}
                  {session.duration} min
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0 text-[10px] font-semibold',
                  typeStyles[session.type]
                )}
              >
                {session.type}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
