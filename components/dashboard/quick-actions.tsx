'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Upload,
  Sparkles,
  Layers,
  ListChecks,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { type QuickAction, quickActions } from '@/lib/mock-data';

const iconMap: Record<string, LucideIcon> = {
  Upload,
  Sparkles,
  Layers,
  ListChecks,
};

const accentStyles: Record<string, string> = {
  primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  success: 'bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground',
  warning: 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground',
};

export function QuickActions({
  actions = quickActions,
}: {
  actions?: QuickAction[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = iconMap[action.icon] ?? Upload;
        const accent = accentStyles[action.accent] ?? accentStyles.primary;
        return (
          <Link key={action.id} href={action.href} className="block">
            <Card className="group h-full cursor-pointer border transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                      accent
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
