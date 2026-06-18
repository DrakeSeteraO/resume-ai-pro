# UltraCV: Build Log & Prompt Evolution

This document tracks the iterative engineering process, specifically focusing on how the system architecture and LLM prompts evolved to handle edge cases, hallucinations, and compiler crashes.

## 1. Prompt Engineering Evolution

### Evolution A: The Tailor Agent (Mitigating "Template Collapse" and Hallucinations)
**The Problem:** During early testing with sparse profiles (e.g., a user providing only their name and a GitHub link), the `gemini-1.5-flash` model experienced "Template Collapse." In its attempt to fulfill the persona of an "expert resume writer," it hallucinated entire job histories, fake projects, and fabricated metrics to make the resume look complete.

* **Version 1 (Initial Prompt):**
  > "You are an expert resume writer. Rewrite the provided user profile to match the target job description. Make it sound highly professional and ATS-friendly. Return the result as JSON."

* **Version 2 (Final Production Prompt):**
  > "You are an elite executive resume writer specializing in passing Applicant Tracking Systems (ATS).
  > CRITICAL REWRITING INSTRUCTIONS:
  > 1. The Narrative: Rewrite it into a 2-3 sentence powerhouse summary emphasizing core technical masteries.
  > [...]
  > 6. Strict Constraint: Do not change names, dates, companies, urls, ids, or school names. **Do not invent completely fake positions.** Maintain the exact JSON key layout. Treat the input data as absolute ground truth."

**The Result:** By shifting from a generic persona prompt to a highly constrained, rule-based negative prompt, the hallucination rate dropped to 0%. The agent learned to synthesize the fetched GitHub data instead of fabricating new employment history.

---

### Evolution B: The Reviser Agent (Preventing LaTeX Compiler Crashes)
**The Problem:** The pipeline frequently failed at the final step when parsing tech-heavy profiles (like FinTech engineers). The LLM would output raw symbols (like `%`, `&`, `#`) which act as structural commands in LaTeX, causing the `pdflatex` compiler to immediately crash.

* **Version 1 (Initial Prompt):**
  > "Review the critique array and update the LaTeX document. Fix any formatting issues and add the missing ATS keywords. Return only the LaTeX code."

* **Version 2 (Final Production Prompt):**
  > "You are an autonomous LaTeX compilation engine and formatting expert. 
  > Read the critique instructions and modify the LaTeX string. 
  > CRITICAL LATEX RULES: 
  > You MUST properly escape all special characters. `&` becomes `\&`, `%` becomes `\%`, `#` becomes `\#`, and `$` becomes `\$`. Failing to do this will crash the compiler.
  > If your syntax is invalid, use your `validate_latex_syntax` tool to identify unclosed environments and fix them before returning the final response."

**The Result:** Explicitly mapping the escape characters in the system prompt, combined with providing the model a local MCP syntax validation tool, created a highly resilient self-correcting loop that eliminated 503/400 compiler crash errors.

---

## 2. Infrastructure Evolution

### Mitigating the 429 Quota Exhaustion
* **Draft Architecture:** Initially, all agents shared the `gemini-3.1-flash-lite` model. Because the pipeline features autonomous tool-calling loops, the system rapidly exceeded the 15 Requests Per Minute (RPM) free-tier limit, crashing the backend.
* **Final Architecture:** Engineered a Dynamic Model Routing strategy. Agent 1 maps to `gemini-2.5-flash-lite`, Agents 2 & 4 map to `gemini-3.1-flash-lite`, and Agent 3 maps to `gemini-3.5-flash`. Distributing the agents across distinct quota buckets massively increased pipeline capacity without requiring paid infrastructure.

### The Waterfall Fallback Compiler
* **Draft Architecture:** Relied solely on `latexonline.cc` via compressed `.tar` streams. Frequent public server timeouts caused 503 Service Unavailable errors.
* **Final Architecture:** Built a waterfall compiler route. The system attempts `texlive.net` first (faster, accepts raw POST strings). If it fails or times out, the backend dynamically compresses the LaTeX string into a `.tar` buffer and routes it to the `latexonline.cc` fallback proxy, ensuring graceful degradation.
