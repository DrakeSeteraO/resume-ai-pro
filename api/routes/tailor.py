import os
import json
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import ProfilePayload

router = APIRouter()

@router.post("/api/tailor")
async def tailor_resume(payload: ProfilePayload):
    if not os.environ.get("Gemini_API_Key"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server configuration.")
        
    try:
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        user_data_string = json.dumps(payload.dict(), indent=2)
        
        prompt = f"""
        You are an elite executive resume writer specializing in passing Applicant Tracking Systems (ATS) and catching FAANG recruiter attention.
        
        Your objective is to optimize and rewrite the provided resume JSON data to tailor it specifically for the following target position:
        - Target Company: {payload.target.company if payload.target.company else 'Large Tech Company'}
        - Target Role: {payload.target.role if payload.target.role else 'Software Developer'}
        
        Get keywords from the following job description to make the resume have the make possible ATS score:
        \"\"\"{payload.target.jobDescription}\"\"\"

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
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        
        return json.loads(response.text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid or malformed JSON syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Processing Error: {str(e)}")