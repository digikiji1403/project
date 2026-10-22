'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { StudyDocument } from '@/lib/api';

export function RecentDocuments({
  documents = [],
  loading = false,
}: {
  documents?: StudyDocument[];
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
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {doc.filename}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.page_count ?? '—'} pages · {(doc.file_size / 1024 / 1024).toFixed(2)} MB · {doc.status}
                    </p>
                  </div>
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
