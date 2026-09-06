# Repolens Backend

Repolens backend service built with FastAPI, providing repository analysis, blast-radius estimation, and architecture insights.

## Current Technology

- **Language:** Python 3.13+
- **Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **Data Validation & Settings:** Pydantic & pydantic-settings
- **Testing:** Pytest & HTTPX (TestClient)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py             # Backend package initialization
│   ├── main.py                 # FastAPI application and base endpoints (/, /health)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── router.py       # API v1 centralized router
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Application settings with pydantic-settings
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── common.py           # Common response models
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py         # Pytest fixtures and test client setup
│       └── test_health.py      # Health, root, and status verification tests
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

### 4. Run the Development Server

Start the server with Uvicorn:

```bash
# From the backend directory
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **Root:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
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
