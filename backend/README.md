# Repolens Backend

Repolens backend service built with FastAPI, providing repository analysis, blast-radius estimation, and architectural code insights.

## Current Technology

- **Language:** Python 3.13+
- **Framework:** FastAPI (with `lifespan` lifecycle management)
- **ASGI Server:** Uvicorn
- **Data Validation & Settings:** Pydantic & pydantic-settings
- **Testing:** Pytest & HTTPX (FastAPI TestClient)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py             # Backend package initialization
│   ├── main.py                 # FastAPI application, CORS, lifespan, and root endpoints
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── router.py       # API v1 centralized router
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Centralized configuration with pydantic-settings
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── common.py           # Response models (HealthResponse, RootResponse, ErrorResponse)
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py         # Pytest fixtures and TestClient setup
│       ├── test_core.py        # Metadata, OpenAPI, CORS, and v1 router tests
│       └── test_health.py      # Health, root, and 404 response tests
│
├── .venv/                      # Python virtual environment (ignored in git)
├── .env.example                # Example environment configuration
├── requirements.txt            # Python dependencies
└── README.md                   # Backend documentation
```

## Setup Instructions

### 1. Create Virtual Environment

From the `backend` directory:

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

Ensure your virtual environment is active, then install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Available configuration options:

| Variable | Description | Default |
|---|---|---|
| `APP_NAME` | Name of the application | `"Repolens API"` |
| `APP_VERSION` | Version of the application | `"0.1.0"` |
| `ENVIRONMENT` | Deployment environment (`development`, `production`, etc.) | `"development"` |
| `API_V1_PREFIX` | Base path prefix for API v1 routes | `"/api/v1"` |
| `CORS_ORIGINS` | Permitted origins for CORS (comma-separated or JSON list) | `["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]` |

### 4. Run the Development Server

Start the server with Uvicorn:

```bash
# From the backend directory
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **Root:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **API v1 Base:** [http://127.0.0.1:8000/api/v1](http://127.0.0.1:8000/api/v1)
- **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 5. Run Tests

Run the test suite with `pytest`:

```bash
# From the backend directory
pytest
```

Or for verbose test output:

```bash
pytest -v
```
