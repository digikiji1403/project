
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pinecone import Pinecone


PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

INDEX_NAME = "studymate-ai"
EMBEDDING_DIMENSION = 384


@lru_cache(maxsize=1)
def get_pinecone_index():
    """Connect to the StudyMate AI Pinecone index once."""
    api_key = os.getenv("PINECONE_API_KEY")

    if not api_key:
        raise RuntimeError(
            "PINECONE_API_KEY is missing from the project .env file."
        )

    client = Pinecone(api_key=api_key)
    return client.Index(INDEX_NAME)


def get_index_stats() -> dict:
    """Return vector database statistics."""
    return get_pinecone_index().describe_index_stats()


def store_document_chunks(
    user_id: int,
    document_id: int,
    filename: str,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> int:
    """Store embedded chunks in the namespace belonging to one user."""

    if len(chunks) != len(embeddings):
        raise ValueError("Each document chunk must have one embedding.")

    if not chunks:
        return 0

    index = get_pinecone_index()
    namespace = f"user-{user_id}"
    vectors = []

    for chunk, embedding in zip(chunks, embeddings):
        if len(embedding) != EMBEDDING_DIMENSION:
            raise ValueError("Embedding must contain exactly 384 dimensions.")

        vector_id = f"doc-{document_id}-chunk-{chunk['chunk_index']}"

        vectors.append(
            {
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "user_id": user_id,
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": chunk["page_number"],
                    "start_index": chunk["start_index"],
                    "text": chunk["text"],
                },
            }
        )

    # Upsert in batches to keep requests manageable.
    for start in range(0, len(vectors), 100):
        index.upsert(
            vectors=vectors[start : start + 100],
            namespace=namespace,
        )

    return len(vectors)


def search_document_chunks(
    user_id: int,
    query_embedding: list[float],
    top_k: int = 5,
    document_id: int | None = None,
) -> list[dict]:
    """Retrieve relevant chunks only from the current user's namespace."""

    if len(query_embedding) != EMBEDDING_DIMENSION:
        raise ValueError("Query embedding must contain exactly 384 dimensions.")

    if not 1 <= top_k <= 20:
        raise ValueError("top_k must be between 1 and 20.")

    query_options = {
        "vector": query_embedding,
        "top_k": top_k,
        "namespace": f"user-{user_id}",
        "include_metadata": True,
    }

    if document_id is not None:
        query_options["filter"] = {"document_id": {"$eq": document_id}}

    response = get_pinecone_index().query(**query_options)

    results = []

    for match in response.matches:
        metadata = match.metadata or {}

        results.append(
            {
                "score": match.score,
                "document_id": metadata.get("document_id"),
                "filename": metadata.get("filename"),
                "page_number": metadata.get("page_number"),
                "start_index": metadata.get("start_index"),
                "text": metadata.get("text"),
            }
        )

    return results
