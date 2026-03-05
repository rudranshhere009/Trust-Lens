# TrustLens FactCheck Graph API

LangGraph/LangChain-backed research API implementing:

- `Decomposer -> Planner -> Searcher -> Browser chain -> Critic -> Synthesizer`
- aggressive link chaining (target 25-35 sources)
- pivot query strategy when results are shallow/circular
- final verdict + sub-claim table + confidence + gaps

## Run

```bash
pip install -r backend/factcheck_graph/requirements.txt
python -m uvicorn backend.factcheck_graph.app:app --host 127.0.0.1 --port 8787
```

or from npm script:

```bash
npm run factcheck:api
```

## Groq API Key Setup

The assistant chat endpoint is already wired to Groq.

1. Copy:

```bash
backend/factcheck_graph/.env.example
```

to:

```bash
backend/factcheck_graph/.env
```

2. Paste your key in `backend/factcheck_graph/.env`:

```bash
GROQ_API_KEY=your_real_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

The backend auto-loads this `.env` file on startup.

## Frontend Integration

Set optional env var:

```bash
VITE_FACTCHECK_GRAPH_API=http://127.0.0.1:8787
```

If not set, frontend defaults to `http://127.0.0.1:8787`.

Optional:

```bash
VITE_FACTCHECK_ALLOW_BROWSER_FALLBACK=1
```

By default, browser fallback is disabled so CORS-blocked public endpoints do not pollute runs.

Endpoint used:

- `POST /api/factcheck/run`
- `POST /api/factcheck/chat` (Groq chat completions)
- `GET /health`
