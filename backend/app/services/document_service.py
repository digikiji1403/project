
from pathlib import Path

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter


MAX_PAGES = 500


def extract_and_chunk_pdf(
    pdf_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> dict:
    """Extract text from a PDF and split it into overlapping chunks."""

    path = Path(pdf_path)

    if not path.is_file():
        raise FileNotFoundError("PDF file not found.")

    reader = PdfReader(str(path))

    if reader.is_encrypted:
        raise ValueError("Encrypted PDFs are not supported.")

    if len(reader.pages) > MAX_PAGES:
        raise ValueError(f"PDF exceeds the {MAX_PAGES}-page limit.")

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()

        if text:
            pages.append(
                {
                    "page_number": page_number,
                    "text": text,
                }
            )

    if not pages:
        raise ValueError(
            "No extractable text was found. The PDF may contain scanned images."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        add_start_index=True,
    )

    chunks = []

    for page in pages:
        for chunk in splitter.create_documents(
            [page["text"]],
            metadatas=[{"page_number": page["page_number"]}],
        ):
            chunks.append(
                {
                    "text": chunk.page_content,
                    "page_number": chunk.metadata["page_number"],
                    "start_index": chunk.metadata["start_index"],
                }
            )

    return {
        "page_count": len(reader.pages),
        "extracted_page_count": len(pages),
        "chunk_count": len(chunks),
        "chunks": chunks,
    }


def save_document_chunks(
    db,
    document_id: int,
    chunks: list[dict],
) -> int:
    """Save extracted document chunks to PostgreSQL."""

    from app.db.models import DocumentChunk

    records = [
        DocumentChunk(
            document_id=document_id,
            chunk_index=index,
            page_number=chunk["page_number"],
            start_index=chunk["start_index"],
            content=chunk["text"],
        )
        for index, chunk in enumerate(chunks)
    ]

    if records:
        db.add_all(records)
        db.flush()

    return len(records)
