# StudyMate AI

StudyMate AI is a Next.js and FastAPI study assistant. The application uses
PostgreSQL through SQLAlchemy, Groq for generation, Pinecone for private
document-vector search, and Sentence Transformers for embeddings.

## Architecture

- `app/`, `components/`, and `lib/`: Next.js App Router, dashboard, study tools,
  and authenticated API client.
- `backend/app/api/routes/`: FastAPI routes for authentication, tutor chats,
  documents, study materials, analytics, and the study planner.
- `backend/app/db/models.py`: PostgreSQL persistence models.
- `backend/app/services/`: PDF extraction, embeddings, Pinecone retrieval,
  grounded answers, and study-material generation.
- `backend/tests/`: API tests using an isolated in-memory SQLite database.

PDFs are stored under `backend/data/documents/<user-id>/`. Extracted text
chunks are stored in PostgreSQL and vectors are stored in the existing
`studymate-ai` Pinecone index under a `user-<id>` namespace. The API checks
document ownership before study-material generation or document-specific
questions; retrieval searches only the authenticated user's namespace. Do not
expose stored file paths or Pinecone credentials to the frontend.

The backend creates missing SQLAlchemy tables at startup. The study-material,
quiz-attempt, and planner tables are additive; existing tables and rows are
not dropped or rewritten. This project does not currently use Alembic
migrations.

## Configuration

Create a root `.env` file (never commit it) with:

- `DATABASE_URL`: PostgreSQL SQLAlchemy connection URL.
- `JWT_SECRET_KEY`: signing key for bearer tokens.
- `GROQ_API_KEY`: Groq API key for AI generation.
- `PINECONE_API_KEY`: Pinecone API key for PDF vector indexing/search.
- `NEXT_PUBLIC_API_BASE_URL`: FastAPI URL used by the browser; defaults to
  `http://127.0.0.1:8000`.

The default Pinecone index is `studymate-ai` and must have 384-dimensional
vectors to match `sentence-transformers/all-MiniLM-L6-v2`.

## Run locally

Install frontend dependencies and start Next.js:

```powershell
npm install
npm run dev
```

Install backend dependencies and run FastAPI from the backend directory:

```powershell
Set-Location backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The frontend is available at `http://localhost:3000`; the API is available at
`http://127.0.0.1:8000`.

## Features

- Upload and process text-based PDFs, list your own documents, and ask
  document-grounded questions with filename/page citations.
- Create and save document-grounded summaries, notes, explanations, quizzes,
  and flashcards.
- Submit quiz results to track topic strengths, revision needs, and
  recommendations.
- Save study sessions, mark completed sessions, and prioritize topics needing
  revision in the planner.
- Continue to use the general AI tutor, saved conversations, and editable
  learning statistics.

## Validation

Frontend checks:

```powershell
npm run typecheck
npm run lint
```

Backend tests use a fresh in-memory SQLite database and do not connect to or
delete data from PostgreSQL:

```powershell
Set-Location backend
python -m pip install -r requirements-dev.txt
python -m pytest tests -q
```
