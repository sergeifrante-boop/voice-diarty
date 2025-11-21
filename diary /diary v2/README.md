# Voice Journal MVP

Minimal full-stack voice journal that records short audio entries, mocks AI services, and stores structured insights for later UI work.

## Project Structure

This is a monorepo containing both backend and frontend:

```
voice-diarty/
├── backend/              # FastAPI app, Alembic migrations, unit tests
│   ├── app/
│   │   ├── api/          # Auth + entries + insights routers
│   │   ├── core/         # Config, database, security helpers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas for responses
│   │   ├── services/     # STT + LLM mocks, tag helpers
│   │   └── main.py       # FastAPI entrypoint
│   ├── alembic/          # Migration environment + versions
│   └── tests/             # Pytest suite (tag cloud, calendar, LLM mocks)
├── frontend/              # Vite v7.1.12 + React (mobile-first UI)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── config.ts     # API configuration
│   │   └── styles.css    # Mobile-first styles
│   └── package.json
├── docker-compose.yml     # Local Postgres
└── README.md
```

> Tests live under `backend/tests`. Please add future specs there to keep service logic well-covered.

## Environment & secrets

- Copy `.env.example` to `.env` and adjust for your machine.
- `.env` is **local-only**. In staging/prod use a secrets manager or CI-injected env vars.
- Audio files are saved through the storage abstraction (`app/services/storage.py`):
  - `STORAGE_PROVIDER=local` persists under `MEDIA_ROOT` (default `backend/app/data`) and exposes URLs via `MEDIA_BASE_URL` (default `/media`).
  - Future providers (S3/GCS) will use `STORAGE_BUCKET` + pre-signed URLs.
- AI config knobs:
  - `LLM_PROVIDER` / `STT_PROVIDER`: `mock` (default) or `openai`
  - `OPENAI_API_KEY` / `STT_API_KEY`: required when enabling real providers
  - `OPENAI_LLM_MODEL` (default `gpt-4o-mini`) and `OPENAI_STT_MODEL` (default `gpt-4o-mini-transcribe`)
- Toggle `USE_MOCK_AI=false` to automatically promote both providers to OpenAI if you don’t want to flip each flag manually.

> Tests force the mock providers automatically via `backend/tests/conftest.py`, so `pytest` never reaches external APIs even if your `.env` points to OpenAI.

## Development

### Prerequisites

- **Node.js**: 20.19+ or 22.12+ (required for Vite 7)
- **Python**: 3.9+
- **Docker**: For running PostgreSQL locally

### Project Structure

- **backend/**: FastAPI + PostgreSQL + AI logic
- **frontend/**: Vite v7.1.12 + React (mobile-first UI)

### Running the Stack

#### 1. Database

Start PostgreSQL using Docker Compose:

```bash
docker compose up db
```

The database will be available at `localhost:5432`.

#### 2. Backend API

Set up and run the FastAPI backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

**API Routes:**
- `/auth/register`, `/auth/login` - Authentication
- `/entries/` - Journal entries (GET list, POST create)
- `/entries/{id}` - Entry details
- `/entries/calendar` - Calendar view
- `/insights/*` - AI insights
- `/tags-cloud` - Tag cloud
- `/transcribe` - High-quality transcription with LLM analysis
- `/healthz` - Health check

**CORS Configuration:**
The backend is configured to allow requests from `http://localhost:5173` (frontend dev server).

#### 3. Frontend (Desktop & Mobile Testing)

Set up and run the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

**Mobile Testing:**

The Vite dev server is configured to accept connections from mobile devices on the same network:

1. **On Desktop**: Open `http://localhost:5173` and use browser DevTools mobile emulation.

2. **On Phone (same Wi-Fi)**:
   - Find your computer's local IP address (e.g., `192.168.0.23`)
   - Open the Network URL that Vite prints in the terminal (e.g., `http://192.168.0.23:5173`)
   - Make sure your phone is on the same Wi-Fi network

**API Configuration:**

The frontend connects to the backend using `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).

To override, create `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

**How Frontend Talks to Backend:**

The frontend uses the API base URL from `src/config.ts`. All API calls should use `config.apiBaseUrl` instead of hard-coded URLs.

### Usage Tips

1. Visit `http://localhost:5173` (or the network URL on mobile).
2. Enter demo credentials (e.g. `demo@example.com` / `demo12345`). The app auto-registers on first login.
3. Record or upload an audio snippet, wait for the AI response, and inspect lists/calendar/tag cloud.
4. To hit the real OpenAI APIs, set `LLM_PROVIDER=openai`, `STT_PROVIDER=openai`, provide your keys, and restart the backend.

## Tests

Backend tests use pytest:

```bash
cd backend
pytest
```

They currently cover:

- Mock LLM output (ensures deterministic mood/tag results on keywords)
- Tag cloud aggregation weights
- Calendar aggregation per day

### Next steps

- Swap local audio storage for S3 or similar and expose signed URLs.
- Harden auth (JWT refresh, password reset, rate limits).
- Add integration tests (or smoke scripts) for the real OpenAI adapters.
