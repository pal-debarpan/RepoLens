# Repolens Backend

Repolens backend service built with FastAPI and SQLAlchemy, providing repository analysis, blast-radius estimation, dependency graph visualization, quality scoring, testing recommendations, and architectural insights.

---

## 🛠️ Technology Stack

- **Framework:** FastAPI (Python 3.13+) with lifespan management
- **Database:** Supabase PostgreSQL with SQLAlchemy 2.x ORM & psycopg 3.x driver
- **Migrations:** Alembic
- **Static AST Analysis:** Tree-sitter (Python, JavaScript, TypeScript, Go, Java, C, C++) with regex fallbacks
- **Dependency Graphs:** NetworkX directed graph analysis, cycle detection & subgraph extraction
- **Authentication:** Supabase Auth (JWT HS256 validation) with optional/required dependencies
- **AI Explanation:** Google Gemini API (`gemini-2.5-flash` / `@google/genai`) with offline mock fallback
- **Quality Model:** ISO/IEC 25010:2023 Product Quality Characteristics (9 dimensions)

---

## 📁 Project Architecture

```
backend/
├── app/
│   ├── main.py                     # FastAPI application, CORS, lifespan, and root endpoints
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── router.py           # API v1 centralized router
│   │       └── endpoints/
│   │           ├── repositories.py # Repository CRUD & GitHub/ZIP ingestion
│   │           └── analyses.py     # Comprehensive analysis routes (Blast radius, Graph, Quality, Testing, Chat)
│   │
│   ├── core/
│   │   ├── config.py               # Centralized configuration with pydantic-settings
│   │   └── auth.py                 # Supabase JWT authentication helpers
│   │
│   ├── db/
│   │   ├── base.py                 # DeclarativeBase for SQLAlchemy models
│   │   └── session.py              # Engine, session factory, SessionLocal & get_db
│   │
│   ├── models/
│   │   ├── repository.py           # Repository database model
│   │   ├── analysis.py             # Analysis database model (status, scores, JSON graphs & metrics)
│   │   └── finding.py              # Finding database model (category, severity, evidence, fix)
│   │
│   ├── schemas/
│   │   ├── analysis.py             # Analysis request/response schemas
│   │   ├── blast_radius.py         # Blast radius request/response schemas
│   │   ├── graph.py                # Graph node, edge, and subgraph schemas
│   │   ├── finding.py              # Finding response & filter schemas
│   │   ├── quality.py              # ISO/IEC 25010 quality characteristic schemas
│   │   ├── testing.py              # Test recommendation schemas
│   │   └── chat.py                 # Gemini AI chat request/response schemas
│   │
│   ├── services/
│   │   ├── scanner.py              # File tree scanner, language detection, binary filtering
│   │   ├── parser.py               # Tree-sitter AST import and definition extractor
│   │   ├── resolver.py             # Multi-language module import resolver
│   │   ├── entry_points.py         # Route, controller, and CLI entry point detector
│   │   ├── graph.py                # NetworkX graph builder, cycle detection, subgraph slicer
│   │   ├── blast_radius.py         # Deterministic blast radius propagation engine (0-100)
│   │   ├── architecture.py         # Circular dependencies & monolithic file analyzer
│   │   ├── security.py             # Secret scanning (masked evidence) & dangerous call detector
│   │   ├── dependency.py           # Broken import & package.json validator
│   │   ├── quality.py              # ISO/IEC 25010:2023-aligned quality scorer
│   │   ├── testing.py              # Blast-score prioritized test recommendations
│   │   ├── gemini.py               # Async Gemini API explanation layer with offline fallback
│   │   ├── demo_fixture.py         # Deterministic 'repolens-demo' analysis fixture
│   │   └── orchestrator.py         # End-to-end analysis pipeline coordinator
│   │
│   └── tests/                      # 125+ automated pytest tests across all services and endpoints
│
├── alembic/                        # Database migration scripts
├── requirements.txt                # Python dependencies
└── README.md                       # This documentation
```

---

## 🚀 Setup & Local Execution

