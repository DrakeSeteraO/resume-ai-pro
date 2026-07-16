import os
import json
import re
import requests
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from typing import Dict, Any

router = APIRouter()

# Keep your fetch_github_profile function exactly as it is here
def fetch_github_profile(username: str) -> str:
    # ... (Your existing function code remains unchanged) ...
    pass 

@router.post("/api/tailor")
async def tailor_resume(payload: Dict[str, Any]):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server configuration.")
        
    user_data_string = json.dumps(payload, indent=2)
    
    # 1. PRE-FETCH: Search the raw JSON for a GitHub URL
    github_context = ""
    github_match = re.search(r'github\.com/([^/"\s\\]+)', user_data_string, re.IGNORECASE)
    
    if github_match:
        username = github_match.group(1)
        print(f"GitHub profile detected for '{username}'. Pre-fetching data...")
        # Call the function directly in Python
        fetched_data = fetch_github_profile(username)
        github_context = f"\nAdditional GitHub Data (Use this to enhance projects/skills):\n{fetched_data}\n"
    
    # 2. Inject the pre-fetched data directly into the prompt
    prompt = f"""
    You are an elite executive resume writer specializing in passing Applicant Tracking Systems (ATS) and catching FAANG recruiter attention.
    
    CRITICAL REWRITING INSTRUCTIONS:
    1. Make all of the writing sound like a human made it. All of your modifications to the data should be expertly worded to sound amazing on a resume.
    2. The Narrative / Summary: Rewrite it into a 2-3 sentence powerhouse summary emphasizing years of experience, core technical masteries, and specific value relevant to the target job description. 
    3. Experience Bullets: Rewrite the 'bullets' block of each experience item. Use Google's structural X-Y-Z resume formula: "Accomplished [X] as measured by [Y], by doing [Z]". Use aggressive, dynamic action verbs. Infuse hard numerical metrics wherever logically possible.
    4. Project Descriptions: Rewrite the project descriptions to read like high-impact corporate shipping metrics instead of passive hobby descriptions.
    5. Keyword Matching: Naturally weave in technical terms, frameworks, soft skills, and specific tools mentioned in the target job description.
    6. Strict Constraint: Do not change names, dates, companies, urls, ids, or school names. Do not invent completely fake positions. Maintain the exact JSON key layout.
    
    Return your response ONLY as a valid, parsable JSON object. Do not wrap it in markdown code blocks.

    Input Data to Modify:
    {user_data_string}
    {github_context}
    """
    
    models_to_try = [
        'gemini-2.5-flash-lite',
        'gemini-3.1-flash-lite'
    ]
    
    last_exception = None

    for model_name in models_to_try:
        try:
            print(f"Attempting Tailor with {model_name}...")
            
            # Initialize without tools
            model = genai.GenerativeModel(model_name=model_name)
            
            # Single API request
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            
            print(f"Success using {model_name}!")
            return json.loads(response.text)

        except Exception as e:
            print(f"Tailor model {model_name} failed: {str(e)}")
            last_exception = e

    if isinstance(last_exception, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="All fallback models failed to return valid JSON.")
    else:
        raise HTTPException(status_code=500, detail=f"Tailor Pipeline Error (All models failed): {str(last_exception)}")