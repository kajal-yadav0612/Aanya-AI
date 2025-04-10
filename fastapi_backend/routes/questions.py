from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx
import json

router = APIRouter()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

class QuestionRequest(BaseModel):
    subject: str
    topic: str
    numQuestions: int

class ExplanationRequest(BaseModel):
    question: str
    answer: str

def generate_prompt(type_: str, subject: str, topic: str, num_questions: int) -> str:
    base = f"""Generate {num_questions} multiple-choice questions on the topic "{topic}" under the subject "{subject}".
Each question should have 4 options and ONLY one correct answer.
Respond ONLY in this JSON array format:
[
  {{
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct Option"
  }}
]"""
    return base

async def fetch_from_gemini(prompt: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                headers={"Content-Type": "application/json"},
                timeout=60.0  # Optional: increase timeout for longer responses
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        print(f"Gemini API HTTP error: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Gemini API")
    except Exception as e:
        print(f"Unexpected Gemini error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error from Gemini")

def clean_and_parse_json(raw_text: str):
    try:
        # Remove markdown fencing if present
        if raw_text.startswith("```"):
            raw_text = raw_text.strip("```json").strip("```").strip()

        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing failed: {e}")
        raise HTTPException(status_code=500, detail="Error parsing Gemini response")

@router.post("/generate-questions")
async def generate_questions(req: QuestionRequest):
    prompt = generate_prompt("assessment", req.subject, req.topic, req.numQuestions)
    data = await fetch_from_gemini(prompt)
    raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
    return {"questions": clean_and_parse_json(raw_text)}

@router.post("/generate-practice")
async def generate_practice(req: QuestionRequest):
    prompt = generate_prompt("practice", req.subject, req.topic, req.numQuestions)
    data = await fetch_from_gemini(prompt)
    raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
    return {"questions": clean_and_parse_json(raw_text)}

@router.post("/get-explanation")
async def get_explanation(req: ExplanationRequest):
    prompt = f"""
You are an expert tutor. Explain briefly and clearly why the following answer is correct.

Question: {req.question}
Answer: {req.answer}

Respond ONLY with a short plain-text explanation.
"""
    data = await fetch_from_gemini(prompt)
    raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.strip("```").strip()

    return {"explanation": raw_text}
