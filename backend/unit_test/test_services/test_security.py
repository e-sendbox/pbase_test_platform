from app.services.security import generate_salt, get_password_hash, verify_password


def test_password_hash_roundtrip() -> None:
    raw = "secret-password"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed)


def test_generate_salt_returns_string() -> None:
    salt = generate_salt()
    assert isinstance(salt, str)
    assert len(salt) > 0
