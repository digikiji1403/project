'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  generateStudyMaterial,
  getDocuments,
  getStudyMaterials,
  recordQuizAttempt,
} from '@/lib/api';
import type { StudyDocument, StudyMaterial } from '@/lib/api';

type Question = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

export default function QuizzesPage() {
  const [documents, setDocuments] = React.useState<StudyDocument[]>([]);
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [selectedDocument, setSelectedDocument] = React.useState('');
  const [activeMaterial, setActiveMaterial] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    const [nextDocuments, nextMaterials] = await Promise.all([
      getDocuments(),
      getStudyMaterials('quiz'),
    ]);
    setDocuments(nextDocuments);
    setMaterials(nextMaterials);
    setSelectedDocument((current) => current || String(nextDocuments.find((item) => item.status === 'ready')?.id ?? ''));
    setActiveMaterial((current) => current ?? nextMaterials[0]?.id ?? null);
  }, []);

  React.useEffect(() => {
    void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load quizzes.'));
  }, [load]);

  const active = materials.find((material) => material.id === activeMaterial);
  const questions: Question[] = active && Array.isArray(active.content)
    ? active.content.filter((item): item is Question => Boolean(
        item.question && item.choices && item.answer && item.explanation
      ))
    : [];

  async function generate() {
    if (!selectedDocument || loading) return;
    setLoading(true);
    setError('');
    try {
      const material = await generateStudyMaterial(Number(selectedDocument), 'quiz');
      setMaterials((current) => [material, ...current]);
      setActiveMaterial(material.id);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate the quiz.');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    if (!active || !questions.length || submitted || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await recordQuizAttempt(
        active.id,
        questions.map((_, index) => answers[index] ?? '')
      );
      setScore(result.score);
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your quiz result.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Test recall with document-grounded quizzes and track results by topic.</p>
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
            Generate quiz
          </Button>
        </section>

        {materials.length > 0 && (
          <label className="block text-sm font-medium">
            Saved quiz
            <select
              value={activeMaterial ?? ''}
              onChange={(event) => { setActiveMaterial(Number(event.target.value)); setAnswers({}); setSubmitted(false); setScore(null); }}
              className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal"
            >
              {materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}
            </select>
          </label>
        )}

        {questions.length > 0 ? (
          <form onSubmit={(event) => { event.preventDefault(); void submitQuiz(); }} className="space-y-4">
            {questions.map((item, questionIndex) => (
              <fieldset key={`${activeMaterial}-${questionIndex}`} className="rounded-xl border bg-card p-5">
                <legend className="px-1 font-medium">{questionIndex + 1}. {item.question}</legend>
                <div className="mt-3 space-y-2">
                  {item.choices.map((choice, choiceIndex) => (
                    <label key={choiceIndex} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${submitted && choice === item.answer ? 'border-green-600 bg-green-500/10' : ''}`}>
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={choice}
                        checked={answers[questionIndex] === choice}
                        onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: choice }))}
                        disabled={submitted || loading}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
                {submitted && <p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p>}
              </fieldset>
            ))}
            {submitted ? (
              <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-4 font-medium">Result saved: {score}%</p>
            ) : (
              <Button type="submit" disabled={loading || Object.keys(answers).length !== questions.length}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit answers
              </Button>
            )}
          </form>
        ) : (
          <p className="rounded-xl border p-6 text-sm text-muted-foreground">Generate a quiz from a processed PDF or select one of your saved quizzes.</p>
        )}
      </main>
    </AuthGuard>
  );
}
