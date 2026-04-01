"""
Chunker: Splits extracted page text into overlapping token-sized chunks.

Analogy: Like cutting a long tape reel into segments — but each segment
slightly overlaps the next so you never lose context at the splice point.

Why overlap? If Gurdjieff starts defining "Triamazikamno" at the end of
one chunk, the overlap ensures the definition carries into the next chunk too.
"""

# Removed tiktoken (Python 3.14 compatibility)
from dataclasses import dataclass

from src.pdf_parser import PageText


@dataclass
class Chunk:
    """A chunk of text ready for embedding."""
    id: str                 # unique identifier: "p{page}_c{chunk_index}"
    text: str               # the actual text content
    page_number: int        # source page (1-indexed)
    chunk_index: int        # chunk number within the page
    char_count: int         # characters in this chunk
    token_count_approx: int # approximated tokens (chars / 4)


def chunk_pages(
    pages: list[PageText],
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> list[Chunk]:
    """
    Split pages into overlapping chunks based on character count.
    We approximate tokens as 1 token ≈ 4 characters for better portability.

    Each chunk carries metadata about which page it came from.
    """
    all_chunks: list[Chunk] = []
    
    # Conversion: 1 token ≈ 4 characters
    CHARS_PER_TOKEN = 4
    char_limit = chunk_size * CHARS_PER_TOKEN
    char_overlap = chunk_overlap * CHARS_PER_TOKEN

    for page in pages:
        text = page.text

        if len(text) <= char_limit:
            # Page fits in one chunk — no splitting needed
            all_chunks.append(Chunk(
                id=f"p{page.page_number}_c0",
                text=text,
                page_number=page.page_number,
                chunk_index=0,
                char_count=len(text),
                token_count_approx=len(text) // CHARS_PER_TOKEN,
            ))
            continue

        # Sliding window over characters
        step = char_limit - char_overlap
        chunk_idx = 0

        for start in range(0, len(text), step):
            end = min(start + char_limit, len(text))
            chunk_text = text[start:end]

            all_chunks.append(Chunk(
                id=f"p{page.page_number}_c{chunk_idx}",
                text=chunk_text,
                page_number=page.page_number,
                chunk_index=chunk_idx,
                char_count=len(chunk_text),
                token_count_approx=len(chunk_text) // CHARS_PER_TOKEN,
            ))
            chunk_idx += 1

            # If we've reached the end, stop
            if end == len(text):
                break

    print(f"Created {len(all_chunks)} chunks for {len(pages)} pages.")
    return all_chunks
