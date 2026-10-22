from functools import lru_cache

MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L3-v2"
EMBEDDING_BATCH_SIZE = 4

@lru_cache(maxsize=1)
def get_embedding_model():
    """Load and cache the smaller embedding model."""
    import torch
    from sentence_transformers import SentenceTransformer

    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)

    return SentenceTransformer(MODEL_NAME)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate normalized embeddings in small batches."""
    if not texts:
        return []

    model = get_embedding_model()
    vectors = []

    for start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch = texts[start : start + EMBEDDING_BATCH_SIZE]

        batch_vectors = model.encode(
            batch,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=EMBEDDING_BATCH_SIZE,
            convert_to_numpy=True,
        )

        vectors.extend(batch_vectors.tolist())

    return vectors


def embed_query(text: str) -> list[float]:
    """Embed one query using the same model as document indexing."""
    return embed_texts([text])[0]
