from io import BytesIO

import pytest


def test_reject_non_pdf_upload(test_client):
    response = test_client.post(
        "/documents",
        files={"file": ("notes.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are allowed."


def test_reject_invalid_pdf_signature(test_client, monkeypatch, tmp_path):
    from app.api.routes import documents

    monkeypatch.setattr(documents, "UPLOAD_DIR", tmp_path)

    response = test_client.post(
        "/documents",
        files={"file": ("invalid.pdf", b"not a PDF", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "The uploaded file is not a valid PDF file."


def test_successful_pdf_upload(test_client, monkeypatch, tmp_path):
    from app.api.routes import documents

    monkeypatch.setattr(documents, "UPLOAD_DIR", tmp_path)

    monkeypatch.setattr(
        documents,
        "extract_and_chunk_pdf",
        lambda _path: {
            "page_count": 1,
            "extracted_page_count": 1,
            "chunk_count": 1,
            "chunks": [
                {
                    "text": "Test document content.",
                    "page_number": 1,
                    "start_index": 0,
                }
            ],
        },
    )

    monkeypatch.setattr(
        documents,
        "embed_texts",
        lambda texts: [[0.1] * 384 for _ in texts],
    )

    monkeypatch.setattr(
        documents,
        "store_document_chunks",
        lambda **kwargs: len(kwargs["chunks"]),
    )

    monkeypatch.setattr(
        documents,
        "save_document_chunks",
        lambda **kwargs: len(kwargs["chunks"]),
    )

    response = test_client.post(
        "/documents",
        files={
            "file": (
                "sample.pdf",
                b"%PDF-1.4\nmock PDF content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "sample.pdf"
    assert data["status"] == "ready"
    assert data["page_count"] == 1
    assert data["chunk_count"] == 1

    listed = test_client.get("/documents")
    assert listed.status_code == 200
    assert any(item["id"] == data["id"] for item in listed.json())


def test_processing_failure_marks_document_failed(
    test_client, monkeypatch, tmp_path
):
    from app.api.routes import documents

    monkeypatch.setattr(documents, "UPLOAD_DIR", tmp_path)

    monkeypatch.setattr(
        documents,
        "extract_and_chunk_pdf",
        lambda _path: (_ for _ in ()).throw(
            ValueError("Mock PDF processing failure")
        ),
    )

    monkeypatch.setattr(
        documents,
        "get_pinecone_index",
        lambda: type(
            "FakeIndex",
            (),
            {"delete": lambda self, **kwargs: None},
        )(),
    )

    response = test_client.post(
        "/documents",
        files={
            "file": (
                "broken.pdf",
                b"%PDF-1.4\nmock PDF content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 422

    listed = test_client.get("/documents")
    assert listed.status_code == 200

    failed = [
        item for item in listed.json()
        if item["filename"] == "broken.pdf"
    ]
    assert len(failed) == 1
    assert failed[0]["status"] == "failed"
