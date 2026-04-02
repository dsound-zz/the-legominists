"""
Central configuration for the Beelzebub RAG pipeline.
Tweak these values to tune retrieval quality.
"""

from pathlib import Path

# ── Paths ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_DIR = PROJECT_ROOT / "db"

# Find the first PDF in the data directory, otherwise default to beelzebub.pdf
def _get_pdf_path():
    try:
        pdfs = list(DATA_DIR.glob("*.pdf"))
        if pdfs:
            return pdfs[0]
    except Exception:
        pass
    return DATA_DIR / "beelzebub.pdf"

PDF_PATH = _get_pdf_path()

# ── Chunking ───────────────────────────────────────────
CHUNK_SIZE = 500       # tokens per chunk
CHUNK_OVERLAP = 100    # overlapping tokens between chunks

# ── ChromaDB ───────────────────────────────────────────
COLLECTION_NAME = "beelzebub"

# ── LLM (for query answering) ─────────────────────────
LLM_MODEL = "gemini-2.0-flash"
LLM_MAX_TOKENS = 1024
CONTEXT_CHUNKS = 5     # how many chunks to retrieve per query

# ── Display ────────────────────────────────────────────
RICH_THEME = "monokai"
