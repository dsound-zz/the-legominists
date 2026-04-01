"""
Query Script: Ask questions about Beelzebub's Tales via RAG.

Usage:
    # Single question
    python scripts/query.py "What is the Kundabuffer?"

    # Interactive mode
    python scripts/query.py

This retrieves relevant chunks (auto-embedded locally by ChromaDB),
sends them to Gemini, and returns a cited answer.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "config" / ".env")

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

from config.settings import (
    DB_DIR, COLLECTION_NAME, CONTEXT_CHUNKS,
    LLM_MODEL, LLM_MAX_TOKENS,
)
from src.retriever import get_collection, query_similar
from src.llm import ask_with_context


console = Console()


def query_book(question: str) -> str:
    """Full RAG pipeline: question → retrieve → answer."""

    # 1. Retrieve similar chunks (ChromaDB handles embedding the query text)
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    hits = query_similar(collection, question, n_results=CONTEXT_CHUNKS)

    if not hits:
        return "No relevant passages found. Is the book ingested?"

    # 2. Show retrieved sources
    console.print("\n[dim]Retrieved sources:[/dim]")
    for hit in hits:
        console.print(
            f"  [dim]• Page {hit['page_number']} "
            f"(distance: {hit['distance']:.3f})[/dim]"
        )

    # 3. Ask Gemini with context
    answer = ask_with_context(
        question=question,
        context_chunks=hits,
        model_name=LLM_MODEL,
        max_tokens=LLM_MAX_TOKENS,
    )

    return answer


def interactive_mode():
    """REPL-style query loop."""
    console.print(Panel(
        "[bold]Beelzebub RAG Query Interface[/bold]\n"
        "Ask questions about the book. Type 'quit' to exit.",
        style="blue",
    ))

    while True:
        try:
            question = console.input("\n[bold green]❓ Question:[/bold green] ")
        except (KeyboardInterrupt, EOFError):
            break

        if question.lower() in ("quit", "exit", "q"):
            break

        if not question.strip():
            continue

        with console.status("[bold blue]Searching & thinking...[/bold blue]"):
            answer = query_book(question)

        console.print(Panel(
            Markdown(answer),
            title="Answer",
            style="green",
        ))


def main():
    if len(sys.argv) > 1:
        # Single question mode
        question = " ".join(sys.argv[1:])
        answer = query_book(question)
        console.print(Panel(Markdown(answer), title="Answer", style="green"))
    else:
        # Interactive mode
        interactive_mode()


if __name__ == "__main__":
    main()
