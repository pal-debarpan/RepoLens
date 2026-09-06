# Repolens

Repolens is an explainable developer tool designed to analyze software repositories and help developers understand code dependencies, risks, and the potential impact of changes.

## Review 1 Prototype

This prototype focuses on demonstrating the core backend functionality of Repolens. It includes a FastAPI backend with repository ingestion, code analysis, dependency mapping, blast-radius analysis, security and architecture insights, quality scoring, and testing recommendations.

The generated analysis data is designed to be consumed by the frontend and visualized as developer-friendly insights.

## Tech Stack

- Python
- FastAPI
- Supabase PostgreSQL
- SQLAlchemy
- Tree-sitter
- NetworkX
- Gemini API

## Running Locally

### Backend

```bash
cd backend
```

Activate the virtual environment:

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the server:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Current Status

Repolens is currently a **Review 1 prototype**. The core backend functionality has been implemented to demonstrate the feasibility of the repository analysis system. The next stage is to integrate the backend with the final frontend, improve analysis accuracy, and build the complete end-to-end experience.

## Team

Built as a hackathon project by the Repolens team.