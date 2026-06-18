import os
import json
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import CritiquePayload

router = APIRouter()

@router.post("/api/critique")
async def critique_resume(payload: CritiquePayload):
    if not os.environ.get("Gemini_API_Key"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    user_data_string = json.dumps(payload.profile, indent=2)
    target_job_string = json.dumps(payload.profile.get("target", {}), indent=2)
    
    prompt = f"""
    You are a ruthless but highly constructive FAANG technical recruiter and Applicant Tracking System (ATS) auditor.
    Review the candidate's raw profile data and their generated LaTeX document against their target job.
    
    YOUR OBJECTIVE:
    1. Identify exactly 3 to 5 highly specific, actionable improvements to make this resume stand out more to recruiters for this specific role. Look for missing keywords, weak action verbs, contextless metrics, or formatting issues.
    2. Make an autonomous routing decision:
       - If the resume is missing major keywords or needs significant structural changes, set the 'decision' to "REJECT".
       - If the resume is strong and only needs minor LaTeX/formatting revisions, set the 'decision' to "APPROVE".
    
    Target Job Details:
    {target_job_string}
    
    Raw Profile Data:
    {user_data_string}
    
    Current LaTeX Draft:
    {payload.latex_string}
    """
    
    # Define the strict schema to force the agent's decision
    decision_schema = {
        "type": "object",
        "properties": {
            "decision": {
                "type": "string",
                "enum": ["APPROVE", "REJECT"] # The model MUST choose one of these
            },
            "improvements": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        "required": ["decision", "improvements"]
    }
    
    models_to_try = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite'
    ]
    
    last_exception = None

    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=decision_schema, # Pass the schema here!
                    temperature=0.4 
                )
            )
            # This will now safely return {"decision": "APPROVE/REJECT", "improvements": [...]}
            return json.loads(response.text) 
        except Exception as e:
            last_exception = e

    if isinstance(last_exception, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="All fallback models failed to return a valid JSON array.")
    else:
        raise HTTPException(status_code=500, detail=f"Critique Generation Error: {str(last_exception)}")