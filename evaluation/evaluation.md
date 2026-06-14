# UltraCV: System Evaluation & Testing Framework

## 1. Defining Success ("What Does Good Look Like?")
To rigorously evaluate the UltraCV pipeline, success is measured against both quantitative execution metrics and qualitative content standards.

**Quantitative Metrics (System Stability):**
* **Tool Execution:** The AI successfully recognizes the trigger (e.g., a GitHub username) and executes the `fetch_github_profile` MCP tool without hallucinating a response first.
* **LaTeX Generation Success:** The AI models generate a valid LaTeX string that can be converted to a PDF through a LaTeX compiler without any error messages.
* **Compilation Success:** A PDF is returened to the users containing their resume. The final LaTeX string compiles into a PDF via the backend API that uses TeX Live (or the LaTeXOnline fallback) on the first attempt with a 0% crash rate.
* **Latency & Quota:** The pipeline resolves within the 60-second serverless timeout and successfully avoids 429 Rate Limit errors through model load-balancing.

**Qualitative Metrics (Agentic Reasoning):**
* **Keyword Integration:** The Reviser agent successfully injects at least 3-5 high-value keywords from the target job description into the final resume.
* **ATS Accuracy:** The completed resume scores a average of 70 % or higher from the ATS Checkers: [Enhancv](https://app.enhancv.com/onboarding#1), [1 Million Resume](https://1millionresume.com/resume-checker), and [Resume Worded](https://resumeworded.com/resume-scanner)
* **Format Preservation:** The outputted resume/LaTeX contains no fake companies, altered historical dates, or false information about the user.

---

## 2. Test Methodology & Profiles
To ensure the pipeline handles real-world unpredictability, it was tested against 5 highly distinct user profiles. 

* **Profile 1: My Info (Real World Example)**
  * *Inputs:* All fields filled out except publications.
  * *Target:* IT Intern Position at Meijer.
* **Profile 2: Empty Slate (Anti-Hallucination Test)**
  * *Inputs:* User only inputs general info about themself and GitHub Username.
  * *Target:* IT Help Desk.
* **Profile 3: 5 Year Developer (Mid Experience Test)**
  * *Inputs:* 5 Years worth of experience, as well as, some awards and certificates.
  * *Target:* Senior Backend Engineer at Stripe.
* **Profile 4: Tech VP (High Experience Test)**
  * *Inputs:* A Tech VP with 20 years of experience.
  * *Target:* CTO at Vanguard
* **Profile 5: Edge Case (AI Parser Test)**
  * *Inputs:* Heavy use of `&`, `%`, `$`, and `#` in the raw text.
  * *Target:* Staff Engineer role. *(Tests the 1-page summarization constraint and token limits).*

---

## 3. Evaluation Results

| Test Case | Tool Execution | Valid LaTeX Generation | PDF Compiled? | Keyword Match | ATS score | AI Hallucination | Overall Result | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: |:---: |:---: | :--- |
| 1. My Info | ✅ | ✅ | ✅ | High | 73 % | None | **PASS** | Flawless execution. |
| 2. Empty Slate | ✅ | ✅ | ✅ | High | 56 % | A lot | **Fail** | Though resume looked good, AI created fake job experience and 2 of the 3 projects were fake. |
| 3. 5 Year Developer | ✅ | ✅ | ✅ | High | 71 % | None | **PASS** | Flawless execution. |
| 4. Tech VP | ✅ | ✅ | ✅ | High | 74 % | None | **PASS** | Flawless execution. |
| 5. Edge Case | ✅ | ✅ | High | **PASS** | Successfully condensed 3 pages of raw data into a single-column 1-page LaTeX layout. |

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
