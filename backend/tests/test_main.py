
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
