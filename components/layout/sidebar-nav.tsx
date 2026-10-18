'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  ListChecks,
  CalendarDays,
  BarChart3,
  Settings,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/nav';
import { user } from '@/lib/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  ListChecks,
  CalendarDays,
  BarChart3,
  Settings,
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold leading-tight tracking-tight">
            StudyMate AI
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Study smarter, not harder
          </span>
        </div>
      </Link>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-2">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Menu
        </p>
        {navLinks.map((link) => {
          const Icon = iconMap[link.icon] ?? LayoutDashboard;
          const active =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pb-2">
        <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-semibold">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-[10px] font-semibold text-primary"
            >
              {user.plan}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {user.streak} day streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
