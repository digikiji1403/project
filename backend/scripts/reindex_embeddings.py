
import os
import sys

# Allow imports from the backend application.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from app.db.database import SessionLocal
from app.db.models import Document, DocumentChunk
from app.services.embedding_service import embed_texts
from app.services.pinecone_service import store_document_chunks


def main():
    db = SessionLocal()

    try:
        documents = (
            db.query(Document)
            .filter(Document.status == "ready")
            .all()
        )

        if not documents:
            print("No ready documents found.")
            return

        print(f"Found {len(documents)} ready document(s).")

        for document in documents:
            chunks = (
                db.query(DocumentChunk)
                .filter(DocumentChunk.document_id == document.id)
                .order_by(DocumentChunk.chunk_index)
                .all()
            )

            if not chunks:
                print(f"Skipping document {document.id}: no chunks.")
                continue

            chunk_data = [
                {
                    "chunk_index": chunk.chunk_index,
                    "page_number": chunk.page_number,
                    "start_index": chunk.start_index,
                    "text": chunk.content,
                }
                for chunk in chunks
            ]

            print(
                f"Document {document.id}: "
                f"{len(chunk_data)} chunks. Generating embeddings..."
            )

            embeddings = embed_texts(
                [chunk["text"] for chunk in chunk_data]
            )

            print("Upserting vectors into Pinecone...")

            count = store_document_chunks(
                user_id=document.user_id,
                document_id=document.id,
                filename=document.filename,
                chunks=chunk_data,
                embeddings=embeddings,
            )

            print(f"Document {document.id}: re-indexed {count} vectors.")

        print("Re-indexing completed successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
