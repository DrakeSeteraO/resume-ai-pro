# Architectural Documentation: MCP vs. Production Serverless Runtime

This directory maintains both a standard FastAPI application routing architecture (`index.py`) and a Model Context Protocol server configuration (`mcp_server.py`). This note outlines the engineering rationale governing their respective roles across development and production environments.

## 🛠️ Local Development (The MCP Boundary)
During local simulation, `mcp_server.py` functions as an independent, decoupled microservice running over `stdio` transport. It allows client models to dynamically inspect and consume core utilities (`validate_latex_syntax`, `compile_latex_to_pdf`). This ensures the code boundary conforms perfectly to modern agentic standards.

## ⚡ Production Execution (Vercel Serverless Optimization)
For the live deployment hosted on **Vercel**, the application bypasses the decoupled MCP server pipeline, instead embedding tool execution natively within the FastAPI backend handlers. 

This topology shift resolves key infrastructure constraints:

* **Ephemeral Instance Lifecycles:** Vercel's serverless functions are entirely stateless and short-lived. They cannot maintain the persistent background execution layers or active communication streams that standard `stdio` or HTTP-SSE MCP connections rely upon.
* **Latency Mitigation:** Executing the tool logic directly inside the serverless execution context eliminates translation layers and protocol handshakes. 
* **User Experience (UX) Enhancement:** Reducing cross-process round trips directly translates into faster document processing cycles, preventing frontend request timeouts and providing instantaneous PDF compilation responses for the user.

---
*Note: The `mcp_server.py` file remains retained in the repository to guarantee architectural extensibility, providing immediate compatibility with persistent cloud runtimes (e.g., AWS ECS, GCP Cloud Run) should the application transition off serverless infrastructure.*