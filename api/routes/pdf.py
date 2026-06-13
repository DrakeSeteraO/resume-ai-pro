import io
import tarfile
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from api.schemas import PdfPayload

router = APIRouter()

@router.post("/api/pdf")
async def generate_pdf_proxy(payload: PdfPayload):
    # ==========================================
    # ATTEMPT 1: TeX Live (Primary)
    # ==========================================
    try:
        print("Attempting PDF compilation with TeX Live...")
        response1 = requests.post(
            "https://texlive.net/cgi-bin/latexcgi",
            data={
                "filecontent": payload.latex_string,
                "engine": "pdflatex",
                "return": "pdf"
            },
            timeout=25
        )
        
        if response1.status_code == 200 and 'application/pdf' in response1.headers.get('Content-Type', ''):
            print("Success using TeX Live!")
            return Response(content=response1.content, media_type="application/pdf")
        else:
            print("TeX Live failed or returned HTML. Falling back to LaTeXOnline...")
            
    except Exception as e:
        print(f"TeX Live encountered a network error: {str(e)}. Falling back to LaTeXOnline...")

    # ==========================================
    # ATTEMPT 2: LaTeXOnline (Fallback)
    # ==========================================
    print("Attempting PDF compilation with LaTeXOnline fallback...")
    try:
        # LaTeXOnline requires the string to be compressed into a tarball
        latex_bytes = payload.latex_string.encode('utf-8')
        
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='main.tex')
            tarinfo.size = len(latex_bytes)
            tar.addfile(tarinfo, io.BytesIO(latex_bytes))
        
        tar_stream.seek(0)

        response2 = requests.post(
            "https://latexonline.cc/data",
            params={"target": "main.tex", "command": "pdflatex"},
            files={"file": ("resume.tar", tar_stream, "application/x-tar")},
            timeout=30
        )
        
        if response2.status_code == 200:
            print("Success using LaTeXOnline!")
            return Response(content=response2.content, media_type="application/pdf")
        else:
            error_message = response2.text if response2.text else "Both TeX Live and LaTeXOnline failed to compile."
            raise HTTPException(status_code=400, detail=error_message)
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Total Compiler Failure. Both servers are down: {str(e)}")