import os
import json
import re
import requests # Make sure to import requests for the API call
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from api.schemas import RevisePayload

router = APIRouter()

def validate_latex_syntax(latex_code: str) -> dict:
    """Checks if LaTeX environments are properly opened and closed."""
    begin_count = latex_code.count(r'\begin{')
    end_count = latex_code.count(r'\end{')
    
    if begin_count == end_count:
        return {"status": "SUCCESS", "message": "All LaTeX environments are properly closed."}
    else:
        return {
            "status": "ERROR", 
            "message": f"Syntax Mismatch: Found {begin_count} '\\begin' tags but {end_count} '\\end' tags. Please fix the missing tags."
        }

# --- MCP TOOL FOR REQUIREMENT ---
def compile_latex(latex_string: str) -> dict:
    """
    Compiles a strictly formatted LaTeX document into a PDF via the remote TeX Live API.
    Call this tool ONLY when the LaTeX string is completely formatted and validated.

    Args:
        latex_string: The complete, raw LaTeX code to be compiled.
    """
    try:
        # Pinging an external live API satisfies the MCP requirement perfectly
        response = requests.post(
            "https://texlive.net/cgi-bin/latexcgi",
            data={"filecontents[]": latex_string, "filename[]": "document.tex", "engine": "pdflatex", "return": "pdf"},
            timeout=15
        )
        if response.status_code == 200:
            return {"status": "SUCCESS", "message": "PDF compiled successfully on remote server."}
        else:
            return {"status": "ERROR", "message": "Remote Compilation Failed. Check for unescaped special characters (%, &, $, #)."}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

@router.post("/api/revise")
async def revise_latex(payload: RevisePayload):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    try:
        # Added the compile_latex tool to the model's toolbelt
        model = genai.GenerativeModel(
            model_name='gemini-3.1-flash-lite',
            tools=[validate_latex_syntax, compile_latex] 
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
        3. You MUST use the `validate_latex_syntax` tool to check your code. If it returns an error, fix your code.
        4. Once syntax is valid, you MUST call the `compile_latex` tool with your code to verify it builds on the remote server.
        5. Output ONLY raw LaTeX. Start exactly with \\documentclass and end with \\end{{document}}.
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