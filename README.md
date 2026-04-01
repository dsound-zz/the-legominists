# Beelzebub RAG — Phase 1: Ingest & Index

A RAG pipeline for deep analysis of Gurdjieff's *Beelzebub's Tales to His Grandson*.

## Architecture

```
PDF → PyMuPDF (extract text + page nums)
    → Chunker (500 tokens, 100 overlap)
    → OpenAI Embeddings
    → ChromaDB (local, persistent)
    → Query Interface (CLI for now, Streamlit later)
```

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your API keys
cp config/.env.example config/.env
# Edit config/.env with your keys

# 4. Place your PDF
# Put beelzebub.pdf in the data/ folder

# 5. Ingest the book
python scripts/ingest.py

# 6. Query
python scripts/query.py "What does Beelzebub say about the Kundabuffer?"
```

## Project Structure

```
beelzebub-rag/
├── config/
│   ├── .env.example       # API key template
│   └── settings.py        # Chunk size, model config, etc.
├── data/                  # Put your PDF here (gitignored)
├── db/                    # ChromaDB persistent storage (auto-created)
├── scripts/
│   ├── ingest.py          # PDF → chunks → embeddings → ChromaDB
│   └── query.py           # CLI query interface
├── src/
│   ├── chunker.py         # Text splitting with overlap
│   ├── embeddings.py      # Embedding wrapper
│   ├── pdf_parser.py      # PyMuPDF extraction with metadata
│   ├── retriever.py       # ChromaDB query logic
│   └── llm.py             # Claude API wrapper for answers
├── requirements.txt
└── README.md
```

## Phase 2 (next)
- Lexicon tracker (neologism extraction + frequency heatmap)
- Streamlit UI
- Plotly visualizations

## Phase 3 (later)
- Story-nesting tree map
- Character relationship graph
- Cross-reference with Ouspensky
