# UltraCV: System Evaluation & Testing Framework

## 1. Defining Success ("What Does Good Look Like?")
To rigorously evaluate the UltraCV pipeline, success is measured against both quantitative execution metrics and qualitative content standards.

**Quantitative Metrics (System Stability):**
* **Tool Execution:** The AI successfully recognizes the trigger (e.g., a GitHub username) and executes the `fetch_github_profile` MCP tool without hallucinating a response first.
* **Compilation Success:** The final LaTeX string compiles into a PDF via TeX Live (or the LaTeXOnline fallback) on the first attempt with a 0% crash rate (meaning all special characters were properly escaped).
* **Latency & Quota:** The pipeline resolves within the 60-second serverless timeout and successfully avoids 429 Rate Limit errors through model load-balancing.

**Qualitative Metrics (Agentic Reasoning):**
* **Keyword Integration:** The Reviser agent successfully injects at least 3-5 high-value keywords from the target job description into the final resume.
* **Format Preservation:** The Tailor agent maintains the strict JSON schema without hallucinating fake companies, altering historical dates, or experiencing "Template Collapse."

---

## 2. Test Methodology & Profiles
To ensure the pipeline handles real-world unpredictability, it was tested against 5 highly distinct user profiles. 

* **Profile 1: The Standard Developer (Baseline)**
  * *Inputs:* Standard CS degree, 2 internships, generic tech stack.
  * *Target:* Standard Backend Engineering role.
* **Profile 2: The Career Transitioner (Non-Traditional)**
  * *Inputs:* Heavy customer service background, bootcamp certificate, no formal tech experience.
  * *Target:* Entry-level Frontend role.
* **Profile 3: The Edge Case (Sparse Data)**
  * *Inputs:* Only a name, a GitHub username (`DrakeSeteraO`), and a single sentence summary. No written experience.
  * *Target:* Full-Stack role. *(Tests the MCP tool's ability to carry the payload).*
* **Profile 4: The Format Breaker (Special Characters)**
  * *Inputs:* Heavy use of `&`, `%`, `$`, and `#` in the raw text.
  * *Target:* Data Analyst role. *(Tests the LaTeX linting and escaping constraints).*
* **Profile 5: The Over-Achiever (Token Stress Test)**
  * *Inputs:* 10+ years of experience, 8 projects, 5 publications, massive text blocks.
  * *Target:* Staff Engineer role. *(Tests the 1-page summarization constraint and token limits).*

---

## 3. Evaluation Results

| Test Case | Tool Execution | PDF Compiled? | Keyword Match | Overall Result | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| 1. Standard Dev | ✅ | ✅ | High | **PASS** | Flawless execution. |
| 2. Career Transitioner| N/A | ✅ | Med | **PASS** | AI successfully mapped customer service soft-skills to agile methodologies. |
| 3. Sparse Data (GitHub)| ✅ | ✅ | High | **PASS** | MCP tool successfully fetched repos; AI built out the missing project sections autonomously. |
| 4. Format Breaker | N/A | ❌ (Initial) | High | **FAIL ➔ PASS** | *See Failure Analysis below.* |
| 5. Token Stress Test | ✅ | ✅ | High | **PASS** | Successfully condensed 3 pages of raw data into a single-column 1-page LaTeX layout. |

---

## 4. Failure Analysis & System Iteration
*Documenting where the system broke and how the architecture was hardened to fix it.*

### Failure 1: The "Unescaped Character" LaTeX Crash
* **What Broke:** During Profile 4 testing, the user input included "C#" and "100% test coverage." The AI failed to escape the `%` symbol, causing the TeX Live compiler to treat the rest of the document as a comment and crash.
* **The Fix:** The prompt for Agent 4 (The Reviser) was updated with a strict, capitalized constraint to escape all LaTeX characters. Additionally, the `validate_latex_syntax` Python tool was implemented, allowing the AI to catch its own unclosed environments and autonomously rewrite the code before sending it to the compiler.

### Failure 2: The 429 Rate Limit Exhaustion
* **What Broke:** Because the pipeline runs 4 sequential models and an internal self-correction loop, rapid testing quickly exhausted the 15 Requests Per Minute (RPM) free-tier limit for `gemini-3.1-flash-lite`, crashing the backend.
* **The Fix:** Implemented a **Dynamic Model Routing Strategy**. The architecture was load-balanced by assigning Agent 1 and 2 to `gemini-1.5-flash`, Agent 3 to `gemini-3.5-flash`, and Agent 4 to `gemini-2.5-flash`. By isolating the agents across different quota buckets, the system's capacity was massively multiplied without requiring paid infrastructure.

### Failure 3: Third-Party Compiler Timeouts (503 Errors)
* **What Broke:** The initial implementation relied entirely on `latexonline.cc`. During peak hours, this public proxy frequently returned 503 Service Unavailable errors, breaking the final stage of the application.
* **The Fix:** Engineered a **Waterfall Fallback** system. The `/api/pdf` route now prioritizes `texlive.net` (which accepts raw strings directly, improving speed). If TeX Live times out or fails, the backend catches the exception, dynamically compresses the LaTeX into an in-memory `.tar` buffer, and safely routes it to the `latexonline.cc` fallback.
