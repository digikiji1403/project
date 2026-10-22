import os 

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from pathlib import Path

#Load the projects root .env file 
PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

#read the api key without exposing it :
GROQ_API_KEY= os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing.check the project root .env file."
    )


#initialize the language model 
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.2,
    api_key=GROQ_API_KEY,
)

def ask_tutor(question: str) -> str:
    """Generate an educational response to a student's question."""
    response = llm.invoke(
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
