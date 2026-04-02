import sys
import json
import time
from pathlib import Path

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "server" / ".env")

from src.definitions import generate_definitions_batch, save_definitions, load_definitions
from config.settings import DATA_DIR

def cleanup():
    error_path = DATA_DIR / "definition_errors.json"
    if not error_path.exists():
        print("No errors to cleanup.")
        return

    with open(error_path, "r") as f:
        missing_words = json.load(f)

    if not missing_words:
        print("Error file is empty.")
        return

    print(f"Retrying {len(missing_words)} missing definitions...")
    
    # Load existing
    current_defs = load_definitions()
    existing_words = {d['word'] for d in current_defs}
    
    # Filter out ones already done (just in case)
    to_do = [w for w in missing_words if w not in existing_words]
    
    if not to_do:
        print("All words already present in definitions.json.")
        error_path.unlink()
        return

    new_results = []
    batch_size = 10
    for i in range(0, len(to_do), batch_size):
        batch = to_do[i:i+batch_size]
        print(f"  Processing batch {i//batch_size + 1} ({len(batch)} words)...")
        results = generate_definitions_batch(batch)
        new_results.extend(results)
        time.sleep(2) # Avoid rate limits

    # Merge and Save
    combined = current_defs + new_results
    save_definitions(combined)
    
    # Update error file (remove successful, keep failed if any)
    successful_words = {r['word'] for r in new_results}
    still_missing = [w for w in to_do if w not in successful_words]
    
    if still_missing:
        with open(error_path, "w") as f:
            json.dump(still_missing, f, indent=2)
        print(f"Cleanup finished. {len(new_results)} added. {len(still_missing)} still failing.")
    else:
        error_path.unlink()
        print(f"Cleanup finished. All {len(new_results)} words added. Error file cleared.")

if __name__ == "__main__":
    cleanup()
