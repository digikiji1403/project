'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  Presentation,
  Notebook,
  BookOpen,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  type DocumentItem,
  recentDocuments,
} from '@/lib/mock-data';

const typeIcon: Record<DocumentItem['type'], typeof FileText> = {
  PDF: FileText,
  Slides: Presentation,
  Notes: Notebook,
  Textbook: BookOpen,
};

const typeColors: Record<DocumentItem['type'], string> = {
  PDF: 'bg-red-500/10 text-red-500',
  Slides: 'bg-amber-500/10 text-amber-500',
  Notes: 'bg-primary/10 text-primary',
  Textbook: 'bg-emerald-500/10 text-emerald-500',
};

export function RecentDocuments({
  documents = recentDocuments,
  loading = false,
}: {
  documents?: DocumentItem[];
  loading?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">
            Recent Documents
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Recently added study materials
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <Link href="/documents">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-6 pt-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-2 w-16" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyDocuments />
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => {
              const Icon = typeIcon[doc.type];
              return (
                <li
                  key={doc.id}
                  className="group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      typeColors[doc.type]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {doc.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.subject} · {doc.type} · {doc.size} ·{' '}
                      {doc.uploadedAt}
                    </p>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">
                        {doc.progress}%
                      </span>
                    </div>
                    <Progress value={doc.progress} className="h-1.5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Document options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyDocuments() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No documents yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload your first notes to get started.
        </p>
      </div>
      <Button asChild size="sm" className="mt-1">
        <Link href="/documents">Upload document</Link>
      </Button>
    </div>
  );
}
