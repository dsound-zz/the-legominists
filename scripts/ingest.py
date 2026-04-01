"""
Ingest Script: The full pipeline from PDF to searchable vector database.

Usage:
    python scripts/ingest.py
    python scripts/ingest.py --pdf path/to/custom.pdf

Pipeline:
1. Extract text from PDF
2. Chunk the text
3. Store in ChromaDB (auto-embeds locally)
"""

import sys
import time
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "config" / ".env")

from config.settings import (
    PDF_PATH, DB_DIR, COLLECTION_NAME,
    CHUNK_SIZE, CHUNK_OVERLAP,
)
from src.pdf_parser import extract_pages
from src.chunker import chunk_pages
from src.retriever import get_collection, store_chunks


def main():
    parser = argparse.ArgumentParser(description="Ingest a PDF into ChromaDB")
    parser.add_argument("--pdf", type=Path, default=PDF_PATH,
                        help="Path to the PDF file")
    args = parser.parse_args()

    pdf_path = args.pdf
    if not pdf_path.exists():
        print(f"ERROR: PDF not found at {pdf_path}")
        print(f"Place your PDF at: {PDF_PATH}")
        sys.exit(1)

    start = time.time()

    # Step 1: Extract text from PDF
    print("\n📄 Step 1/3: Extracting text from PDF...")
    pages = extract_pages(pdf_path)

    # Step 2: Chunk the text
    print("\n✂️  Step 2/3: Chunking text...")
    chunks = chunk_pages(pages, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

    # Step 3: Store in ChromaDB (Chroma handles embeddings automatically)
    print("\n💾 Step 3/3: Storing in ChromaDB...")
    DB_DIR.mkdir(parents=True, exist_ok=True)
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    store_chunks(collection, chunks)

    elapsed = time.time() - start
    print(f"\n✅ Done! Ingested {len(chunks)} chunks in {elapsed:.1f}s")
    print(f"   Database stored at: {DB_DIR}")


if __name__ == "__main__":
    main()
