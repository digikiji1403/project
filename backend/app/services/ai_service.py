import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing from the project .env file.")
    return ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.2,
        api_key=api_key,
    )

def ask_tutor(question: str) -> str:
    """Generate an educational response to a student's question."""
    response = get_llm().invoke(
        [
            (
                "system",
                "You are StudyMate AI, a helpful educational tutor. "
                "Explain concepts clearly, use examples when useful, "
                "and help students understand rather than just memorize. "
                "If you are unsure of a fact, say so.",
            ),
            ("human", question),
        ]
    )

    return str(response.content)
