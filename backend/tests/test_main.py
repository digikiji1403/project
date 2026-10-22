
def test_health_check(test_client):
    response = test_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "studymate-api",
    }


def test_learning_stats(test_client):
    # The test database starts with no statistics record.
    response = test_client.get("/stats")

    assert response.status_code == 404


def test_update_learning_stats(test_client):
    payload = {
        "lessons_completed": 18,
        "study_hours": 12.5,
        "quiz_average": 92,
    }

    response = test_client.put("/stats", json=payload)

    assert response.status_code == 200
    assert response.json() == payload

    # Confirm that the saved record can be retrieved.
    get_response = test_client.get("/stats")

    assert get_response.status_code == 200
    assert get_response.json() == payload


def test_reject_invalid_quiz_average(test_client):
    payload = {
        "lessons_completed": 18,
        "study_hours": 12.5,
        "quiz_average": 150,
    }

    response = test_client.put("/stats", json=payload)

    assert response.status_code == 422


def test_ai_tutor_returns_answer(test_client, monkeypatch):
    from app.api.routes import tutor

    # Mock the AI call to avoid making a real Groq API request.
    def fake_ask_tutor(question: str) -> str:
        assert question == "Explain photosynthesis."
        return "Photosynthesis is how plants make food using sunlight."

    monkeypatch.setattr(tutor, "ask_tutor", fake_ask_tutor)

    response = test_client.post(
        "/tutor/ask",
        json={"question": "Explain photosynthesis."},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["answer"] == (
        "Photosynthesis is how plants make food using sunlight."
    )
    assert isinstance(data["conversation_id"], int)


def test_ai_tutor_rejects_empty_question(test_client):
    response = test_client.post(
        "/tutor/ask",
        json={"question": ""},
    )

    assert response.status_code == 422


def test_create_conversation(test_client):
    response = test_client.post(
        "/conversations",
        json={"title": "Python Basics"},
    )

    assert response.status_code == 201

    data = response.json()
    assert data["title"] == "Python Basics"
    assert isinstance(data["id"], int)
    assert "created_at" in data
    assert "updated_at" in data


def test_list_conversations(test_client):
    test_client.post(
        "/conversations",
        json={"title": "Python Basics"},
    )
    test_client.post(
        "/conversations",
        json={"title": "Machine Learning"},
    )

    response = test_client.get("/conversations")

    assert response.status_code == 200

    conversations = response.json()
    assert len(conversations) == 2
    assert {item["title"] for item in conversations} == {
        "Python Basics",
        "Machine Learning",
    }


def test_get_conversation_history(test_client, monkeypatch):
    from app.api.routes import tutor

    # Mock the AI so the test never calls the real Groq API.
    monkeypatch.setattr(
        tutor,
        "ask_tutor",
        lambda question: (
            "Photosynthesis uses sunlight to make food."
        ),
    )

    # Create a conversation.
    create_response = test_client.post(
        "/conversations",
        json={"title": "Biology revision"},
    )

    assert create_response.status_code == 201
    conversation_id = create_response.json()["id"]

    # Send a question and save the question-answer exchange.
    chat_response = test_client.post(
        "/tutor/ask",
        json={
            "question": "What is photosynthesis?",
            "conversation_id": conversation_id,
        },
    )

    assert chat_response.status_code == 200
    assert chat_response.json()["conversation_id"] == conversation_id

    # Retrieve the conversation and its saved messages.
    history_response = test_client.get(
        f"/conversations/{conversation_id}"
    )

    assert history_response.status_code == 200

    history = history_response.json()
    assert history["id"] == conversation_id
    assert history["title"] == "Biology revision"
    assert len(history["messages"]) == 2

    assert history["messages"][0]["role"] == "user"
    assert history["messages"][0]["content"] == (
        "What is photosynthesis?"
    )

    assert history["messages"][1]["role"] == "assistant"
    assert history["messages"][1]["content"] == (
        "Photosynthesis uses sunlight to make food."
    )


def test_document_list_is_limited_to_the_current_user(test_client):
    from app.db.models import Document, User

    factory = test_client.test_session_factory
    with factory() as db:
        other_user = User(
            email="other@example.com",
            full_name="Other Student",
            hashed_password="test-password-hash",
            is_active=True,
        )
        db.add(other_user)
        db.flush()
        db.add_all(
            [
                Document(
                    user_id=1,
                    filename="mine.pdf",
                    storage_path="private/mine.pdf",
                    file_size=100,
                    status="ready",
                    page_count=2,
                ),
                Document(
                    user_id=other_user.id,
                    filename="theirs.pdf",
                    storage_path="private/theirs.pdf",
                    file_size=100,
                    status="ready",
                    page_count=2,
                ),
            ]
        )
        db.commit()

    response = test_client.get("/documents")

    assert response.status_code == 200
    assert [item["filename"] for item in response.json()] == ["mine.pdf"]
    assert "storage_path" not in response.json()[0]


def test_generate_saved_material_and_record_quiz_analytics(
    test_client,
    monkeypatch,
):
    from app.api.routes import study
    from app.db.models import Document, DocumentChunk

    factory = test_client.test_session_factory
    with factory() as db:
        document = Document(
            user_id=1,
            filename="biology.pdf",
            storage_path="private/biology.pdf",
            file_size=100,
            status="ready",
            page_count=1,
        )
        db.add(document)
        db.flush()
        document_id = document.id
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_index=0,
                page_number=1,
                start_index=0,
                content="Mitochondria produce ATP through cellular respiration.",
            )
        )
        db.commit()

    monkeypatch.setattr(
        study,
        "generate_material",
        lambda document, chunks, kind, topic: [
            {
                "question": "What do mitochondria produce?",
                "choices": ["ATP", "DNA", "Glucose", "Water"],
                "answer": "ATP",
                "explanation": "Cellular respiration produces ATP.",
            }
            for _ in range(5)
        ],
    )
    response = test_client.post(
        "/study/materials",
        json={"document_id": document_id, "kind": "quiz"},
    )

    assert response.status_code == 201
    material = response.json()
    assert material["kind"] == "quiz"
    assert material["content"][0]["answer"] == "ATP"
    assert test_client.get("/study/materials?kind=quiz").json()[0]["id"] == material["id"]

    attempt = test_client.post(
        "/study/quiz-attempts",
        json={
            "material_id": material["id"],
            "answers": ["ATP", "", "", "", ""],
        },
    )
    assert attempt.status_code == 201
    assert attempt.json()["topic"] == "biology"
    analytics = test_client.get("/analytics")
    assert analytics.status_code == 200
    assert analytics.json()["quiz_average"] == 20
    assert analytics.json()["weaknesses"]


