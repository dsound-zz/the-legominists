"""
LLM: Sends retrieved chunks + your question to Gemini for a grounded answer.

This is the "mixing console" — it takes retrieved passages and your question,
then Gemini produces the final response anchored in the context.
"""

import os
import google.generativeai as genai


def ask_with_context(
    question: str,
    context_chunks: list[dict],
    model_name: str = "gemini-2.0-flash",
    max_tokens: int = 1024,
) -> str:
    """
    Send a question to Gemini along with retrieved context chunks.
    Each chunk includes its page number for citation.
    """
    # Configure API key
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

    # Format context with page numbers for citation
    context_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"[Source {i} — Page {chunk['page_number']}]\n{chunk['text']}"
        )
    context_block = "\n\n---\n\n".join(context_parts)

    system_prompt = """You are a scholarly assistant helping analyze Gurdjieff's 
"Beelzebub's Tales to His Grandson." You have been given relevant passages 
from the book. 

Rules:
- Answer based ONLY on the provided passages
- Always cite page numbers: (p. XX)
- If the passages don't contain enough info, say so honestly
- Preserve Gurdjieff's specific terminology (don't simplify his coined words)
- Be precise but accessible"""

    user_message = f"""Here are relevant passages from the book:

{context_block}

---

Question: {question}"""

    # Initialize Gemini model
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_prompt,
    )

    import time
    print(f"[llm] calling {model_name} with {len(context_chunks)} chunks", flush=True)
    t0 = time.time()

    # Generate response (45s HTTP timeout so the thread doesn't outlive the server timeout)
    response = model.generate_content(
        user_message,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
        ),
        request_options={"timeout": 45},
    )
    print(f"[llm] response received in {time.time() - t0:.1f}s", flush=True)

    return response.text
