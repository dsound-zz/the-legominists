"""
PDF Parser: Extracts text from each page, preserving page numbers as metadata.

Think of this as the "A/D converter" — taking the analog PDF and turning it
into structured digital text we can work with downstream.
"""

import fitz  # PyMuPDF
from pathlib import Path
from dataclasses import dataclass


@dataclass
class PageText:
    """A single page's extracted text with its page number."""
    page_number: int    # 1-indexed for human readability
    text: str
    char_count: int


def extract_pages(pdf_path: Path) -> list[PageText]:
    """
    Extract text from every page of a PDF.

    Returns a list of PageText objects, one per page.
    Skips pages that are blank or have negligible text (< 20 chars),
    which handles title pages, blank separators, etc.
    """
    doc = fitz.open(str(pdf_path))
    pages: list[PageText] = []

    for i, page in enumerate(doc):
        text = page.get_text("text").strip()

        # Skip near-empty pages (title pages, blanks, etc.)
        if len(text) < 20:
            continue

        pages.append(PageText(
            page_number=i + 1,  # 1-indexed
            text=text,
            char_count=len(text),
        ))

    doc.close()

    print(f"Extracted {len(pages)} pages with content from {pdf_path.name}")
    return pages
