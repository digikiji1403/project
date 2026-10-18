'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  ListChecks,
  CalendarDays,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { SidebarNav } from './sidebar-nav';

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

export function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r bg-card transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[76px]' : 'w-[260px]'
      )}
    >
      {!collapsed ? (
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-hidden">
            <SidebarNav />
          </div>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground"
              onClick={onToggle}
            >
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex flex-col items-center gap-1 py-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            >
              <GraduationCap className="h-5 w-5" />
            </Link>
          </div>
          <nav className="mt-2 flex flex-1 flex-col items-center gap-1 px-2">
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
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                  title={link.label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t p-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={onToggle}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
