from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Exact origin of your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[{request.method}] {request.url}")
    return await call_next(request)

# Optional root route to test if FastAPI works
@app.get("/")
def root():
    return {"message": "FastAPI is running"}

#  Import routes (MUST be after app = FastAPI())
from routes.questions import router as questions_router
app.include_router(questions_router, prefix="/api/questions")
