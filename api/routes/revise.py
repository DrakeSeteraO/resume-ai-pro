import os
import json
import re
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import RevisePayload

router = APIRouter()

def validate_latex_syntax(latex_code: str) -> dict:
    begin_count = latex_code.count(r'\begin{')
    end_count = latex_code.count(r'\end{')
    
    if begin_count == end_count:
        return {"status": "SUCCESS", "message": "All LaTeX environments are properly closed."}
    else:
        return {
            "status": "ERROR", 
            "message": f"Syntax Mismatch: Found {begin_count} '\\begin' tags but {end_count} '\\end' tags. Please fix the missing tags."
        }

@router.post("/api/revise")
async def revise_latex(payload: RevisePayload):
    if not os.environ.get("Gemini_API_Key"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    try:
        model = genai.GenerativeModel(
            model_name='gemini-3.1-flash-lite',
            tools=[validate_latex_syntax]
        )
        
        user_data_string = json.dumps(payload.profile, indent=2)
        improvements_string = "\n".join([f"- {imp}" for imp in payload.improvements])
        
        prompt = f"""
        You are an expert LaTeX developer and technical resume designer.
        Your objective is to update an existing LaTeX resume by applying a specific list of improvements.
        
        Raw Profile Context:
        {user_data_string}
        
        Current LaTeX Draft:
        {payload.latex_string}
        
        REQUESTED IMPROVEMENTS TO APPLY:
        {improvements_string}
        
        CRITICAL COMPILATION RULES:
        1. Apply the requested improvements to the text, but DO NOT break the LaTeX structure.
        2. ESCAPE ALL SPECIAL CHARACTERS (&, %, #, $, _).
        3. You MUST use the `validate_latex_syntax` tool to check your code before you finish. If it returns an error, fix your code.
        4. Output ONLY raw LaTeX. Start exactly with \\documentclass and end with \\end{{document}}.
        """
        
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(prompt, generation_config=genai.GenerationConfig(temperature=0.1))
        
        latex_text = response.text
        match = re.search(r'(\\documentclass.*?\\end\{document\})', latex_text, re.DOTALL)
        
        if match:
            clean_latex = match.group(1)
        else:
            clean_latex = latex_text.strip()
            if clean_latex.startswith("```latex"):
                clean_latex = clean_latex[8:]
            elif clean_latex.startswith("```"):
                clean_latex = clean_latex[3:]
            if clean_latex.endswith("```"):
                clean_latex = clean_latex[:-3]
                
        return {"latex": clean_latex.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revision Generation Error: {str(e)}")