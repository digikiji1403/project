'use client';

import * as React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PagePlaceholder({
  title,
  description,
  badge = 'Coming soon',
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16">
      <Card className="w-full overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {badge}
          </Badge>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <p className="max-w-md text-xs text-muted-foreground">
            This section is part of the StudyMate AI workspace and will be
            built out in the next step.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2 gap-1">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
