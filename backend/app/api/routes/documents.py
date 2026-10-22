
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.routes.stats import get_db
from app.core.security import get_current_user
from app.db.models import Document, User
from app.services.document_service import (
    extract_and_chunk_pdf,
    save_document_chunks,
)
from app.services.embedding_service import embed_texts
from app.services.pinecone_service import (
    get_pinecone_index,
    store_document_chunks,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = BACKEND_DIR / "data" / "documents"

MAX_FILE_SIZE = 10 * 1024 * 1024
READ_CHUNK_SIZE = 1024 * 1024


@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List only the authenticated user's uploaded documents."""
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        {
            "id": document.id,
            "filename": document.filename,
            "file_size": document.file_size,
            "page_count": document.page_count,
            "status": document.status,
            "created_at": document.created_at,
        }
        for document in documents
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF, process it, and index its text for RAG."""

    original_name = Path(file.filename or "").name

    if not original_name or Path(original_name).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed.",
        )

    if file.content_type not in (
        "application/pdf",
        "application/octet-stream",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Please upload a PDF.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    user_dir = UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    destination = user_dir / f"{uuid.uuid4().hex}.pdf"
    total_size = 0
    header = b""

    # Stage 1: Save and validate the uploaded file.
    try:
        with destination.open("xb") as output:
            while True:
                data = file.file.read(READ_CHUNK_SIZE)

                if not data:
                    break

                if not header:
                    header = data[:5]

                total_size += len(data)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="PDF must be 10 MB or smaller.",
                    )

                output.write(data)

        if header != b"%PDF-":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is not a valid PDF file.",
            )

    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    except Exception as exc:
        destination.unlink(missing_ok=True)
        logger.exception("Failed to save uploaded PDF")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the uploaded PDF.",
        ) from exc

    finally:
        file.file.close()

    # Stage 2: Create the database record before processing.
    document = Document(
        user_id=current_user.id,
        filename=original_name,
        storage_path=str(destination.resolve()),
        content_type="application/pdf",
        file_size=total_size,
        status="processing",
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception as exc:
        db.rollback()
        destination.unlink(missing_ok=True)
        logger.exception("Failed to create document record")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save document metadata.",
        ) from exc

    # Stage 3: Extract, embed, and index the document.
    try:
        extracted = extract_and_chunk_pdf(str(destination))

        chunks = [
            {**chunk, "chunk_index": index}
            for index, chunk in enumerate(extracted["chunks"])
        ]

        embeddings = embed_texts(
            [chunk["text"] for chunk in chunks]
        )

        # Store vectors in Pinecone.
        store_document_chunks(
            user_id=current_user.id,
            document_id=document.id,
            filename=document.filename,
            chunks=chunks,
            embeddings=embeddings,
        )

        # Store text chunks in PostgreSQL.
        save_document_chunks(
            db=db,
            document_id=document.id,
            chunks=chunks,
        )

        document.page_count = extracted["page_count"]
        document.status = "ready"
        document.error_message = None

        db.commit()
        db.refresh(document)

        return {
            "id": document.id,
            "filename": document.filename,
            "file_size": document.file_size,
            "page_count": document.page_count,
            "chunk_count": len(chunks),
            "status": document.status,
            "created_at": document.created_at,
        }

    except Exception as exc:
        db.rollback()
        logger.exception(
            "Document processing failed for document %s",
            document.id,
        )

        # Remove any partially indexed vectors for this document.
        try:
            get_pinecone_index().delete(
                filter={"document_id": {"$eq": document.id}},
                namespace=f"user-{current_user.id}",
            )
        except Exception:
            logger.exception(
                "Failed to clean up Pinecone vectors for document %s",
                document.id,
            )

        try:
            document.status = "failed"
            document.error_message = (
                "Document processing failed. Please try uploading it again."
            )
            db.commit()
        except Exception:
            db.rollback()
            logger.exception(
                "Failed to update document status for document %s",
                document.id,
            )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "The PDF was uploaded, but processing failed. "
                "Check that it contains extractable text and try again."
            ),
        ) from exc
