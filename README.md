# CompileCV: Agentic Resume Optimizer

> **Grand Valley State University - Generative AI Master's Course**
> **Project 2: Agentic Systems**
> **Author:** Todd Parcheta

CompileCV is an automated, multi-agent pipeline that ingests a user's career profile, tailors it to a specific job description using Google's Gemini, and programmatically compiles a clean, ATS-optimized LaTeX PDF. 

## 🚀 Live Demo & Repository
* **Live Application:** [Insert Vercel/Deployment Link Here]
* **GitHub Repository:** [Insert Link Here]

---

## 🧠 Agentic Patterns Implemented
This project utilizes a **Critique-and-Revise Agentic Loop** to ensure high-quality output without human intervention. The pipeline consists of four distinct LLM phases:
1. **Data Structuring Agent:** Parses raw user input into a standardized JSON schema.
2. **Tailoring Agent:** Analyzes the target job description and rewrites bullet points for maximum impact (incorporating XYZ resume metrics).
3. **Auditing Agent:** Reviews the generated text against the job description and acts as an ATS screener to flag missing keywords or weak formatting.
4. **Execution Agent:** Ingests the Audit Agent's feedback and directly modifies the LaTeX code to finalize the document.

## 🏗️ System Architecture
* **Frontend:** React (Vite) + Tailwind CSS, managing the UI state and asynchronous agent loading screens.
* **Backend:** FastAPI (Python) serving as the orchestrator for the Google Gemini API.
* **External Tools/APIs:** The backend acts as a secure proxy to interact with the **LaTeX.Online API**, autonomously converting the generated `.tex` code into a downloadable PDF binary, bypassing browser CORS restrictions.

## 📝 Prompt Engineering & System Design
This pipeline relies on highly specific system prompts to constrain the LLM's behavior across multiple steps:
* **The ATS Tailoring Persona:** The first agent is given a strict system instruction to act as a "ruthless but highly constructive FAANG technical recruiter." This prevents the model from generating overly flowery, generic text and forces it to use the XYZ impact metric formula.
* **The LaTeX Developer Persona:** The code-generation agent is strictly constrained with formatting instructions (e.g., `\usepackage{geometry}`, `margin=0.5in`) and is explicitly told to escape special characters to prevent compilation breaks.
* **Temperature Tuning:** The creative text-generation agents run at a temperature of `0.3` to `0.4` for slight variability in keyword matching, while the final LaTeX execution agent is locked to a temperature of `0.1` to ensure deterministic, syntactically correct code.

## ⚓ Grounding
To prevent hallucinations, the models are never asked to invent information. They are strictly grounded using structured input:
1. **User Data Payload:** The AI receives the user's existing experience via a strict JSON schema.
2. **Target Context:** The AI is fed the raw text of the target job description. It is instructed to extract keywords directly from this specific document and weave them into the existing JSON parameters without altering dates, companies, or factual history.

## 🔄 Build Log & Iteration
* **Experiment 1 (Single Prompting):** Initially attempted to pass the JSON and ask the AI to output tailored LaTeX in one shot. *Result:* The AI frequently hallucinated invalid LaTeX syntax or dropped important career metrics.
* **Experiment 2 (Pipeline Separation):** Split the task into text optimization (JSON in, JSON out) and formatting (JSON in, LaTeX out). *Result:* Much higher success rate, but the AI still occasionally included markdown wrappers which broke the compiler.
* **Experiment 3 (Regex & Proxy):** Implemented strict regex extraction on the backend to strip markdown wrappers. Discovered browser CORS issues when pinging the LaTeX compiler directly, so I built a FastAPI proxy route to handle the compilation server-side.
* **Experiment 4 (Execution Constraints):** Added a `temperature=0.0` constraint to the execution agent to enforce deterministic output when applying the critique agent's feedback.

## 📊 Evaluation Metrics
To define and measure "good" output, I evaluated the system against the following criteria:
1. **Compilation Success Rate:** The final LaTeX string must successfully compile into a PDF via the LaTeX.Online API without syntax errors. (Currently achieving a high success rate due to the low temperature setting).
2. **Keyword Injection (Qualitative):** I ran a test profile against 5 different FAANG job descriptions. In visual reviews, the output consistently integrated 3-5 high-value technical keywords into the experience bullets without altering the core factual data.
3. **Format Adherence:** Checked that the output strictly maintained the 1-page length requirement and successfully escaped problematic characters like `&` and `%`.

## ⚠️ Known Limitations & Boundaries
* **Heavy Traffic:** The open-source LaTeX compilation API can occasionally time out during peak hours. A retry loop with a backoff strategy was implemented on the frontend to mitigate this.
* **Complex Graphics:** The LaTeX agent is highly optimized for clean, text-based single-column templates. Asking it to render complex graphics or multi-column mini-pages often results in compilation failure.

---

## 💻 Local Development Setup

To run this project locally, you will need Node.js and Python installed.

### 1. Clone the repository
```bash
git clone [Your Repo URL]
cd [Your Repo Name]
