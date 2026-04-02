"""
Build Lexicon Runner: Orchestrates Extraction → Etymology → Frequency steps.
"""

import sys
import argparse
import time
import json
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.panel import Panel

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "server" / ".env")

from src.retriever import get_collection
from src.lexicon import extract_neologisms_from_batch, save_lexicon, load_lexicon
from src.etymology import analyze_etymology_batch, save_etymology, load_etymology
from src.frequency import build_frequency_map, save_frequency
from src.definitions import generate_definitions_batch, save_definitions, load_definitions
from config.settings import DB_DIR, COLLECTION_NAME, DATA_DIR

console = Console()

def run_pipeline(force: bool = False):
    console.print(Panel(
        "[bold magenta]The Legominist: Lexicon Builder[/bold magenta]\n"
        "Ingesting neologisms, analyzing root languages, and mapping occurrences.",
        style="cyan",
        expand=False
    ))

    # 0. Load collection
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    
    # 1. Neologism Extraction
    lexicon_file = DATA_DIR / "lexicon.json"
    if lexicon_file.exists() and not force:
        console.print("[green]✔[/green] Lexicon already exists. Skipping extraction (use --force to rebuild).")
        lexicon = load_lexicon()
    else:
        console.print("[bold cyan]1. Extracting Neologisms...[/bold cyan]")
        results = collection.get(include=["documents", "metadatas"])
        chunks = [
            {"text": d, "page_number": m["page_number"]} 
            for d, m in zip(results["documents"], results["metadatas"])
        ]
        
        batch_size = 10
        raw_extractions = []
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("[cyan]Processing batches...", total=len(chunks))
            
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                extracted = extract_neologisms_from_batch(batch)
                if extracted:
                    raw_extractions.extend(extracted)
                progress.update(task, advance=len(batch))
                time.sleep(1) # API pacing
                
        # Normalization and Deduplication
        seen = {}
        for entry in raw_extractions:
            word = entry["word"].strip().capitalize()
            if word and word not in seen:
                seen[word] = entry
        
        lexicon = list(seen.values())
        save_lexicon(lexicon)
        console.print(f"   [dim]→ Found {len(lexicon)} unique neologisms.[/dim]")

    # 2. Etymology Analysis
    etymology_file = DATA_DIR / "etymology.json"
    etymology_errors_file = DATA_DIR / "etymology_errors.json"
    
    if etymology_file.exists() and not force:
        console.print("[green]✔[/green] Etymology data already exists. Skipping analysis.")
        etymology_data = load_etymology()
    else:
        console.print("[bold cyan]2. Analyzing Etymologies (Batch)...[/bold cyan]")
        unique_words = sorted([item["word"] for item in lexicon])
        etymology_results = []
        etymology_errors = []
        batch_size = 10
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("[magenta]Unpacking roots...", total=len(unique_words))
            
            for i in range(0, len(unique_words), batch_size):
                batch = unique_words[i:i + batch_size]
                batch_results = analyze_etymology_batch(batch)
                if batch_results:
                    etymology_results.extend(batch_results)
                else:
                    etymology_errors.extend(batch)
                progress.update(task, advance=len(batch))
                time.sleep(1.5) # Anti-rate-limit delay between batches
        
        save_etymology(etymology_results)
        if etymology_errors:
            with open(etymology_errors_file, "w") as f:
                json.dump(etymology_errors, f, indent=2)
        console.print(f"   [dim]→ Analyzed {len(etymology_results)} words. ({len(etymology_errors)} failed)[/dim]")

    # 3. RAG Definitions
    definitions_file = DATA_DIR / "definitions.json"
    definition_errors_file = DATA_DIR / "definition_errors.json"
    
    if definitions_file.exists() and not force:
        console.print("[green]✔[/green] Definitions already exist. Skipping.")
        definitions_data = load_definitions()
    else:
        console.print("[bold cyan]3. Generating Definitions (Batch RAG)...[/bold cyan]")
        unique_words = sorted([item["word"] for item in lexicon])
        definition_results = []
        definition_errors = []
        batch_size = 10
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("[blue]Querying corpus...", total=len(unique_words))
            
            for i in range(0, len(unique_words), batch_size):
                batch = unique_words[i:i + batch_size]
                batch_results = generate_definitions_batch(batch)
                if batch_results:
                    definition_results.extend(batch_results)
                else:
                    definition_errors.extend(batch)
                progress.update(task, advance=len(batch))
                time.sleep(1.5) # API pacing
        
        save_definitions(definition_results)
        if definition_errors:
            with open(definition_errors_file, "w") as f:
                json.dump(definition_errors, f, indent=2)
        console.print(f"   [dim]→ Defined {len(definition_results)} words. ({len(definition_errors)} failed)[/dim]")

    # 4. Frequency & Location Mapping
    frequency_file = DATA_DIR / "frequency.json"
    if frequency_file.exists() and not force:
        console.print("[green]✔[/green] Frequency map already exists. Skipping.")
    else:
        console.print("[bold cyan]4. Mapping Frequencies...[/bold cyan]")
        unique_words = [item["word"] for item in lexicon]
        
        # Get raw chunks again for counting
        results = collection.get(include=["documents", "metadatas"])
        chunks = [
            {"text": d, "page_number": m["page_number"]} 
            for d, m in zip(results["documents"], results["metadatas"])
        ]
        
        with console.status("[bold blue]Scanning corpus and building map...[/bold blue]"):
            freq_map = build_frequency_map(unique_words, chunks)
            save_frequency(freq_map)
            
        console.print(f"   [dim]→ Mapped {len(unique_words)} words across {len(chunks)} chunks.[/dim]")

    console.print("\n[bold green]Lexicon Engine ready![/bold green]")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Beelzebub Lexicon Builder")
    parser.add_argument("--force", action="store_true", help="Overwrite existing JSON data")
    args = parser.parse_args()
    
    try:
        run_pipeline(force=args.force)
    except KeyboardInterrupt:
        console.print("\n[yellow]Abort requested by user.[/yellow]")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n[bold red]Pipeline failed:[/bold red] {e}")
        sys.exit(1)
