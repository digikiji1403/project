'use client';

import * as React from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  generateStudyMaterial,
  getDocuments,
  getStudyMaterials,
} from '@/lib/api';
import type { StudyDocument, StudyMaterial } from '@/lib/api';

export default function FlashcardsPage() {
  const [documents, setDocuments] = React.useState<StudyDocument[]>([]);
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [selectedDocument, setSelectedDocument] = React.useState('');
  const [activeMaterial, setActiveMaterial] = React.useState<number | null>(null);
  const [flipped, setFlipped] = React.useState<Record<number, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    const [nextDocuments, nextMaterials] = await Promise.all([
      getDocuments(),
      getStudyMaterials('flashcards'),
    ]);
    setDocuments(nextDocuments);
    setMaterials(nextMaterials);
    setSelectedDocument((current) => current || String(nextDocuments.find((item) => item.status === 'ready')?.id ?? ''));
    setActiveMaterial((current) => current ?? nextMaterials[0]?.id ?? null);
  }, []);

  React.useEffect(() => {
    void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load flashcards.'));
  }, [load]);

  async function generate() {
    if (!selectedDocument || loading) return;
    setLoading(true);
    setError('');
    try {
      const material = await generateStudyMaterial(Number(selectedDocument), 'flashcards');
      setMaterials((current) => [material, ...current]);
      setActiveMaterial(material.id);
      setFlipped({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate flashcards.');
    } finally {
      setLoading(false);
    }
  }

  const active = materials.find((material) => material.id === activeMaterial);
  const cards = active && Array.isArray(active.content)
    ? active.content.filter((item) => item.front && item.back)
    : [];

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate and review saved cards grounded in your PDFs.</p>
        </header>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
        <section className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-5">
          <label className="min-w-64 flex-1 text-sm font-medium">
            Source PDF
            <select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal">
              <option value="">Choose a processed PDF</option>
              {documents.filter((document) => document.status === 'ready').map((document) => (
                <option key={document.id} value={document.id}>{document.filename}</option>
              ))}
            </select>
          </label>
          <Button onClick={() => void generate()} disabled={!selectedDocument || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate flashcards
          </Button>
        </section>

        {materials.length > 0 && (
          <label className="block max-w-xl text-sm font-medium">
            Saved deck
            <select value={activeMaterial ?? ''} onChange={(event) => { setActiveMaterial(Number(event.target.value)); setFlipped({}); }} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal">
              {materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}
            </select>
          </label>
        )}

        {active && cards.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card, index) => (
              <button
                key={`${active.id}-${index}`}
                type="button"
                onClick={() => setFlipped((current) => ({ ...current, [index]: !current[index] }))}
                className="flex min-h-48 flex-col items-center justify-center rounded-2xl border bg-card p-6 text-center transition-colors hover:bg-muted/50"
                aria-label={`Flashcard ${index + 1}: ${flipped[index] ? 'show front' : 'show answer'}`}
              >
                <span className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> {flipped[index] ? 'Answer' : `Card ${index + 1} · click to flip`}
                </span>
                <span className="text-lg font-medium leading-7">{flipped[index] ? card.back : card.front}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border p-6 text-sm text-muted-foreground">Choose a processed PDF and generate your first flashcard deck.</p>
        )}
      </main>
    </AuthGuard>
  );
}
