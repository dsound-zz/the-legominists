"""
Retriever: Stores chunks in ChromaDB and handles similarity search.

We use ChromaDB's built-in embedding model (all-MiniLM-L6-v2) which runs
locally. When we store or query, Chroma handles the vectorization
automatically if we provide the raw text.
"""

import chromadb
from pathlib import Path

from src.chunker import Chunk


def get_collection(
    db_dir: Path,
    collection_name: str,
):
    """Get or create a ChromaDB collection with persistent storage."""
    client = chromadb.PersistentClient(path=str(db_dir))
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},  # cosine similarity
    )
    return collection


def store_chunks(
    collection,
    chunks: list[Chunk],
):
    """
    Store all chunks in ChromaDB.
    ChromaDB will automatically generate embeddings using its default model.
    """
    # ChromaDB has a batch limit, process in groups
    BATCH = 500

    for i in range(0, len(chunks), BATCH):
        batch_chunks = chunks[i:i + BATCH]

        collection.upsert(
            ids=[c.id for c in batch_chunks],
            documents=[c.text for c in batch_chunks],
            metadatas=[
                {
                    "page_number": c.page_number,
                    "chunk_index": c.chunk_index,
                    "token_count": c.token_count,
                }
                for c in batch_chunks
            ],
        )

        print(f"  Stored batch {i // BATCH + 1}"
              f" ({min(i + BATCH, len(chunks))}/{len(chunks)} chunks)")

    print(f"Total documents in collection: {collection.count()}")


def query_similar(
    collection,
    query_text: str,
    n_results: int = 5,
) -> list[dict]:
    """
    Find the most similar chunks to a query string.
    ChromaDB embeds the query_text automatically.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    if results["ids"] and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            hits.append({
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "page_number": results["metadatas"][0][i]["page_number"],
                "distance": results["distances"][0][i],
            })

    return hits
