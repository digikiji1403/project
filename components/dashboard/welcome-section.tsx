'use client';

import * as React from 'react';
import { Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { user } from '@/lib/mock-data';

export function WelcomeSection() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground md:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <Badge className="mb-3 border-white/20 bg-white/15 text-white hover:bg-white/20">
            <Sparkles className="mr-1 h-3 w-3" />
            AI Study Assistant
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {greeting}, {user.name.split(' ')[0]}!
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/90 md:text-base">
            You&apos;ve been on a{' '}
            <span className="inline-flex items-center gap-1 font-semibold">
              <Flame className="h-4 w-4" />
              {user.streak}-day streak
            </span>
            . Ready to keep the momentum going?
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            asChild
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90"
          >
            <a href="/tutor">Ask AI Tutor</a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <a href="/planner">Plan study time</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
