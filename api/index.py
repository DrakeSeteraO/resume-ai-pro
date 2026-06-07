import os
import json
import io
import tarfile
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from fastapi.responses import Response

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
GEMINI_API_KEY = os.environ.get("Gemini_API_Key")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ==========================================
# 1. FASTAPI INCOMING SCHEMAS (With Defaults)
# ==========================================
# These models handle the incoming request from the frontend and prevent 422 crashes.
# Every single field is Optional so FastAPI never crashes on missing data.

class Personal(BaseModel):
    fullName: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""

class EducationItem(BaseModel):
    id: Optional[str] = ""
    school: Optional[str] = ""
    degree: Optional[str] = ""
    field: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    details: Optional[str] = ""

class ExperienceItem(BaseModel):
    id: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    location: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    bullets: Optional[str] = ""

class ProjectItem(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    stack: Optional[str] = ""
    link: Optional[str] = ""
    description: Optional[str] = ""

class CertificateItem(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    link: Optional[str] = ""

class PublicationItem(BaseModel):
    id: Optional[str] = ""
    title: Optional[str] = ""
    venue: Optional[str] = ""
    date: Optional[str] = ""
    link: Optional[str] = ""
    description: Optional[str] = ""

class TargetJob(BaseModel):
    company: Optional[str] = ""
    role: Optional[str] = ""
    jobDescription: Optional[str] = ""

class ProfilePayload(BaseModel):
    personal: Optional[Personal] = Personal()
    narrative: Optional[str] = ""
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    skills: List[str] = []
    certificates: List[CertificateItem] = []
    publications: List[PublicationItem] = []
    target: Optional[TargetJob] = TargetJob()

class CritiquePayload(BaseModel):
    profile: ProfilePayload
    latex_string: str

class RevisePayload(BaseModel):
    profile: ProfilePayload
    latex_string: str
    improvements: List[str]
    
class PdfPayload(BaseModel):
    latex_string: str


# ==========================================
# 2. DEFINE THE BACKEND AI EXECUTION ROUTE
# ==========================================
@app.post("/api/tailor")
async def tailor_resume(payload: ProfilePayload):
    if not GEMINI_API_KEY:
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
        
        tailored_data = json.loads(response.text)
        return tailored_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid or malformed JSON syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Processing Error: {str(e)}")

# ... (Keep everything above this exactly the same) ...

@app.post("/api/latex")
async def generate_latex(payload: ProfilePayload):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    try:
        # Use Gemini 3.1 flash lite for quick specific tasks that don't require much creativitiy
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
            generation_config=genai.GenerationConfig(
                temperature=0.1 # Keep temperature very low so it doesn't hallucinate invalid LaTeX syntax
            )
        )
        
        # Clean up any accidental markdown blocks if the AI disobeys the instruction
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
    

# ==========================================
# 3. THE ATS AUDIT & CRITIQUE ROUTE
# ==========================================
@app.post("/api/critique")
async def critique_resume(payload: CritiquePayload):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    user_data_string = json.dumps(payload.profile.dict(), indent=2)
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
    Example format: 
    [
      "Change the bullet point in the Linear role to explicitly mention WebSockets, as requested in the job description.",
      "Move the Kubernetes skill higher up in the LaTeX skills section for better visibility."
    ]
    
    Target Job Details:
    {target_job_string}
    
    Raw Profile Data:
    {user_data_string}
    
    Current LaTeX Draft:
    {payload.latex_string}
    """
    
    # Define the exact fallback cascade order
    models_to_try = [
        'gemini-3.5-flash', 
        'gemini-2.5-flash', 
        'gemini-3.1-flash-lite'
    ]
    
    last_exception = None

    for model_name in models_to_try:
        try:
            print(f"Attempting critique with {model_name}...")
            model = genai.GenerativeModel(model_name)
            
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.4 
                )
            )
            
            # Parse the JSON array returned by the AI
            improvements_list = json.loads(response.text)
            
            # If successful, return the data and immediately exit the loop
            print(f"Success using {model_name}!")
            return {"improvements": improvements_list}
            
        except Exception as e:
            # If this model fails, log the error and let the loop continue to the next model
            print(f"Critique model {model_name} failed: {str(e)}")
            last_exception = e

    # If the code reaches this point, it means every single model in the array failed
    if isinstance(last_exception, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="All fallback models failed to return a valid JSON array.")
    else:
        raise HTTPException(status_code=500, detail=f"Critique Generation Error (All models failed): {str(last_exception)}")


# ==========================================
# 4. THE REVISION ROUTE (FINAL LATEX GENERATION)
# ==========================================
def validate_latex_syntax(latex_code: str) -> dict:
    """
    A tool to validate that the generated LaTeX code does not have missing environments.
    Call this tool to check your code before returning the final response.
    """
    begin_count = latex_code.count(r'\begin{')
    end_count = latex_code.count(r'\end{')
    
    if begin_count == end_count:
        return {"status": "SUCCESS", "message": "All LaTeX environments are properly closed."}
    else:
        return {
            "status": "ERROR", 
            "message": f"Syntax Mismatch: Found {begin_count} '\\begin' tags but {end_count} '\\end' tags. Please fix the missing tags."
        }

@app.post("/api/revise")
async def revise_latex(payload: RevisePayload):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server.")
        
    try:
        # 1. Initialize the model and pass the tool!
        model = genai.GenerativeModel(
            model_name='gemini-3.1-flash-lite',
            tools=[validate_latex_syntax] # <-- Here is the magic
        )
        
        user_data_string = json.dumps(payload.profile.dict(), indent=2)
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
        
        # 2. Start an autonomous chat session so the agent can loop if the tool returns an error
        chat = model.start_chat(enable_automatic_function_calling=True)
        
        response = chat.send_message(
            prompt,
            generation_config=genai.GenerationConfig(temperature=0.1)
        )
        
        latex_text = response.text
        
        # MAGIC BULLET: Surgically extract only the valid LaTeX code
        import re
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
    

# ==========================================
# 5. Convert LaTeX to PDF
# ==========================================
@app.post("/api/pdf")
async def generate_pdf_proxy(payload: PdfPayload):
    try:
        # 1. Convert the raw LaTeX string into bytes
        latex_bytes = payload.latex_string.encode('utf-8')
        
        # 2. Create an in-memory tarball containing a 'main.tex' file
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='main.tex')
            tarinfo.size = len(latex_bytes)
            tar.addfile(tarinfo, io.BytesIO(latex_bytes))
        
        # Reset the stream position to the beginning before reading
        tar_stream.seek(0)

        # 3. Send a POST request to the '/data' endpoint with the tarball
        response = requests.post(
            "https://latexonline.cc/data",
            params={
                "target": "main.tex",  # Tell the compiler which file to build
                "command": "pdflatex"
            },
            files={"file": ("resume.tar", tar_stream, "application/x-tar")},
            timeout=30
        )
        
        # 4. Handle the response
        if response.status_code == 200:
            return Response(content=response.content, media_type="application/pdf")
        else:
            # If LaTeXOnline fails, it returns the compiler log in the response body.
            # We raise a 400 instead of 502 so the frontend can properly handle the compilation error.
            error_message = response.text if response.text else "LaTeXOnline server failed to compile the PDF."
            raise HTTPException(status_code=400, detail=error_message)
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to LaTeXOnline: {str(e)}")