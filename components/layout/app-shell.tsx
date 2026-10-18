'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { DesktopSidebar } from './desktop-sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <DesktopSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div
        className={cn(
          'transition-[padding] duration-300 ease-in-out',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'
        )}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
