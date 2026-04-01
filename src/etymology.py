"""
Etymology: Analyzes the roots of Gurdjieff's neologisms.
"""

import os
import json
import time
from typing import List, Dict
import google.generativeai as genai
from pathlib import Path

# Add project root to path
import sys
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config.settings import LLM_MODEL, DATA_DIR

def analyze_etymology(word: str, model_name: str = LLM_MODEL) -> Dict:
    """Analyze the etymological roots of a single neologism via Gemini."""
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel(model_name=model_name)
    
    prompt = f"""
    Break down the likely etymological roots of the following coined word from Gurdjieff's writings.
    Consider Greek, Armenian, Arabic, Turkish, Persian, and Sanskrit as likely sources. 
    Explain the likely meaning of each component (morpheme).
    
    Word: {word}
    
    Return ONLY a JSON object. Do not include any other text.
    The object must have strictly these keys:
    - "word": The original word
    - "roots": A list of objects, each containing:
        - "morpheme": The part of the word
        - "language": The language of origin
        - "meaning": The meaning of this part
    - "confidence": "high", "medium", or "low"
    - "notes": A brief explanation of the synthesis or overall meaning in the context of Gurdjieff's system.

    Return the final result as a valid JSON object.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown if present
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        print(f"  Error in etymology analysis for {word}: {e}")
        return {}

def save_etymology(etymology_map: List[Dict], filename: str = "etymology.json"):
    """Save the etymology data to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(etymology_map, f, indent=2, ensure_ascii=False)
    return out_path

def load_etymology(filename: str = "etymology.json") -> List[Dict]:
    """Load etymology list from disk."""
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
