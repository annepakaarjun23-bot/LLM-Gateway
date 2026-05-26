import hashlib

def hash_api_key(raw_key: str) -> str:
    """Generates a SHA-256 hex digest of the raw API key."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()