
from pathlib import Path

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session


MAX_PAGES = 500
DATABASE_INSERT_BATCH_SIZE = 100


def extract_and_chunk_pdf(
    pdf_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> dict:
    """Extract PDF text page by page and split it into chunks."""

    path = Path(pdf_path)

    if not path.is_file():
        raise FileNotFoundError("PDF file not found.")

    reader = PdfReader(str(path), strict=False)

    if reader.is_encrypted:
        raise ValueError("Encrypted PDFs are not supported.")

    page_count = len(reader.pages)

    if page_count > MAX_PAGES:
        raise ValueError(f"PDF exceeds the {MAX_PAGES}-page limit.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        add_start_index=True,
    )

    chunks = []
    extracted_page_count = 0

    # Process one page at a time instead of retaining all page text.
    for page_number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()

        if not text:
            continue

        extracted_page_count += 1

        page_chunks = splitter.create_documents(
            [text],
            metadatas=[{"page_number": page_number}],
        )

        for chunk in page_chunks:
            chunks.append(
                {
                    "text": chunk.page_content,
                    "page_number": chunk.metadata["page_number"],
                    "start_index": chunk.metadata["start_index"],
                }
            )

        # Release references to this page's extracted text and chunks.
        del page_chunks
        del text

    if not chunks:
        raise ValueError(
            "No extractable text was found. "
            "The PDF may contain scanned images."
        )

    return {
        "page_count": page_count,
        "extracted_page_count": extracted_page_count,
        "chunk_count": len(chunks),
        "chunks": chunks,
    }


def save_document_chunks(
    db: Session,
    document_id: int,
    chunks: list[dict],
) -> int:
    """Save document chunks to PostgreSQL in smaller batches."""

    from app.db.models import DocumentChunk

    saved_count = 0

    for start in range(0, len(chunks), DATABASE_INSERT_BATCH_SIZE):
        batch = chunks[
            start : start + DATABASE_INSERT_BATCH_SIZE
        ]

        records = [
            DocumentChunk(
                document_id=document_id,
                chunk_index=start + offset,
                page_number=chunk["page_number"],
                start_index=chunk["start_index"],
                content=chunk["text"],
            )
            for offset, chunk in enumerate(batch)
        ]

        if records:
            db.add_all(records)
            db.flush()
            saved_count += len(records)

        # Avoid retaining unnecessary references to inserted objects.


    return saved_count
