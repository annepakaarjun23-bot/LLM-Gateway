from app.utils.hashing import hash_api_key

def test_hash_api_key_consistency():
    key = "gwy_test_123"
    hash1 = hash_api_key(key)
    hash2 = hash_api_key(key)
    assert hash1 == hash2
    assert isinstance(hash1, str)
    assert len(hash1) == 64  # SHA-256 hex digest length

def test_hash_api_key_different_inputs():
    hash1 = hash_api_key("gwy_test_1")
    hash2 = hash_api_key("gwy_test_2")
    assert hash1 != hash2