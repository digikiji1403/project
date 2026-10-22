
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  FileText,
} from 'lucide-react';

import {
  askAITutor,
  askDocumentQuestion,
  getConversations,
  getConversationHistory,
} from '@/lib/api';

import type {
  Conversation,
  ChatMessage,
  DocumentSource,
} from '@/lib/api';

import { Button } from '@/components/ui/button';

type Message = Pick<ChatMessage, 'role' | 'content'> & {
  sources?: DocumentSource[];
};

const suggestions = [
  'Explain a difficult concept in simple terms',
  'Help me prepare for an exam',
  'Give me a step-by-step explanation of a topic',
];

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}

function isAuthError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('session expired') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('unauthorized')
  );
}

export default function TutorPage() {
  const router = useRouter();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [question, setQuestion] = React.useState('');
  const [documentMode, setDocumentMode] = React.useState(false);
  const [documentId, setDocumentId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    React.useState<number | null>(null);

  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [historyError, setHistoryError] = React.useState('');

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const refreshConversations = React.useCallback(async () => {
    try {
      const result = await getConversations();
      setConversations(result);
      setHistoryError('');
    } catch (err) {
      const message = getErrorMessage(err);
      setHistoryError(message);

      if (isAuthError(message)) {
        router.replace('/login');
      }
    }
  }, [router]);

  React.useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  async function sendQuestion(text: string) {
    const trimmed = text.trim();

    if (!trimmed || loading || historyLoading) return;

    let parsedDocumentId: number | undefined;

    if (documentMode && documentId.trim()) {
      parsedDocumentId = Number(documentId);

      if (
        !Number.isInteger(parsedDocumentId) ||
        parsedDocumentId <= 0
      ) {
        setError(
          'Enter a valid positive PDF document ID, or leave it blank to search all your PDFs.'
        );
        return;
      }
    }

    setQuestion('');
    setError('');

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: trimmed },
    ]);

    setLoading(true);

    try {
      if (documentMode) {
        const result = await askDocumentQuestion(
          trimmed,
          parsedDocumentId,
          activeConversationId ?? undefined
        );

        setActiveConversationId(result.conversation_id);

        setMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
          },
        ]);
      } else {
        const result = await askAITutor(
          trimmed,
          activeConversationId ?? undefined
        );

        setActiveConversationId(result.conversation_id);

        setMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content: result.answer,
          },
        ]);
      }

      await refreshConversations();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      if (isAuthError(message)) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(conversationId: number) {
    if (loading || historyLoading) return;

    setHistoryLoading(true);
    setError('');
    setHistoryError('');

    try {
      const conversation = await getConversationHistory(conversationId);

      setActiveConversationId(conversation.id);

      setMessages(
        conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      );
    } catch (err) {
      const message = getErrorMessage(err);
      setHistoryError(message);

      if (isAuthError(message)) {
        router.replace('/login');
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  function startNewConversation() {
    if (loading || historyLoading) return;

    setActiveConversationId(null);
    setMessages([]);
    setQuestion('');
    setError('');
    setHistoryError('');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-3 py-5 sm:px-5 md:px-8">
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">AI Tutor</h1>
          <p className="text-sm text-muted-foreground">
            Your personal AI study assistant, powered by Groq
          </p>
        </div>

        <div className="ml-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Tutor ready
        </div>
      </header>

      <section className="flex min-h-[560px] flex-1 overflow-hidden rounded-2xl border bg-background shadow-sm">
        {sidebarOpen && (
          <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/20 sm:w-72">
            <div className="flex items-center justify-between gap-2 border-b p-3">
              <h2 className="text-sm font-semibold">Your conversations</h2>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void refreshConversations()}
                disabled={loading || historyLoading}
                aria-label="Refresh conversations"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3">
              <Button
                type="button"
                className="w-full justify-start gap-2"
                onClick={startNewConversation}
                disabled={loading || historyLoading}
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
              {historyError && (
                <div
                  role="alert"
                  className="m-1 rounded-lg border border-destructive/30 p-2 text-xs text-destructive"
                >
                  {historyError}
                </div>
              )}

              {conversations.length === 0 && !historyError && (
                <p className="px-3 py-6 text-center text-xs leading-5 text-muted-foreground">
                  No saved conversations yet. Ask a question to start your
                  first chat.
                </p>
              )}

              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void loadConversation(conversation.id)}
                  disabled={loading || historyLoading}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeConversationId === conversation.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground'
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {conversation.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t p-3">
              <p className="text-xs text-muted-foreground">
                Your chats are saved to your account.
              </p>
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-2.5 md:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={
                sidebarOpen ? 'Hide conversations' : 'Show conversations'
              }
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>

            <span className="truncate text-sm font-medium">
              {activeConversationId !== null
                ? conversations.find(
                    (conversation) => conversation.id === activeConversationId
                  )?.title ?? 'Saved conversation'
                : 'New conversation'}
            </span>

            {(loading || historyLoading) && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
            {historyLoading ? (
              <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  {documentMode ? (
                    <FileText className="h-8 w-8" />
                  ) : (
                    <Sparkles className="h-8 w-8" />
                  )}
                </div>

                <h2 className="text-xl font-semibold">
                  {documentMode
                    ? 'Ask questions about your PDFs'
                    : 'What would you like to learn?'}
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {documentMode
                    ? 'Ask questions grounded in your uploaded documents. Answers can include source filenames and page numbers.'
                    : "Ask a question, explore a challenging concept, or prepare for your next exam. I'll help you understand it step by step."}
                </p>

                <div className="mt-6 flex w-full max-w-lg flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={loading}
                      onClick={() => void sendQuestion(suggestion)}
                      className="rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${activeConversationId ?? 'new'}-${index}-${message.role}`}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="max-w-[85%]">
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === 'assistant' &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <div className="mt-2 rounded-xl border p-3">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
                            <FileText className="h-4 w-4" />
                            Sources
                          </p>

                          <ul className="space-y-1">
                            {message.sources.map((source, sourceIndex) => (
                              <li
                                key={`${source.document_id}-${source.page_number}-${sourceIndex}`}
                                className="text-xs text-muted-foreground"
                              >
                                {source.filename} · Page {source.page_number}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3 md:p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={documentMode ? 'outline' : 'default'}
                onClick={() => {
                  setDocumentMode(false);
                  setError('');
                }}
                disabled={loading || historyLoading}
              >
                <Bot className="mr-2 h-4 w-4" />
                General Tutor
              </Button>

              <Button
                type="button"
                variant={documentMode ? 'default' : 'outline'}
                onClick={() => {
                  setDocumentMode(true);
                  setError('');
                }}
                disabled={loading || historyLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ask my PDFs
              </Button>
            </div>

            {documentMode && (
              <div className="mb-3">
                <label
                  htmlFor="document-id"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  PDF document ID (optional)
                </label>

                <input
                  id="document-id"
                  type="number"
                  min="1"
                  step="1"
                  value={documentId}
                  onChange={(event) => setDocumentId(event.target.value)}
                  placeholder="Leave blank to search all your uploaded PDFs"
                  disabled={loading || historyLoading}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion(question);
                  }
                }}
                placeholder={
                  documentMode
                    ? 'Ask a question about your uploaded PDFs...'
                    : 'Ask your AI tutor anything...'
                }
                aria-label="Your question"
                rows={2}
                maxLength={5000}
                disabled={loading || historyLoading}
                className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />

              <Button
                type="submit"
                size="icon"
                disabled={loading || historyLoading || !question.trim()}
                aria-label="Send question"
                className="mb-1 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
