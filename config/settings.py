"""
Central configuration for the Beelzebub RAG pipeline.
Tweak these values to tune retrieval quality.
"""

from pathlib import Path

# ── Paths ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_DIR = PROJECT_ROOT / "db"
PDF_PATH = DATA_DIR / "beelzebub.pdf"  # rename your file to this

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
