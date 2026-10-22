'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Loader2, Sparkles, Upload } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  generateStudyMaterial,
  getDocuments,
  getStudyMaterials,
  uploadDocument,
} from '@/lib/api';
import type { StudyDocument, StudyMaterial } from '@/lib/api';

const textKinds = ['summary', 'notes', 'explanation'] as const;

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<StudyDocument[]>([]);
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [selectedDocument, setSelectedDocument] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [topic, setTopic] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const refresh = React.useCallback(async () => {
    const [nextDocuments, nextMaterials] = await Promise.all([
      getDocuments(),
      getStudyMaterials(),
    ]);
    setDocuments(nextDocuments);
    setMaterials(nextMaterials);
    setSelectedDocument((current) =>
      current || String(nextDocuments.find((item) => item.status === 'ready')?.id ?? '')
    );
  }, []);

  React.useEffect(() => {
    void refresh().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Could not load documents.');
    });
  }, [refresh]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const uploaded = await uploadDocument(file);
      setMessage(`${uploaded.filename} was processed and is ready to study.`);
      setFile(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function createMaterial(kind: (typeof textKinds)[number]) {
    if (!selectedDocument || loading) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const material = await generateStudyMaterial(
        Number(selectedDocument),
        kind,
        topic
      );
      setMaterials((current) => [material, ...current]);
      setMessage(`${kind[0].toUpperCase()}${kind.slice(1)} saved to your study materials.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Documents & study materials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload PDFs for private, cited answers and grounded study tools.
          </p>
        </header>

        {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</p>}

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Upload a PDF</h2>
          <p className="mt-1 text-sm text-muted-foreground">PDF only, up to 10 MB. Text is extracted and indexed for your account.</p>
          <form onSubmit={handleUpload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              aria-label="Choose a PDF"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-sm"
            />
            <Button type="submit" disabled={!file || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload and process
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Your document library</h2>
              <p className="mt-1 text-sm text-muted-foreground">Only documents in your account are listed and searchable.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/tutor"><Sparkles className="mr-2 h-4 w-4" />Ask a cited question</Link>
            </Button>
          </div>
          <div className="mt-4 divide-y">
            {documents.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No PDFs uploaded yet.</p>
            ) : documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center gap-3 py-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{document.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.page_count ?? '—'} pages · {(document.file_size / 1024 / 1024).toFixed(2)} MB · {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs capitalize text-muted-foreground">{document.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Create grounded study materials</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generated material uses the selected PDF and is saved to your account.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Source PDF
              <select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal" disabled={loading}>
                <option value="">Choose a processed PDF</option>
                {documents.filter((document) => document.status === 'ready').map((document) => (
                  <option key={document.id} value={document.id}>{document.filename}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Topic focus (optional)
              <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={255} placeholder="e.g. cellular respiration" className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal" disabled={loading} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {textKinds.map((kind) => (
              <Button key={kind} variant="outline" onClick={() => void createMaterial(kind)} disabled={!selectedDocument || loading}>
                {kind[0].toUpperCase() + kind.slice(1)}
              </Button>
            ))}
            <Button asChild variant="outline"><Link href="/quizzes">Generate a quiz</Link></Button>
            <Button asChild variant="outline"><Link href="/flashcards">Generate flashcards</Link></Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Saved study materials</h2>
          {materials.length === 0 ? (
            <p className="rounded-xl border p-5 text-sm text-muted-foreground">Summaries, notes, explanations, quizzes, and flashcards you create will appear here.</p>
          ) : materials.map((material) => (
            <article key={material.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{material.title}</h3>
                <span className="text-xs capitalize text-muted-foreground">{material.kind} · {new Date(material.created_at).toLocaleDateString()}</span>
              </div>
              {'text' in material.content ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{material.content.text}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{material.content.length} saved items. Open the {material.kind} page to review.</p>
              )}
            </article>
          ))}
        </section>
      </main>
    </AuthGuard>
  );
}