### 1. Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Configure your `.env`:
```env
DATABASE_URL="postgresql+psycopg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_JWT_SECRET="[JWT-SECRET]"
GEMINI_API_KEY="[YOUR-GEMINI-KEY]"     # Optional; falls back to mock explanation if omitted
GEMINI_MODEL="gemini-2.5-flash"
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Start Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 6. Run Tests

```bash
pytest app/tests/ -v
```

---

## 🧠 Core Architecture & Analysis Pipeline

### 1. AST Parsing & Dependency Resolution
- Uses **Tree-sitter** grammar parsers for Python, JavaScript, TypeScript, Go, Java, and C/C++.
- Resolves relative imports (`./paymentService`), submodule imports, and package manifests.
- Distinguishes internal workspace modules from external packages (`express`, `lodash`, `sqlalchemy`).

### 2. Dependency Graph & Blast Radius Engine
- Constructs directed dependency graphs (`DiGraph`) using **NetworkX**.
- **Blast Radius Calculation:** Computes how modifying file $X$ propagates across callers and entry points.
  - Considers direct caller distance, entry point amplification (API routes have higher blast weight), and total transitive dependents.
  - Cycle-safe BFS/DFS traversal ensures circular dependencies don't cause infinite loops.

### 3. ISO/IEC 25010:2023 Quality Scoring
Calculates an overall quality score (0–100) across all 9 standard characteristics:
1. **Functional Suitability**
2. **Performance Efficiency**
3. **Compatibility**
4. **Interaction Capability**
5. **Reliability**
6. **Security**
7. **Maintainability**
8. **Flexibility**
9. **Safety**

> [!NOTE]
> **Disclaimer:** RepoLens aligns its quality scoring terminology and categorization with ISO/IEC 25010:2023. This is an automated static heuristic tool and does **not** constitute formal ISO certification.

### 4. Security & Safety Model
- **Untrusted Code Execution:** Repository code is **never** executed. All analysis is strictly static.
- **Secret Masking:** Detected hardcoded keys (AWS, API tokens, passwords) are automatically masked in findings (`AKIA...******...EXAMPLE`) before being saved or returned via API.
- **Public Accessibility:** Any user can trigger analyses on public repositories without ownership restrictions.

### 5. Gemini AI Explanation Layer
- Gemini (`gemini-2.5-flash`) acts strictly as an **explanation layer** to summarize, contextualize, and recommend fixes.
- Gemini **never** calculates graphs, blast radius, findings, or scores; these are strictly computed deterministically by the static engine.
- If no `GEMINI_API_KEY` is provided, RepoLens gracefully falls back to deterministic structured explanations.

---

## 🎯 Demo Fixture (`repolens-demo`)

RepoLens includes a built-in deterministic fixture for product reviews and frontend previews:
- **Analysis ID:** `DEMO_ANALYSIS_ID` (deterministic UUID5 based on `https://github.com/repolens/repolens-demo`)
- **Key Highlight:** `src/services/paymentService.js` (Blast radius 72.0/100, 11 affected files, 4 findings, 4 test recommendations)
- **Live Demo Endpoint:** `GET /api/v1/analyses/65481d4e-b5f7-5f72-9721-a20c3a8e97f0`

---

## 📡 API Reference Summary

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/repositories/github` | Ingest public GitHub repository | Optional |
| `POST` | `/api/v1/repositories/upload` | Upload & extract repository ZIP | Optional |
| `GET` | `/api/v1/repositories` | List ingested repositories | Public |
| `POST` | `/api/v1/analyses` | Trigger repository analysis pipeline | Optional |
| `GET` | `/api/v1/analyses` | Get user's analysis history | **Required** |
| `GET` | `/api/v1/analyses/{id}` | Get complete analysis details | Optional |
| `GET` | `/api/v1/analyses/{id}/blast-radius?file_path=...` | Calculate file blast radius | Optional |
| `GET` | `/api/v1/analyses/{id}/graph` | Get full dependency graph | Optional |
| `GET` | `/api/v1/analyses/{id}/graph/{file_path}` | Get file-level dependency subgraph | Optional |
| `GET` | `/api/v1/analyses/{id}/findings` | List findings (filterable by category/severity) | Optional |
| `GET` | `/api/v1/analyses/{id}/quality` | Get ISO/IEC 25010 quality assessment | Optional |
| `GET` | `/api/v1/analyses/{id}/testing` | Get prioritized test recommendations | Optional |
| `POST` | `/api/v1/analyses/{id}/chat` | Ask AI about findings and architecture | Optional |
