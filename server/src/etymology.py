"""
Etymology: Analyzes the roots of Gurdjieff's neologisms.
"""

import os
import json
from typing import List, Dict
import google.generativeai as genai
from pathlib import Path

# Add project root to path
import sys
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config.settings import LLM_MODEL, DATA_DIR

def _clean_json_response(text: str) -> str:
    """Extract and clean JSON from LLM response."""
    text = text.strip()
    # Remove markdown fences
    if text.startswith("```"):
        # Find the first newline and the last ```
        first_newline = text.find("\n")
        last_fence = text.rfind("```")
        if first_newline != -1 and last_fence != -1:
            text = text[first_newline:last_fence].strip()
        else:
            text = text.replace("```json", "").replace("```", "").strip()
            
    # Find the actual JSON structure in case of leading/trailing text
    start_bracket = text.find("[")
    start_brace = text.find("{")
    
    if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
        end_bracket = text.rfind("]")
        if end_bracket != -1:
            return text[start_bracket : end_bracket + 1]
    elif start_brace != -1:
        end_brace = text.rfind("}")
        if end_brace != -1:
            return text[start_brace : end_brace + 1]
            
    return text

def analyze_etymology_batch(words: List[str], model_name: str = LLM_MODEL) -> List[Dict]:
    """Analyze the etymological roots of a batch of neologisms via Gemini."""
    if not words:
        return []
        
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel(model_name=model_name)
    
    words_list = "\n".join([f"- {w}" for w in words])
    
    prompt = f"""
    Analyze ONLY the linguistic roots and morphemes of the following words from Gurdjieff's writings.
    Consider Greek, Armenian, Arabic, Turkish, Persian, Sanskrit, and Russian as likely sources.
    Gurdjieff was Armenian and grew up speaking Russian, so both languages appear naturally in his coinages.
    
    CRITICAL: Do NOT describe the character, concept, or role this word represents in the book. 
    Focus strictly on the word's construction and likely origin of its parts.
    
    WORDS TO ANALYZE:
    {words_list}
    
    Return ONLY a JSON array of objects, one for each word:
    [
      {{
          "word": "TheWord",
          "roots": [
              {{ "morpheme": "string", "language": "string", "meaning": "string" }}
          ],
          "confidence": "high|medium|low",
          "notes": "Linguistic observations ONLY."
      }},
      ...
    ]
    """
    
    try:
        response = model.generate_content(prompt)
        text = _clean_json_response(response.text)
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  Error in batch etymology analysis: {e}")
        # Log errors for later retry
        error_path = DATA_DIR / "etymology_errors.json"
        existing_errors = []
        if error_path.exists():
            try:
                with open(error_path, "r") as f:
                    existing_errors = json.load(f)
            except: pass
        
        existing_errors.extend(words)
        with open(error_path, "w") as f:
            json.dump(list(set(existing_errors)), f, indent=2)
            
        return []

def analyze_etymology(word: str, model_name: str = LLM_MODEL) -> Dict:
    """Legacy wrapper for single word analysis."""
    results = analyze_etymology_batch([word], model_name)
    return results[0] if results else {}

def save_etymology(etymology_map: List[Dict], filename: str = "etymology.json"):
    """Save the etymology data to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(etymology_map, f, indent=2, ensure_ascii=False)
    return out_path

def load_etymology(filename: str = "etymology.json") -> List[Dict]:
    """Load etymology list from disk, applying any manual overrides."""
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    overrides_path = DATA_DIR / "etymology_overrides.json"
    if overrides_path.exists():
        with open(overrides_path, "r", encoding="utf-8") as f:
            overrides = json.load(f)
        if overrides:
            override_map = {o["word"].lower(): o for o in overrides}
            for entry in entries:
                override = override_map.get(entry["word"].lower())
                if override:
                    entry.update({k: v for k, v in override.items() if k != "word"})

    return entries
