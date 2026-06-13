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
    target_job_string = json.dumps(payload.profile.target.dict(), indent=2)
    
    prompt = f"""
    You are a ruthless but highly constructive FAANG technical recruiter and Applicant Tracking System (ATS) auditor.
    Review the candidate's raw profile data and their generated LaTeX document against their target job.
    
    YOUR OBJECTIVE:
    Identify exactly 3 to 5 highly specific, actionable improvements to make this resume stand out more to recruiters for this specific role.
    Look for:
    - Missing high-value keywords from the target job description.
    - Weak action verbs that could be stronger.
    - Metrics that lack context.
    - Formatting issues in the LaTeX that might hide important skills.
    
    Return ONLY a valid JSON array of strings containing your specific instructions. Do not wrap it in markdown code blocks.
    
    Target Job Details:
    {target_job_string}
    
    Raw Profile Data:
    {user_data_string}
    
    Current LaTeX Draft:
    {payload.latex_string}
    """
    
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
                    temperature=0.4 
                )
            )
            return {"improvements": json.loads(response.text)}
        except Exception as e:
            last_exception = e

    if isinstance(last_exception, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="All fallback models failed to return a valid JSON array.")
    else:
        raise HTTPException(status_code=500, detail=f"Critique Generation Error: {str(last_exception)}")