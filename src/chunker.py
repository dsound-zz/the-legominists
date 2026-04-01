"""
Chunker: Splits extracted page text into overlapping token-sized chunks.

Analogy: Like cutting a long tape reel into segments — but each segment
slightly overlaps the next so you never lose context at the splice point.

Why overlap? If Gurdjieff starts defining "Triamazikamno" at the end of
one chunk, the overlap ensures the definition carries into the next chunk too.
"""

import tiktoken
from dataclasses import dataclass

from src.pdf_parser import PageText


@dataclass
class Chunk:
    """A chunk of text ready for embedding."""
    id: str                 # unique identifier: "p{page}_c{chunk_index}"
    text: str               # the actual text content
    page_number: int        # source page (1-indexed)
    chunk_index: int        # chunk number within the page
    token_count: int        # tokens in this chunk


def _get_encoder():
    """Get the tokenizer. cl100k_base works for both OpenAI and rough estimates."""
    return tiktoken.get_encoding("cl100k_base")


def chunk_pages(
    pages: list[PageText],
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> list[Chunk]:
    """
    Split pages into overlapping chunks based on token count.

    Each chunk carries metadata about which page it came from,
    so we can cite exact page numbers in query results.
    """
    enc = _get_encoder()
    all_chunks: list[Chunk] = []

    for page in pages:
        tokens = enc.encode(page.text)

        if len(tokens) <= chunk_size:
            # Page fits in one chunk — no splitting needed
            all_chunks.append(Chunk(
                id=f"p{page.page_number}_c0",
                text=page.text,
                page_number=page.page_number,
                chunk_index=0,
                token_count=len(tokens),
            ))
            continue

        # Sliding window over tokens
        step = chunk_size - chunk_overlap
        chunk_idx = 0

        for start in range(0, len(tokens), step):
            end = min(start + chunk_size, len(tokens))
            chunk_tokens = tokens[start:end]
            chunk_text = enc.decode(chunk_tokens)

            all_chunks.append(Chunk(
                id=f"p{page.page_number}_c{chunk_idx}",
                text=chunk_text,
                page_number=page.page_number,
                chunk_index=chunk_idx,
                token_count=len(chunk_tokens),
            ))
            chunk_idx += 1

            # If we've reached the end, stop
            if end == len(tokens):
                break

    total_tokens = sum(c.token_count for c in all_chunks)
    print(f"Created {len(all_chunks)} chunks ({total_tokens:,} total tokens)")
    return all_chunks
