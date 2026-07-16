import os
import json
import requests
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import ProfilePayload
from typing import Dict, Any

router = APIRouter()


def fetch_github_profile(username: str) -> str:
    """
    Fetches real-time professional data and recent repositories from a user's GitHub profile.
    Call this tool ONLY when the user provides a GitHub username. 
    Use the returned data to automatically populate the 'projects' and 'skills' sections of their resume.
    """
    try:
        # 1. Fetch the basic user profile (Bio, Name, URL)
        user_url = f"https://api.github.com/users/{username}"
        user_response = requests.get(user_url, timeout=10)
        
        # If the user doesn't exist, return a clean error to the AI
        if user_response.status_code == 404:
            return f"Error: The GitHub username '{username}' does not exist. Ask the user to verify."
            
        user_response.raise_for_status()
        user_data = user_response.json()

        # 2. Fetch their most recently pushed repositories (Limit to 5 to save tokens)
        repos_url = f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=5"
        repos_response = requests.get(repos_url, timeout=10)
        repos_response.raise_for_status()
        repos_data = repos_response.json()

        # 3. Strip out the massive amount of unnecessary GitHub metadata
        projects = []
        for repo in repos_data:
            # Skip repositories that the user just forked from someone else
            if not repo.get('fork'): 
                projects.append({
                    "name": repo.get("name"),
                    "description": repo.get("description") or "No description provided.",
                    "primary_language": repo.get("language") or "Unknown",
                    "link": repo.get("html_url")
                })

        # 4. Package it into a clean JSON string for Gemini to read
        clean_profile = {
            "fullName": user_data.get("name") or username,
            "bio": user_data.get("bio") or "",
            "github_profile_link": user_data.get("html_url"),
            "recent_projects": projects
        }

        return json.dumps(clean_profile, indent=2)

    except requests.exceptions.RequestException as e:
        return f"Network Error fetching GitHub data: {str(e)}. Proceed without GitHub data."


@router.post("/api/tailor")
async def tailor_resume(payload: Dict[str, Any]):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server configuration.")
        
    user_data_string = json.dumps(payload, indent=2)
    
    prompt = f"""
    You are an elite executive resume writer specializing in passing Applicant Tracking Systems (ATS) and catching FAANG recruiter attention.
    
    NEW INSTRUCTION: If the user provided a GitHub username anywhere in their data, 
    you MUST call the `fetch_github_profile` tool. Use the projects returned by the tool 
    to enhance or add to the user's existing projects list.

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
    """
    
    models_to_try = [
        'gemini-2.5-flash-lite',
        'gemini-3.1-flash-lite'
    ]
    
    last_exception = None

    for model_name in models_to_try:
        try:
            print(f"Attempting Tailor with {model_name}...")
            
            # 1. Initialize the model with the tool
            model = genai.GenerativeModel(
                model_name=model_name,
                tools=[fetch_github_profile]
            )
            
            # 2. Start the autonomous chat session
            chat = model.start_chat(enable_automatic_function_calling=True)
            
            response = chat.send_message(
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