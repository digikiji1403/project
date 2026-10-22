
import type { LearningStats } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "studymate_access_token";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem(TOKEN_KEY);

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Invalid credentials or session expired. Please log in again."
      );
    }

    const detail = await response.text();
    throw new Error(detail || "API request failed.");
  }

  return response.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<{
    access_token: string;
    token_type: string;
  }>(response);

  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function getLearningStats(): Promise<LearningStats> {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<LearningStats>(response);
}

export async function updateLearningStats(
  stats: LearningStats
): Promise<LearningStats> {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(stats),
  });

  return handleResponse<LearningStats>(response);
}

// Represents a saved conversation.
export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// Represents a saved user or assistant message.
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Represents a conversation together with its message history.
export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

// The AI Tutor returns both its answer and the conversation ID.
export interface TutorAnswer {
  answer: string;
  conversation_id: number;
}

// Retrieve all conversations belonging to the logged-in user.
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<Conversation[]>(response);
}

// Create a new conversation.
export async function createConversation(
  title = "New conversation"
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });

  return handleResponse<Conversation>(response);
}

// Retrieve one conversation and all its saved messages.
export async function getConversationHistory(
  conversationId: number
): Promise<ConversationDetail> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return handleResponse<ConversationDetail>(response);
}

// Send a question, optionally continuing an existing conversation.
export async function askAITutor(
  question: string,
  conversationId?: number
): Promise<TutorAnswer> {
  const response = await fetch(`${API_BASE_URL}/tutor/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question,
      ...(conversationId !== undefined
        ? { conversation_id: conversationId }
        : {}),
    }),
  });

  return handleResponse<TutorAnswer>(response);
}


export interface DocumentSource {
  document_id: number;
  filename: string;
  page_number: number;
  score: number;
}

export interface DocumentAnswer {
  answer: string;
  sources: DocumentSource[];
  conversation_id: number;
}

export interface StudyDocument {
  id: number;
  filename: string;
  file_size: number;
  page_count: number | null;
  status: "uploaded" | "processing" | "ready" | "failed";
  created_at: string;
}

export interface StudyMaterial {
  id: number;
  document_id: number | null;
  kind: "summary" | "notes" | "explanation" | "quiz" | "flashcards";
  title: string;
  content:
    | { text: string }
    | Array<{
        question?: string;
        choices?: string[];
        answer?: string;
        explanation?: string;
        front?: string;
        back?: string;
      }>;
  created_at: string;
}

export interface TopicPerformance {
  topic: string;
  average_score: number;
  attempt_count: number;
}

export interface LearningAnalytics {
  lessons_completed: number;
  study_hours: number;
  quiz_average: number;
  quiz_attempts: number;
  topic_performance: TopicPerformance[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface StudyPlanSession {
  id: number;
  title: string;
  subject: string;
  scheduled_date: string;
  duration_minutes: number;
  status: "planned" | "completed";
  created_at: string;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

export async function getDocuments(): Promise<StudyDocument[]> {
  return apiRequest<StudyDocument[]>("/documents");
}

export async function uploadDocument(file: File): Promise<StudyDocument> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<StudyDocument>("/documents", {
    method: "POST",
    body,
  });
}

export async function getStudyMaterials(
  kind?: StudyMaterial["kind"]
): Promise<StudyMaterial[]> {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return apiRequest<StudyMaterial[]>(`/study/materials${query}`);
}

export async function generateStudyMaterial(
  documentId: number,
  kind: StudyMaterial["kind"],
  topic?: string
): Promise<StudyMaterial> {
  return apiRequest<StudyMaterial>("/study/materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_id: documentId,
      kind,
      ...(topic?.trim() ? { topic: topic.trim() } : {}),
    }),
  });
}

export async function recordQuizAttempt(
  materialId: number,
  answers: string[]
): Promise<{ score: number }> {
  return apiRequest<{ score: number }>("/study/quiz-attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ material_id: materialId, answers }),
  });
}

export async function getLearningAnalytics(): Promise<LearningAnalytics> {
  return apiRequest<LearningAnalytics>("/analytics");
}

export async function getStudyPlan(): Promise<StudyPlanSession[]> {
  return apiRequest<StudyPlanSession[]>("/planner");
}

export async function createStudySession(
  session: Pick<
    StudyPlanSession,
    "title" | "subject" | "scheduled_date" | "duration_minutes"
  >
): Promise<StudyPlanSession> {
  return apiRequest<StudyPlanSession>("/planner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}

export async function updateStudySessionStatus(
  sessionId: number,
  status: StudyPlanSession["status"]
): Promise<StudyPlanSession> {
  return apiRequest<StudyPlanSession>(`/planner/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function askDocumentQuestion(
  question: string,
  documentId?: number,
  conversationId?: number
): Promise<DocumentAnswer> {
  const response = await fetch(`${API_BASE_URL}/tutor/ask-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question,
      ...(documentId !== undefined ? { document_id: documentId } : {}),
      ...(conversationId !== undefined
        ? { conversation_id: conversationId }
        : {}),
    }),
  });

  return handleResponse<DocumentAnswer>(response);
}
