# LMS Portal — Document-to-Web Learning Management System

A full-stack LMS that converts Word/LaTeX chapter notes into interactive web
pages, with a RAG-grounded AI study assistant, one-click quiz generation,
auto-generated revision aids (comparison tables, mnemonics, Mermaid mind
maps), and student/teacher dashboards.

**Stack:** Next.js 14 (App Router) + TailwindCSS · FastAPI (Python) ·
ChromaDB (local vector store) · Google Gemini (primary LLM) with Ollama
fallback · SQLite (default DB, swappable for Postgres).

---

## 1. Project layout

```
lms/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── core/                # config, db session, auth/security
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # auth, courses, upload, chapters, chat, quiz, analytics
│   │   └── services/
│   │       ├── parser_docx.py    # .docx -> structured HTML + math
│   │       ├── parser_latex.py   # .tex  -> structured HTML + math
│   │       ├── vector_store.py   # ChromaDB indexing / retrieval per chapter
│   │       └── llm_service.py    # Gemini primary + Ollama fallback, RAG/quiz/revision prompts
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/                      # Next.js App Router pages
    ├── components/               # ChatSidebar, ChapterContent (KaTeX), QuizPlayer, MermaidRenderer, Navbar
    ├── lib/api.ts                # Axios client + auth session helpers
    └── package.json
```

---

## 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GEMINI_API_KEY to your own key from
# https://aistudio.google.com/app/apikey
# ⚠️ Never commit .env or paste real keys into chat/version control.

uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

### Optional: local Ollama fallback
If the Gemini call fails (bad/missing key, quota, network issue), the app
automatically falls back to a local Ollama server:
```bash
# install from https://ollama.com, then:
ollama pull llama3.1
ollama serve
```
Set `LLM_PROVIDER=ollama` in `.env` to make Ollama primary instead.

---

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # if you need a non-default API URL
npm run dev
```

Visit `http://localhost:3000`. The Next.js dev server proxies `/api/*`
requests to the FastAPI backend (`NEXT_PUBLIC_API_URL`, default
`http://localhost:8000`) — see `next.config.js`.

---

## 4. Using the app

1. **Register** as a Teacher.
2. Go to **Upload Notes** → create a course → upload a `.docx` or `.tex`
   chapter file. The backend parses headings/text/math and immediately
   builds a ChromaDB vector index scoped to that chapter.
3. Open the chapter page to see the rendered, KaTeX-formatted content and
   chat with the **AI Study Assistant** (answers are restricted to that
   chapter's indexed content — if it's not in the notes, the bot says so).
4. Click **Quiz** → **Generate Quiz** for a one-click MCQ quiz built from
   the chapter, or **Revision Aids** for a comparison table, mnemonics, and
   a Mermaid.js mind map.
5. Register a second account as a **Student** to see the student dashboard
   (progress, quiz score history) and a Teacher account to see the class
   analytics dashboard (completion rates, weak topics aggregated from quiz
   misses).

---

## 5. Notes on the RAG grounding guarantee

- Each chapter gets its **own** ChromaDB collection, so retrieval can never
  leak content from other chapters.
- The system prompt instructs the model to answer only from retrieved
  chunks and to say a fixed "not found in this chapter's notes" phrase
  otherwise; the API also flags `grounded: false` on those responses so the
  frontend can visually flag them.
- If no chunks are retrieved at all (e.g. the chapter has no text), the
  backend short-circuits and never calls the LLM.

## 6. Security notes

- Passwords are hashed with bcrypt; sessions use short-lived JWTs.
- `SECRET_KEY` and `GEMINI_API_KEY` must be set via `.env` — the provided
  `.env.example` only has placeholders. Rotate any key that has ever been
  pasted into a chat, ticket, or committed to a public repo.
- CORS is restricted to `CORS_ORIGINS` in `.env` (defaults to
  `http://localhost:3000`).

## 7. Known simplifications (things to harden before real production use)

- DOCX→LaTeX conversion for native Word equations (OMML) covers common
  constructs (fractions, sub/superscripts, radicals) but not the full OMML
  spec — complex equations may need manual LaTeX cleanup.
- No file-size limits / virus scanning on uploads — add before public deployment.
- SQLite is fine for evaluation; switch `DATABASE_URL` to Postgres for
  multi-user production load.
- No refresh-token rotation; JWT expiry is a flat 24h window.