def test_study_material_generation_rejects_another_users_document(test_client):
    from app.db.models import Document, User

    factory = test_client.test_session_factory
    with factory() as db:
        other_user = User(
            email="owner@example.com",
            full_name="Document Owner",
            hashed_password="test-password-hash",
            is_active=True,
        )
        db.add(other_user)
        db.flush()
        document = Document(
            user_id=other_user.id,
            filename="private.pdf",
            storage_path="private/private.pdf",
            file_size=100,
            status="ready",
            page_count=1,
        )
        db.add(document)
        db.commit()
        document_id = document.id

    response = test_client.post(
        "/study/materials",
        json={"document_id": document_id, "kind": "summary"},
    )
    assert response.status_code == 404


def test_document_question_rejects_another_users_document(
    test_client,
    monkeypatch,
):
    from app.db.models import Document, User

    factory = test_client.test_session_factory
    with factory() as db:
        other_user = User(
            email="private-owner@example.com",
            full_name="Private Owner",
            hashed_password="test-password-hash",
            is_active=True,
        )
        db.add(other_user)
        db.flush()
        document = Document(
            user_id=other_user.id,
            filename="private.pdf",
            storage_path="private/private.pdf",
            file_size=100,
            status="ready",
            page_count=1,
        )
        db.add(document)
        db.commit()
        document_id = document.id

    from app.api.routes import tutor

    monkeypatch.setattr(
        tutor,
        "answer_document_question",
        lambda **_kwargs: pytest.fail("Must not retrieve another user's PDF."),
    )
    response = test_client.post(
        "/tutor/ask-document",
        json={
            "question": "What is in this PDF?",
            "document_id": document_id,
        },
    )
    assert response.status_code == 404


def test_planner_sessions_are_persisted_and_owner_scoped(test_client):
    response = test_client.post(
        "/planner",
        json={
            "title": "Review cell biology",
            "subject": "Biology",
            "scheduled_date": "2026-11-01",
            "duration_minutes": 45,
        },
    )

    assert response.status_code == 201
    session = response.json()
    assert session["status"] == "planned"

    updated = test_client.patch(
        f"/planner/{session['id']}",
        json={"status": "completed"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "completed"

    assert test_client.get("/planner").json()[0]["id"] == session["id"]
