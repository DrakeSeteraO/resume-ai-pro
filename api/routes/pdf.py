import io
import tarfile
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from api.schemas import PdfPayload

router = APIRouter()

@router.post("/api/pdf")
async def generate_pdf_proxy(payload: PdfPayload):
    try:
        latex_bytes = payload.latex_string.encode('utf-8')
        
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='main.tex')
            tarinfo.size = len(latex_bytes)
            tar.addfile(tarinfo, io.BytesIO(latex_bytes))
        
        tar_stream.seek(0)

        response = requests.post(
            "[https://latexonline.cc/data](https://latexonline.cc/data)",
            params={"target": "main.tex", "command": "pdflatex"},
            files={"file": ("resume.tar", tar_stream, "application/x-tar")},
            timeout=30
        )
        
        if response.status_code == 200:
            return Response(content=response.content, media_type="application/pdf")
        else:
            error_message = response.text if response.text else "LaTeXOnline server failed to compile the PDF."
            raise HTTPException(status_code=400, detail=error_message)
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to LaTeXOnline: {str(e)}")