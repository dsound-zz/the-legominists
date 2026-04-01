import sys
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "config" / ".env")

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.table import Table

from config.settings import (
    DB_DIR, COLLECTION_NAME, CONTEXT_CHUNKS,
    LLM_MODEL, LLM_MAX_TOKENS, DATA_DIR
)
from src.retriever import get_collection, query_similar
from src.llm import ask_with_context, genai
from src.lexicon import load_lexicon
from src.etymology import load_etymology
from src.frequency import load_frequency

console = Console()

def query_book(question: str) -> str:
    """Full RAG pipeline: question → retrieve → answer."""
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    hits = query_similar(collection, question, n_results=CONTEXT_CHUNKS)

    if not hits:
        return "No relevant passages found. Is the book ingested?"

    console.print("\n[dim]Retrieved sources:[/dim]")
    for hit in hits:
        console.print(
            f"  [dim]• Page {hit['page_number']} "
            f"(distance: {hit['distance']:.3f})[/dim]"
        )

    answer = ask_with_context(
        question=question,
        context_chunks=hits,
        model_name=LLM_MODEL,
        max_tokens=LLM_MAX_TOKENS,
    )

    return answer

def query_lexicon(word: str):
    """Specialized lexicon search mode."""
    # 1. Load data
    lexicon = {item["word"].lower(): item for item in load_lexicon()}
    etymology = {item["word"].lower(): item for item in load_etymology()}
    frequency = {w.lower(): data for w, data in load_frequency().items()}

    word_lower = word.lower()
    if word_lower not in lexicon:
        console.print(f"[bold red]Error:[/bold red] '{word}' not found in lexicon. Run build_lexicon.py first.")
        return

    # 2. Get data components
    lex_item = lexicon[word_lower]
    ety_item = etymology.get(word_lower)
    freq_item = frequency.get(word_lower, [])
    
    # 3. Retrieve relevant passages for context
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    hits = query_similar(collection, word, n_results=3)

    # 4. Infer definition using Gemini
    with console.status(f"[bold cyan]Analyzing '{word}'...[/bold cyan]"):
        context_block = "\n---\n".join([h["text"] for h in hits])
        prompt = f"""
        Based ONLY on the following passages from Gurdjieff's "Beelzebub's Tales," 
        infer the definition/meaning of the neologism: {word}.
        
        Passages:
        {context_block}
        
        Return a concise 1-2 sentence definition.
        """
        model = genai.GenerativeModel(model_name=LLM_MODEL)
        response = model.generate_content(prompt)
        definition = response.text.strip()

    # 5. Display results
    total_count = sum(p["count"] for p in freq_item)
    pages_count = len(freq_item)

    console.print(Panel(
        f"[bold magenta]Lexicon Entry: {lex_item['word']}[/bold magenta]\n"
        f"[italic]{definition}[/italic]",
        title="Word Breakdown",
        style="cyan",
        expand=False
    ))

    # Etymology Table
    if ety_item:
        table = Table(title="Etymological Roots", show_lines=True)
        table.add_column("Morpheme", style="cyan")
        table.add_column("Language", style="magenta")
        table.add_column("Meaning", style="green")
        
        for root in ety_item.get("roots", []):
            table.add_row(root["morpheme"], root["language"], root["meaning"])
        
        console.print(table)
        console.print(f"[dim]Notes: {ety_item.get('notes', 'N/A')}[/dim]")
    
    # Frequency Info
    console.print(f"\n[bold green]Frequency:[/bold green] Found {total_count} times across {pages_count} pages.")
    
    # Passages
    console.print("\n[bold yellow]Key Passages:[/bold yellow]")
    for hit in hits:
        console.print(Panel(
            hit["text"].strip(),
            title=f"Page {hit['page_number']}",
            border_style="dim",
            expand=False
        ))

def main():
    parser = argparse.ArgumentParser(description="Beelzebub RAG Query Tool")
    parser.add_argument("question", nargs="*", help="Question to ask the book")
    parser.add_argument("--word", help="Search for a specific neologism in the lexicon")
    args = parser.parse_args()

    if args.word:
        query_lexicon(args.word)
    elif args.question:
        question = " ".join(args.question)
        with console.status("[bold blue]Searching & thinking...[/bold blue]"):
            answer = query_book(question)
        console.print(Panel(Markdown(answer), title="Answer", style="green"))
    else:
        # Interactive mode
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

            # Check if user typed --word in interactive mode (nice to have)
            if question.startswith("--word "):
                query_lexicon(question.replace("--word ", "").strip())
                continue

            with console.status("[bold blue]Searching & thinking...[/bold blue]"):
                answer = query_book(question)

            console.print(Panel(
                Markdown(answer),
                title="Answer",
                style="green",
            ))

if __name__ == "__main__":
    main()
