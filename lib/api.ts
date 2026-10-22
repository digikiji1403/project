
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
