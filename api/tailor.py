import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai

# Initialize FastAPI App
app = FastAPI()

# Enable CORS so your Lovable frontend can talk to it seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API Key
GEMINI_API_KEY = os.environ.get("Gemini_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ==========================================
# 1. MATCH THE FRONTEND INCOMING PAYLOAD
# ==========================================
class Personal(BaseModel):
    fullName: str
    email: str
    phone: str
    location: str
    website: Optional[str] = ""

class EducationItem(BaseModel):
    id: str
    school: str
    degree: str
    field: str
    startDate: str
    endDate: str
    details: Optional[str] = ""

class ExperienceItem(BaseModel):
    id: str
    company: str
    role: str
    location: str
    startDate: str
    endDate: str
    bullets: str # Lovable formats bullets as a newline-separated string (\n)

class ProjectItem(BaseModel):
    id: str
    name: str
    stack: str
    link: Optional[str] = ""
    description: str

class CertificateItem(BaseModel):
    id: str
    name: str
    issuer: str
    date: str
    link: Optional[str] = ""

class PublicationItem(BaseModel):
    id: str
    title: str
    venue: str
    date: str
    link: Optional[str] = ""
    description: Optional[str] = ""

class TargetJob(BaseModel):
    company: str
    role: str
    jobDescription: str

class ProfilePayload(BaseModel):
    personal: Personal
    narrative: str
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    skills: List[str] = []
    certificates: List[CertificateItem] = []
    publications: List[PublicationItem] = []
    target: TargetJob


# ==========================================
# 2. DEFINE THE BACKEND AI EXECUTION ROUTE
# ==========================================
@app.post("/api/tailor")
async def tailor_resume(payload: ProfilePayload):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server configuration.")
        
    try:
        # Use Gemini 1.5 Flash for rapid text transformation cycles
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        
        # Serialize incoming payload back to a clean JSON string for the prompt
        user_data_string = json.dumps(payload.dict(), indent=2)
        
        # System instructions engineered for high-impact professional metrics
        prompt = f"""
        You are an elite executive resume writer specializing in passing Applicant Tracking Systems (ATS) and catching FAANG recruiter attention.
        
        Your objective is to optimize and rewrite the provided resume JSON data to tailor it specifically for the following target position:
        - Target Company: {payload.target.company if payload.target.company else 'Generic Tech Company'}
        - Target Role: {payload.target.role if payload.target.role else 'Software Engineer'}
        
        Target Job Description to extract keywords from:
        \"\"\"{payload.target.jobDescription}\"\"\"

        CRITICAL REWRITING INSTRUCTIONS:
        1. **The Narrative / Summary**: Rewrite it into a 2-3 sentence powerhouse summary emphasizing years of experience, core technical masteries, and specific value relevant to the target job description. 
        2. **Experience Bullets**: Rewrite the 'bullets' block of each experience item. Use Google's structural X-Y-Z resume formula: "Accomplished [X] as measured by [Y], by doing [Z]". Use aggressive, dynamic action verbs (e.g., Architected, Optimized, Pioneered). Infuse hard numerical metrics wherever logically possible.
        3. **Project Descriptions**: Rewrite the project descriptions to read like high-impact corporate shipping metrics instead of passive hobby descriptions.
        4. **Keyword Matching**: Naturally weave in technical terms, frameworks, soft skills, and specific tools mentioned in the target job description.
        5. **Strict Constraint**: Do not change names, dates, companies, urls, ids, or school names. Do not invent completely fake positions. Maintain the exact JSON key layout.
        
        Return your response ONLY as a valid, parsable JSON object matching the input data structure. Do not wrap it in markdown code blocks (` ```json `), just raw JSON.

        Input Data to Modify:
        {user_data_string}
        """
        
        # We enforce JSON output structure directly from Gemini
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        
        # Parse the AI response string safely back into a native Python dict
        tailored_data = json.loads(response.text)
        return tailored_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid or malformed JSON syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Processing Error: {str(e)}")