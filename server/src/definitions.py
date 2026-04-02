"""
Definitions: Generates RAG-grounded definitions for neologisms.
"""

import os
import json
import time
from typing import List, Dict
import google.generativeai as genai
from pathlib import Path
import sys

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config.settings import LLM_MODEL, DATA_DIR, DB_DIR, COLLECTION_NAME
from src.retriever import get_collection, query_similar

def generate_definitions_batch(words: List[str], model_name: str = LLM_MODEL) -> List[Dict]:
    """Generate definitions for a batch of words based ONLY on book passages."""
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel(model_name=model_name)
    
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    
    combined_context = []
    for word in words:
        hits = query_similar(collection, word, n_results=5) # Reduced to 5 for batching to save tokens
        if hits:
            word_context = f"WORD: {word}\n"
            word_context += "\n".join([f"Passage (Page {h['page_number']}): {h['text']}" for h in hits])
            combined_context.append(word_context)
    
    if not combined_context:
        return []
    
    context_str = "\n\n---\n\n".join(combined_context)
    
    prompt = f"""
    Based ONLY on the provided passages from Gurdjieff's "Beelzebub's Tales to His Grandson", describe who or what each of these words represents: {', '.join(words)}.
    
    CRITICAL: 
    - Do NOT infer meaning from etymology.
    - Do NOT use outside knowledge.
    - If the passages don't give enough context for a word, say so clearly in its definition.
    - Focus on the role, purpose, or nature of the entity as described in the text.
    
    Passages by Word:
    {context_str}
    
    Return a JSON array of objects, one per word:
    [
      {{
        "word": "word_name",
        "definition": "Detailed description from the text",
        "role": "Short one-liner (e.g. 'Beelzebub's servant', 'A cosmic law')",
        "key_quotes": [
          {{ "text": "Exact quote from passages", "page_number": 123 }}
        ]
      }}
    ]
    Return ONLY valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown if present
        if text.startswith("```json"):
            text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
        elif text.startswith("```"):
            text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
        
        text = text.strip()
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  Error in batch definition generation: {e}")
        return []

def save_definitions(definitions: List[Dict], filename: str = "definitions.json"):
    """Save the definitions data to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(definitions, f, indent=2, ensure_ascii=False)
    return out_path

def load_definitions(filename: str = "definitions.json") -> List[Dict]:
    """Load definitions list from disk."""
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
