"""
Frequency: Maps neologism occurrences across pages.
"""

import json
import re
from typing import List, Dict
from pathlib import Path

# Add project root to path
import sys
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config.settings import DATA_DIR

def build_frequency_map(lexicon_words: List[str], chunks: List[Dict]) -> Dict:
    """
    Count occurrences of each unique neologism per page across all chunks.
    Result format: { "Word": [{"page_number": 1, "count": 2}, ...] }
    """
    # Create empty map for each word
    # Using a dictionary for page counts per word to easily aggregate
    freq_data = {word: {} for word in lexicon_words}
    
    for chunk in chunks:
        page = chunk["page_number"]
        text = chunk["text"]
        
        for word in lexicon_words:
            # Simple case-insensitive count. 
            # We use a pattern to ensure word boundaries.
            pattern = rf"\b{re.escape(word)}\b"
            matches = re.findall(pattern, text, re.IGNORECASE)
            count = len(matches)
            
            if count > 0:
                freq_data[word][page] = freq_data[word].get(page, 0) + count
                
    # Reformat for the JSON structure: {word: [{page_number, count}]}
    final_map = {}
    for word, page_counts in freq_data.items():
        sorted_pages = sorted(
            [{"page_number": p, "count": c} for p, c in page_counts.items()],
            key=lambda x: x["page_number"]
        )
        final_map[word] = sorted_pages
        
    return final_map

def save_frequency(freq_map: Dict, filename: str = "frequency.json"):
    """Save the frequency map to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(freq_map, f, indent=2, ensure_ascii=False)
    return out_path

def load_frequency(filename: str = "frequency.json") -> Dict:
    """Load frequency map from disk."""
    path = DATA_DIR / filename
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
