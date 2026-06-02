from mcp.server.fastmcp import FastMCP
import requests
import io
import tarfile

# Initialize the FastMCP Server
mcp = FastMCP("CompileCV_Tools")

@mcp.tool()
def validate_latex_syntax(latex_code: str) -> str:
    """
    Validates that the generated LaTeX code does not have missing environments.
    Returns a status message indicating success or detailing the syntax mismatch.
    """
    begin_count = latex_code.count(r'\begin{')
    end_count = latex_code.count(r'\end{')
    
    if begin_count == end_count:
        return "SUCCESS: All LaTeX environments are properly closed."
    else:
        return f"ERROR: Syntax Mismatch. Found {begin_count} '\\begin' tags but {end_count} '\\end' tags. Please fix the missing tags."

@mcp.tool()
def compile_latex_to_pdf(latex_code: str) -> str:
    """
    Compiles raw LaTeX code into a PDF via the LaTeX.Online proxy.
    Use this tool ONLY when the LaTeX syntax has been fully validated.
    """
    try:
        latex_bytes = latex_code.encode('utf-8')
        tar_stream = io.BytesIO()
        
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            tarinfo = tarfile.TarInfo(name='main.tex')
            tarinfo.size = len(latex_bytes)
            tar.addfile(tarinfo, io.BytesIO(latex_bytes))
            
        tar_stream.seek(0)

        response = requests.post(
            "https://latexonline.cc/data",
            params={"target": "main.tex", "command": "pdflatex"},
            files={"file": ("resume.tar", tar_stream, "application/x-tar")},
            timeout=30
        )
        
        if response.status_code == 200:
            return "SUCCESS: PDF successfully compiled."
        else:
            return f"COMPILATION ERROR: {response.text}"
            
    except Exception as e:
        return f"NETWORK ERROR: {str(e)}"

if __name__ == "__main__":
    # Run the MCP server using standard input/output streams
    mcp.run()