# UltraCV: Agentic Resume Optimization Pipeline

**Author:** Drake Setera  
**Institution:** Grand Valley State University  

🔗 **Live Application URL:** [https://ultra-cv.vercel.app/](https://ultra-cv.vercel.app/)  
*(Reviewers: Please test the live pipeline via the link above)*

---

## 📖 Project Overview
UltraCV is an advanced, multi-agent generative AI pipeline designed to parse unstructured professional data, semantically tailor it against specific Applicant Tracking System (ATS) job descriptions, and autonomously compile a highly optimized, beautifully formatted PDF resume using LaTeX. 

This project demonstrates advanced prompt engineering, deterministic JSON structured outputs, autonomous function calling, and dynamic model routing using the Google Gemini SDK.

### Target Audience & Problem Statement
**The Problem:** Modern job seekers struggle to manually tailor their resumes to pass strict Applicant Tracking Systems (ATS) for every application, while maintaining complex LaTeX formatting constraints.  
**The User:** This application is built specifically for software engineers, tech professionals, and students who need highly tailored, metrics-driven, and perfectly formatted technical resumes at scale.

---

## ⚙️ Local Setup & Installation

To run UltraCV locally, you will need [Node.js](https://nodejs.org/) (for the React frontend) and [Python 3.8+](https://www.python.org/) (for the FastAPI backend).

**1. Clone the repository:**
`git clone https://github.com/YOUR_USERNAME/ultra-cv.git`
`cd ultra-cv`

**2. Backend Setup (Python):**
`python -m venv venv`
`source venv/bin/activate`  # On Windows use `venv\Scripts\activate`
`pip install -r requirements.txt`

**3. Environment Variables:**
Create a `.env` file in the root directory and add your Google Gemini API key:
`Gemini_API_Key=your_api_key_here`

**4. Frontend Setup (Node/React):**
`npm install`

**5. Run the Application:**
We use Vite to proxy frontend requests to the FastAPI backend.
`npm run dev`
The application will be available at `http://localhost:5173`.

## 🏗️ System Architecture & Rubric Alignment

This application satisfies all advanced grading criteria through the following architectural implementations, directly addressing previous formative feedback:

### 1. Multi-Agent Workflow & Autonomous Tool Execution
The pipeline abandons basic prompt-based string parsing in favor of true agentic tool invocation. It utilizes a sequential, four-stage workflow:
* **Agent 1 (The Tailor & Data Fetcher):** Ingests raw JSON profile data and a target job description. 
    * **Live MCP Tool Execution (Grounding):** Before generating any text, the model evaluates the input data. If it detects a GitHub username, the model autonomously decides to halt text generation and invoke the `fetch_github_profile` Python tool. This tool queries the live public GitHub API, pulling in the user's latest repositories and languages. 
    * **Agentic Synthesis:** The model reads the live API result, synthesizes it with the existing profile, and then resumes its task. It rewrites bullet points using Google's X-Y-Z formula and naturally weaves in ATS keywords, returning a strictly formatted JSON object without hallucinating fake experience.
* **Agent 2 (The Formatter):** Transcribes the optimized JSON object into raw, single-column LaTeX code, properly escaping special characters.
* **Agent 3 (The ATS Auditor):** Cross-references the generated LaTeX against the target job description to identify missing high-value metrics, generating an array of specific critique instructions.
* **Agent 4 (The Reviser):** Ingests the initial LaTeX and the critique array to autonomously rewrite the document. 
    * **Native Tool Calling:** Agent 4 is equipped with a Python-based syntax linter (`validate_latex_syntax`). Using the Gemini SDK's `enable_automatic_function_calling=True` parameter and a strict function schema, the agent natively invokes this tool to validate its own code before returning a response. If a structural error (e.g., mismatched environments) is detected, the agent reads the execution result and self-corrects the code without user intervention.

### 2. Dynamic Model Routing (Architecture, Not Temperature)
To optimize for both computational quality and infrastructure constraints, tasks are dynamically routed to distinct models based on reasoning requirements—moving beyond mere temperature tuning:
* **`gemini-3.5-flash`:** Routed exclusively for the ATS Auditor phase. Its advanced reasoning engine is required to prevent "Template Collapse" and LLM hallucination, ensuring non-traditional experience is accurately preserved rather than overwritten by generic placeholder data. Additionally due to its improved responses compared to Gemini 3.1 Flash Lite it is chosen to be the final revision editor.
* **`gemini-3.1-flash-lite`:** Routed for the other 3 phases. Because these stages rely on high-volume string matching, critique generation, and repetitive tool execution loops, the Lite model's low-latency architecture ensures the multi-loop workflow remains highly responsive and minimizes token exhaustion. Additionally Gemini 3.1 Flash Lite offers a significantly more generous free tier, so it is utilized wherever possible.

### 3. Model Context Protocol (MCP) Integration
To adhere to modern decoupled AI standards, the project features a `mcp_server.py` microservice built with the **FastMCP** framework. This isolates the validation and compilation tools from the core application logic. 
* *Production Architecture Note:* While the local architecture is designed for an MCP microservice topology via `stdio` transport, the tools are embedded natively within the FastAPI handlers for the live Vercel deployment. This intentional topology shift bypasses Vercel's ephemeral serverless lifecycle constraints (which terminate persistent background processes) while maximizing frontend responsiveness and UX.

### 🔍 Example of a Complete Interaction (Traced Execution)
To demonstrate the agentic pipeline in action, here is a trace of a standard execution (Reference: `Profile 3: 5 Year Developer` in the evaluation logs):

1. **User Request:** The frontend submits a JSON payload containing the user's career history, target job description (Senior Backend Engineer at Stripe), and GitHub username (`AlexMercerDev`).
2. **Autonomous Tool Call (Agent 1):** The Tailor agent receives the payload, recognizes the GitHub username, and autonomously suspends text generation to invoke the `fetch_github_profile` MCP tool.
3. **Data Synthesis (Agent 1):** The Python backend executes the tool, querying the GitHub API. The agent reads the returned repository data, synthesizes it with the original JSON, and outputs an ATS-optimized JSON profile.
4. **Formatting (Agent 2):** The Formatter translates the JSON into a raw LaTeX string.
5. **Critique Generation (Agent 3):** The ATS Auditor cross-references the LaTeX against the Stripe job description and outputs a JSON array of critique instructions (e.g., *"Inject keywords: distributed systems, Go, fault tolerance"*).
6. **Self-Correcting Revision (Agent 4):** The Reviser incorporates the critique into the LaTeX string. Before returning the final string, the agent autonomously invokes the `validate_latex_syntax` tool. The tool detects an unescaped `%` symbol. The agent reads this error, rewrites the string to `\%`, and successfully completes the execution loop.
7. **Final Output:** The backend API compiles the validated LaTeX string via TeX Live and returns a downloadable PDF to the user.

## 🛠️ Infrastructure & Execution Solutions

Throughout development, several bleeding-edge infrastructure and SDK limitations were systematically mitigated:

* **Bypassing URL Payload Limits:** The remote LaTeX compilation proxy initially rejected requests because the generated resumes exceeded HTTP GET URL character limits. This was solved by utilizing Python's `io` and `tarfile` libraries to compress the LaTeX string into an in-memory `.tar` archive and transmitting it securely via a `multipart/form-data` POST request.
* **Mitigating Pydantic SDK Validation Crashes:** Initial attempts to enforce strict schema adherence caused the backend to crash (HTTP 422 errors) due to heavily nested list structures from the frontend. This was resolved by adopting an aggressive "JSON Mode" configuration (`response_mime_type="application/json"`) paired with strict anti-hallucination prompts and a Data Transfer Object (DTO) pattern, ensuring perfect data formatting without crashing the SDK.
* **Vercel Serverless Timeouts:** The autonomous agentic loops frequently exceeded the 10-second default timeout for Vercel's serverless tier. A `vercel.json` configuration was engineered to maximize the `maxDuration` threshold to 60 seconds, ensuring the multi-agent pipeline safely resolves in production.

---

## 🤖 AI Attribution & Assistance

In accordance with academic integrity guidelines, the following outlines the usage of Generative AI tools during the development of this project:

* **Google Gemini:** Utilized as a pair-programming assistant to troubleshoot complex FastAPI/Pydantic validation errors (HTTP 422), architect the decoupled FastMCP microservice structure, and iteratively refine the strict anti-hallucination prompts and JSON mode configurations to prevent "Template Collapse." Also helped with outlining the README file. 
   * Gemini Pro logs can be found here: [chat logs](https://gemini.google.com/share/44b7966da293)

* **Lovable:** Utilized to bootstrap and generate the initial React frontend, UI components, and styling, allowing the primary engineering focus to remain on the complex backend AI orchestration and agentic pipelines.
   * Loveable logs can be found in the `Loveable_Logs` folder

* **Cline:** Utilized as an autonomous IDE assistant to help execute structural code changes, manage file routing, and streamline terminal commands during the debugging and deployment workflows.
   * Due to Cline not having a clean way to export files in WSL I had to export all of its data, so the Cline messages can be found somewhere in the `Cline_Data` folder

---

## 🧪 System Evaluation & Iteration

To ensure the pipeline handles real-world unpredictability, the system was rigorously evaluated against 5 highly distinct user profiles (ranging from an empty slate to a 20-year executive). Success was measured quantitatively (compilation success, rate limit avoidance) and qualitatively (ATS scoring, hallucination prevention).

**Detailed Testing & Iteration Logs:**
Because the evaluation and prompt engineering processes were extensive, the detailed methodologies, test results, and failure analyses have been documented in their own dedicated files. Reviewers are highly encouraged to read these to understand the architectural evolution of the project:

* 📊 [System Evaluation Framework](./evaluation/README.md): Contains the complete testing methodology, ATS scoring results, and documentation of resolved system failures. The raw JSON inputs, generated LaTeX, and final PDF outputs for all 5 test cases can be found inside the [`/evaluation`](./evaluation/) directory.
* 🛠️ [Build Log & Prompt Evolution](./BUILD_LOG.md): Documents the iterative prompt engineering process, showing exactly how the agent instructions evolved from Version 1 to Production to eliminate "Template Collapse" and LaTeX compiler crashes.

### 🔄 Iteration & Draft Feedback
During the draft phase of this project, the instructor provided specific feedback regarding MCP tool usage and agentic routing. Here is how that feedback was directly addressed in the final production build:

* **Instructor Feedback (MCP Gap):** The LaTeX compilation was handled by Python as a middleman, lacking a true MCP tool definition passed to the model.
* **The Solution:** I wrapped the remote `texlive.net` compilation API into a formally defined `compile_latex` tool with strict schemas and passed it to Agent 4 (The Reviser) via the `tools=` parameter. The model now autonomously decides when to trigger the final PDF compilation. Additionally, I implemented a `fetch_github_profile` MCP tool for Agent 1 to ground the resume in live API data.

* **Instructor Feedback (Agentic Behavior Gap):** The 4-agent sequence was hardcoded in Python, meaning the model wasn't making routing decisions about what runs next.
* **The Solution:** I transformed Agent 3 (The Auditor) into an autonomous router using Gemini's Structured Outputs. It now outputs an explicit `APPROVE` or `REJECT` decision based on its review of the resume. My React frontend reads this decision and uses a `while` loop to dynamically route the data back to the Reviser for corrections if rejected, entirely dismantling the hardcoded pipeline and putting the AI in the driver's seat.

## 🚀 Future Work (What I Would Fix With More Time)
* **Asynchronous Queueing:** Currently, the system relies on artificial frontend timeouts (breathers) to manage rate limits. With more time, I would implement a robust backend queue (like Celery/Redis) to handle concurrent users without risking API quota exhaustion.
* **Direct PDF Generation:** Instead of relying on third-party proxies like TeX Live, I would containerize a local `pdflatex` environment within a Dockerized backend to eliminate network latency and third-party downtime entirely.
