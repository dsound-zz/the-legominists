"""
LLM: Sends retrieved chunks + your question to Gemini for a grounded answer.
"""

import os
import time
from google import genai
from google.genai import types


def ask_with_context(
    question: str,
    context_chunks: list[dict],
    model_name: str = "gemini-2.5-flash",
    max_tokens: int = 1024,
) -> str:
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

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

    print(f"[llm] calling {model_name} with {len(context_chunks)} chunks", flush=True)
    t0 = time.time()

    response = client.models.generate_content(
        model=model_name,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )

    print(f"[llm] response received in {time.time() - t0:.1f}s", flush=True)
    return response.text
