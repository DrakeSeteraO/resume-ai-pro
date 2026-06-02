# UltraCV: Agentic Resume Optimization Pipeline

**Author:** Drake Setera  
**Institution:** Grand Valley State University  

🔗 **Live Application URL:** [https://ultra-cv.vercel.app/](https://ultra-cv.vercel.app/)  
*(Reviewers: Please test the live pipeline via the link above)*

---

## 📖 Project Overview
UltraCV is an advanced, multi-agent generative AI pipeline designed to parse unstructured professional data, semantically tailor it against specific Applicant Tracking System (ATS) job descriptions, and autonomously compile a highly optimized, beautifully formatted PDF resume using LaTeX. 

This project demonstrates advanced prompt engineering, deterministic JSON structured outputs, autonomous function calling, and dynamic model routing using the Google Gemini SDK.

---

## 🏗️ System Architecture & Rubric Alignment

This application satisfies all advanced grading criteria through the following architectural implementations, directly addressing previous formative feedback:

### 1. Multi-Agent Workflow & Autonomous Tool Execution
The pipeline abandons basic prompt-based string parsing in favor of true agentic tool invocation. It utilizes a sequential, four-stage workflow:
* **Agent 1 (The Tailor):** Ingests raw JSON profile data and a target job description. It rewrites bullet points using Google's X-Y-Z formula and injects ATS keywords while strictly preserving factual history via JSON mode.
* **Agent 2 (The Formatter):** Transcribes the optimized JSON object into raw, single-column LaTeX code, properly escaping special characters.
* **Agent 3 (The ATS Auditor):** Cross-references the generated LaTeX against the target job description to identify missing high-value metrics, generating an array of specific critique instructions.
* **Agent 4 (The Reviser):** Ingests the initial LaTeX and the critique array to autonomously rewrite the document. 
    * **Native Tool Calling:** Agent 4 is equipped with a Python-based syntax linter (`validate_latex_syntax`). Using the Gemini SDK's `enable_automatic_function_calling=True` parameter and a strict function schema, the agent natively invokes this tool to validate its own code before returning a response. If a structural error (e.g., mismatched environments) is detected, the agent reads the execution result and self-corrects the code without user intervention.

### 2. Dynamic Model Routing (Architecture, Not Temperature)
To optimize for both computational quality and infrastructure constraints, tasks are dynamically routed to distinct models based on reasoning requirements—moving beyond mere temperature tuning:
* **`gemini-3.5-flash`:** Routed exclusively for the ATS Auditor phase. Its advanced reasoning engine is required to prevent "Template Collapse" and LLM hallucination, ensuring non-traditional experience is accurately preserved rather than overwritten by generic placeholder data. Additionally due to its improved responses compared to Gemini 3.1 Flash Lite it is chosen to be the final revision editor.
* **`gemini-3.1-flash-lite`:** Routed for the other 3 phases. Because these stages rely on high-volume string matching, critique generation, and repetitive tool execution loops, the Lite model's low-latency architecture ensures the multi-loop workflow remains highly responsive and minimizes token exhaustion. Additionally Gemini 3.1 Flast Lite offers a significantly more generous free tier, so it is utilized wherever possible.

### 3. Model Context Protocol (MCP) Integration
To adhere to modern decoupled AI standards, the project features a `mcp_server.py` microservice built with the **FastMCP** framework. This isolates the validation and compilation tools from the core application logic. 
* *Production Architecture Note:* While the local architecture is designed for an MCP microservice topology via `stdio` transport, the tools are embedded natively within the FastAPI handlers for the live Vercel deployment. This intentional topology shift bypasses Vercel's ephemeral serverless lifecycle constraints (which terminate persistent background processes) while maximizing frontend responsiveness and UX.

---

## 🛠️ Infrastructure & Execution Solutions

Throughout development, several bleeding-edge infrastructure and SDK limitations were systematically mitigated:

* **Bypassing URL Payload Limits:** The remote LaTeX compilation proxy initially rejected requests because the generated resumes exceeded HTTP GET URL character limits. This was solved by utilizing Python's `io` and `tarfile` libraries to compress the LaTeX string into an in-memory `.tar` archive and transmitting it securely via a `multipart/form-data` POST request.
* **Mitigating Pydantic SDK Validation Crashes:** Initial attempts to enforce strict schema adherence caused the backend to crash (HTTP 422 errors) due to heavily nested list structures from the frontend. This was resolved by adopting an aggressive "JSON Mode" configuration (`response_mime_type="application/json"`) paired with strict anti-hallucination prompts and a Data Transfer Object (DTO) pattern, ensuring perfect data formatting without crashing the SDK.
* **Vercel Serverless Timeouts:** The autonomous agentic loops frequently exceeded the 10-second default timeout for Vercel's serverless tier. A `vercel.json` configuration was engineered to maximize the `maxDuration` threshold to 60 seconds, ensuring the multi-agent pipeline safely resolves in production.

---

## 🤖 AI Attribution & Assistance

In accordance with academic integrity guidelines, the following outlines the usage of Generative AI tools during the development of this project:

* **Google Gemini:** Utilized as a pair-programming assistant to troubleshoot complex FastAPI/Pydantic validation errors (HTTP 422), architect the decoupled FastMCP microservice structure, and iteratively refine the strict anti-hallucination prompts and JSON mode configurations to prevent "Template Collapse." Also helped with outlining the README file. 
   * Gemini Pro logs can be found here: [chat logs](https://gemini.google.com/share/4d6d1ecfc974)

* **Lovable:** Utilized to bootstrap and generate the initial React frontend, UI components, and styling, allowing the primary engineering focus to remain on the complex backend AI orchestration and agentic pipelines.
   * Loveable logs can be found in the `Loveable_Logs` folder

* **Cline:** Utilized as an autonomous IDE assistant to help execute structural code changes, manage file routing, and streamline terminal commands during the debugging and deployment workflows.
   * Due to Cline not having a clean way to export files in WSL I had to export all of its data, so the Cline messages can be found somewhere in the `Cline_Data` folder

---
