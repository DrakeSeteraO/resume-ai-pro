import os
import json
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import ProfilePayload

router = APIRouter()

@router.post("/api/latex")
async def generate_latex(payload: ProfilePayload):
    if not os.environ.get("Gemini_API_Key"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    try:
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        user_data_string = json.dumps(payload.dict(), indent=2)
        
        prompt = f"""
        You are an expert LaTeX developer and technical resume designer. 
        Convert the following JSON resume data into a complete, beautiful, and compilable LaTeX document.
        
        REQUIREMENTS:
        1. Use a clean, modern, single-column professional layout suitable for software engineering.
        2. Include standard packages: \\usepackage{{geometry}}, \\usepackage{{hyperref}}, \\usepackage{{enumitem}}, \\usepackage{{titlesec}}.
        3. Set \\geometry{{margin=0.5in}}.
        4. Escape any LaTeX special characters like &, %, $, #, _ found in the user's text to prevent compilation errors.
        5. If a category (like publications or certificates) is empty or missing in the JSON, DO NOT generate a section for it. Also don't generate section's for categories that are weak and wouldn't look good on the resume.
        6. Reorder categories on the resume, so that the most relavent and importat categories are on the top. Additionally if the applicant is still in college/university then make the top section under their name be the Education section.
        7. Make the finished LaTeX only be a single PDF page when it is compiled. It should be as close to 1 page as possible, but don't add unnecessary information if it won't help improve the resume.
        8. Use a font and text sizing for titles, section titles, and normal text that would be found on an expert resume that would increase the chances of the applicant getting to the next round of interviews.
        
        Return ONLY the raw LaTeX code. Do not wrap the output in markdown code blocks (` ```latex `), just output the raw document string starting with \\documentclass.
        
        Input JSON:
        {user_data_string}
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(temperature=0.1)
        )
        
        latex_text = response.text.strip()
        if latex_text.startswith("```latex"):
            latex_text = latex_text[8:]
        if latex_text.startswith("```"):
            latex_text = latex_text[3:]
        if latex_text.endswith("```"):
            latex_text = latex_text[:-3]
            
        return {"latex": latex_text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LaTeX Generation Error: {str(e)}")