import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

# Load environment variables from the .env file FIRST
load_dotenv()

# Import all of your refactored routers
from api.routes import tailor, latex, critique, revise, pdf

# Initialize FastAPI App
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global API Key Configuration
# Switched to ALL CAPS to match standard .env conventions
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Plug in the modular routes
app.include_router(tailor.router)
app.include_router(latex.router)
app.include_router(critique.router)
app.include_router(revise.router)
app.include_router(pdf.router)