# UltraCV: Agentic Resume Optimization Pipeline

**Author:** Drake Setera  
**Institution:** Grand Valley State University  

🔗 **Live Application URL:** `[INSERT_YOUR_VERCEL_URL_HERE]`  
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
* **`gemini-1.5-flash`:** Routed exclusively for the Tailoring and Formatting phases. Its advanced reasoning engine is required to prevent "Template Collapse" and LLM hallucination, ensuring non-traditional experience is accurately preserved rather than overwritten by generic placeholder data.
* **`gemini-3.1-flash-lite`:** Routed for the ATS Audit and Revision phases. Because these stages rely on high-volume string matching, critique generation, and repetitive tool execution loops, the Lite model's low-latency architecture ensures the multi-loop workflow remains highly responsive and minimizes token exhaustion.

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

## 🚀 Local Development Setup

**1. Install Dependencies**
```bash
pip install -r api/requirements.txt
