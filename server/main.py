import os
import sys
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

# Add current directory to path for imports
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

# Load environment variables
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Settings & Existing Modules
from config.settings import (
    DB_DIR, COLLECTION_NAME, CONTEXT_CHUNKS,
    LLM_MODEL, LLM_MAX_TOKENS,
)
from src.retriever import get_collection, query_similar
from src.llm import ask_with_context
from src.lexicon import load_lexicon
from src.etymology import load_etymology
from src.definitions import load_definitions
from src.frequency import load_frequency

app = FastAPI(title="Beelzebub Explorer API")

# Enable CORS for Vite frontend (local and production)
frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    citations: List[Dict]

# --- Global Data Cache ---
# In a real app, we'd use a database, but for this research tool, 
# loading JSONs into memory is sufficient.

_lexicon_cache = None
_etymology_cache = None
_frequency_cache = None
_definitions_cache = None

def get_data():
    global _lexicon_cache, _etymology_cache, _frequency_cache, _definitions_cache
    if _lexicon_cache is None:
        _lexicon_cache = load_lexicon()
    if _etymology_cache is None:
        _etymology_cache = load_etymology()
    if _frequency_cache is None:
        _frequency_cache = load_frequency()
    if _definitions_cache is None:
        defs_list = load_definitions()
        _definitions_cache = {d["word"].lower(): d for d in defs_list}
    return _lexicon_cache, _etymology_cache, _frequency_cache

# --- Endpoints ---

@app.get("/api/lexicon")
async def get_lexicon():
    lexicon, etymology, frequency = get_data()
    
    # We want a list of unique words with counts and primary root
    # frequency is a dict: word -> list of {page_number, count}
    word_stats = []
    
    # Use etymology as the base for unique neologisms
    for item in etymology:
        word = item["word"]
        freq_data = frequency.get(word, [])
        total_count = sum(p["count"] for p in freq_data)
        
        # Primary root (first one in list)
        primary_lang = "Unknown"
        languages = []
        _noise = {"unknown", "unclear", "phonetic", "composite", "connective/euphonic", "various/uncertain"}
        if item.get("roots"):
            primary_lang = item["roots"][0].get("language", "Unknown")
            seen = set()
            for root in item["roots"]:
                for lang in root.get("language", "").split("/"):
                    lang = lang.strip()
                    if lang.lower() not in _noise and lang not in seen:
                        seen.add(lang)
                        languages.append(lang)

        word_stats.append({
            "word": word,
            "count": total_count,
            "primary_language": primary_lang,
            "languages": languages,
            "pages": len(freq_data)
        })
        
    return sorted(word_stats, key=lambda x: x["count"], reverse=True)

@app.get("/api/word/{word}")
async def get_word_detail(word: str):
    lexicon, etymology, frequency = get_data()

    # Find etymology
    ety_item = next((item for item in etymology if item["word"].lower() == word.lower()), None)
    if not ety_item:
        actual_word = next((w for w in frequency.keys() if w.lower() == word.lower()), word)
    else:
        actual_word = ety_item["word"]

    freq_data = frequency.get(actual_word, [])
    definition = _definitions_cache.get(actual_word.lower()) if _definitions_cache else None

    # Get top 5 passages from ChromaDB
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    hits = query_similar(collection, actual_word, n_results=5)

    return {
        "word": actual_word,
        "etymology": ety_item,
        "definition": definition,
        "frequency": freq_data,
        "passages": hits,
        "total_count": sum(p["count"] for p in freq_data)
    }

@app.post("/api/query", response_model=QueryResponse)
async def post_query(request: QueryRequest):
    import asyncio
    collection = get_collection(DB_DIR, COLLECTION_NAME)
    hits = query_similar(collection, request.question, n_results=CONTEXT_CHUNKS)

    if not hits:
        return QueryResponse(answer="No relevant passages found.", citations=[])

    loop = asyncio.get_running_loop()
    try:
        answer = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: ask_with_context(
                    question=request.question,
                    context_chunks=hits,
                    model_name=LLM_MODEL,
                    max_tokens=LLM_MAX_TOKENS,
                )
            ),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        return QueryResponse(answer="The query timed out. Try a more specific question.", citations=hits)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    return QueryResponse(answer=answer, citations=hits)

@app.get("/api/heatmap")
async def get_heatmap():
    lexicon, etymology, frequency = get_data()
    
    # Group into 50-page buckets
    BUCKET_SIZE = 50
    MAX_PAGE = 1100
    num_buckets = (MAX_PAGE // BUCKET_SIZE) + 1
    buckets = [f"{i*BUCKET_SIZE}-{(i+1)*BUCKET_SIZE-1}" for i in range(num_buckets)]
    
    # Filter to top 30 most frequent words
    sorted_words = sorted(
        [(word, sum(p["count"] for p in freqs)) for word, freqs in frequency.items() if word],
        key=lambda x: x[1], 
        reverse=True
    )[:30]
    top_words = [w[0] for w in sorted_words]
    
    matrix = []
    for word in top_words:
        row = [0] * num_buckets
        for entry in frequency.get(word, []):
            page = entry["page_number"]
            bucket_idx = page // BUCKET_SIZE
            if bucket_idx < num_buckets:
                row[bucket_idx] += entry["count"]
        matrix.append(row)
        
    return {
        "words": top_words,
        "pages": buckets,
        "matrix": matrix
    }

@app.get("/api/stats")
async def get_stats():
    lexicon, etymology, frequency = get_data()
    
    total_neologisms = len(etymology)
    total_occurrences = sum(sum(p["count"] for p in data) for data in frequency.values())
    
    # Most frequent
    sorted_words = sorted(
        [(word, sum(p["count"] for p in freqs)) for word, freqs in frequency.items() if word],
        key=lambda x: x[1], 
        reverse=True
    )
    
    # Most diverse chapters (bucketed pages)
    # We'll just say top 100 pages for now, or just aggregate by page.
    page_diversity = {}
    for word, freqs in frequency.items():
        for f in freqs:
            page_diversity[f["page_number"]] = page_diversity.get(f["page_number"], 0) + 1
            
    top_pages = sorted(page_diversity.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_neologisms": total_neologisms,
        "total_occurrences": total_occurrences,
        "most_frequent": sorted_words[:10],
        "most_diverse_pages": top_pages,
        "total_pages": 1100
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
