import json

def normalize_payload(payload: dict) -> str:
    """
    Creates a deterministic JSON string from the request payload.
    Sorted keys, no whitespace. Used for exact-match cache keys.
    """
    # Only include fields that affect the LLM output
    cache_relevant = {
        "model": payload.get("model"),
        "messages": payload.get("messages"),
        "temperature": payload.get("temperature")
    }
    return json.dumps(cache_relevant, sort_keys=True, separators=(",", ":"))