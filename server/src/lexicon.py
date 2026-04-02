"""
Lexicon: Extracts neologisms from the full corpus using Gemini.
"""

import os
import json
import time
from typing import List, Dict
from google import genai
from google.genai import types
from pathlib import Path

# Add project root to path if needed for imports
import sys
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config.settings import LLM_MODEL, DATA_DIR

def extract_neologisms_from_batch(chunks: List[Dict], model_name: str = LLM_MODEL) -> List[Dict]:
    """
    Send a batch of chunks to Gemini to extract invented words.
    """
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
    
    # Format the batch text with page headers
    context_text = ""
    for c in chunks:
        context_text += f"\n[SOURCE: Page {c['page_number']}]\n{c['text']}\n"
        
    prompt = f"""
    You are an expert on G.I. Gurdjieff's "Beelzebub's Tales to His Grandson."
    Extract every coined or invented word (neologisms) from the text below. 
    These are words Gurdjieff made up—often blending Greek, Armenian, Arabic, Turkish, Persian, and Sanskrit roots.
    
    Examples: Triamazikamno, Heptaparaparshinokh, Kundabuffer, Trogoautoegocrat, Legominism, Okidanokh, Ashiata Shiemash.

    Return ONLY a JSON array of objects. Do not include any other text.
    Each object must have exactly these keys:
    - "word": The neologism (properly capitalized, e.g., "Kundabuffer")
    - "page_number": The integer page number where it occurs
    - "surrounding_sentence": The full sentence containing the word for context

    Text to analyze:
    ---
    {context_text}
    ---
    """
    
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        text = response.text.strip()
        
        # Clean markdown if present
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  [red]Error in extraction batch: {e}[/red]")
        return []

def save_lexicon(lexicon: List[Dict], filename: str = "lexicon.json"):
    """Save the extracted lexicon to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(lexicon, f, indent=2, ensure_ascii=False)
    return out_path

def load_lexicon(filename: str = "lexicon.json") -> List[Dict]:
    """Load the lexicon from disk."""
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
