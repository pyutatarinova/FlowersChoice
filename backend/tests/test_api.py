import time

import pytest


def _unique_email(prefix: str = "test") -> str:
    return f"{prefix}+{int(time.time() * 1000)}@example.com"


def _get_any_plant_id(client) -> int:
    resp = client.get("/api/plants-rating", query_string={"page": 1, "per_page": 1})
    assert resp.status_code == 200
    data = resp.get_json()
    plants = data.get("plants") if isinstance(data, dict) else None
    if not plants:
        pytest.skip("No plants available in database")
    return int(plants[0]["id"])


def _register_user(client, email: str | None = None):
    email = email or _unique_email("register")
    payload = {
        "name": "Test User",
        "email": email,
        "password": "password123",
        "has_pets": True,
        "has_allergies": False,
        "preferences": "low maintenance plants",
    }
    resp = client.post("/api/register", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    token = data.get("token")
    assert token
    assert client.get("/api/userinfo", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    return {
        "email": email,
        "password": payload["password"],
        "token": token,
    }


def test_get_plant_details_returns_full_payload(client):
    plant_id = _get_any_plant_id(client)
    resp = client.get(f"/api/plants/{plant_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    plant = data.get("plant", {})
    assert plant.get("id") == plant_id
    assert isinstance(plant.get("features"), dict)
    assert plant.get("plant_name")


def test_get_plant_details_returns_404_for_unknown_id(client):
    resp = client.get("/api/plants/999999999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data.get("success") is False


def test_register_persists_user_and_token(client):
    user = _register_user(client)
    resp = client.get("/api/userinfo", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    assert data.get("user", {}).get("email") == user["email"]


def test_login_updates_token(client):
    user = _register_user(client, email=_unique_email("login"))
    resp = client.post("/api/login", json={"email": user["email"], "password": user["password"]})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    new_token = data.get("token")
    assert new_token
    assert client.get("/api/userinfo", headers={"Authorization": f"Bearer {new_token}"}).status_code == 200


def test_register_rejects_weak_password(client):
    payload = {
        "name": "Weak Password",
        "email": _unique_email("weak"),
        "password": "abcdef",
    }
    resp = client.post("/api/register", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data.get("success") is False


def test_save_favourites_creates_user_plants(client):
    user = _register_user(client, email=_unique_email("fav"))
    plant_id = _get_any_plant_id(client)
    resp = client.post(
        "/api/savefavourites",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True

    resp = client.get("/api/userplants", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    assert any(p.get("id") == plant_id for p in data.get("favorite", []))


def test_add_my_plant_updates_flags(client):
    user = _register_user(client, email=_unique_email("myplant"))
    plant_id = _get_any_plant_id(client)
    client.post(
        "/api/savefavourites",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    resp = client.post(
        "/api/add-my-plant",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True

    resp = client.get("/api/userplants", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert all(p.get("id") != plant_id for p in data.get("favorite", []))
    assert any(p.get("id") == plant_id for p in data.get("my_plant", []))


def test_update_score_and_notes_persists(client):
    user = _register_user(client, email=_unique_email("score"))
    plant_id = _get_any_plant_id(client)
    client.post(
        "/api/add-my-plant",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )

    resp = client.post(
        "/api/update-plant-score",
        json={"plant_id": plant_id, "score": 4.5},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    assert resp.get_json().get("success") is True

    resp = client.post(
        "/api/update-plant-notes",
        json={"plant_id": plant_id, "notes": "Needs bright light"},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    assert resp.get_json().get("success") is True

    resp = client.get("/api/userplants", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    my_plants = data.get("my_plant", [])
    plant = next(p for p in my_plants if p.get("id") == plant_id)
    assert float(plant.get("score")) == 4.5
    assert plant.get("notes") == "Needs bright light"


def test_update_watering_schedule_persists(client):
    user = _register_user(client, email=_unique_email("watering"))
    plant_id = _get_any_plant_id(client)
    client.post(
        "/api/add-my-plant",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )

    resp = client.post(
        "/api/update-plant-watering",
        json={
            "plant_id": plant_id,
            "watering_schedule_days": 5,
            "last_watering_date": "2026-03-10",
            "watering_history": ["2026-03-01", "2026-03-06", "2026-03-10"],
            "watered_now": True,
        },
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    assert resp.get_json().get("success") is True

    resp = client.get("/api/userplants", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    my_plants = data.get("my_plant", [])
    plant = next(p for p in my_plants if p.get("id") == plant_id)

    assert plant.get("watering_schedule_days") == 5
    assert plant.get("last_watering_date") == "2026-03-10"
    assert plant.get("watering_history") == ["2026-03-01", "2026-03-06", "2026-03-10"]


def test_remove_plant_deletes_empty_row(client):
    user = _register_user(client, email=_unique_email("remove"))
    plant_id = _get_any_plant_id(client)
    client.post(
        "/api/savefavourites",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    resp = client.post(
        "/api/remove-plant",
        json={"plant_id": plant_id, "flag": "favorite"},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    assert resp.get_json().get("success") is True

    resp = client.get("/api/userplants", headers={"Authorization": f"Bearer {user['token']}"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert all(p.get("id") != plant_id for p in data.get("favorite", []))
    assert all(p.get("id") != plant_id for p in data.get("my_plant", []))


def test_userplants_returns_favorite_and_my_plant(client):
    user = _register_user(client, email=_unique_email("list"))
    plant_id = _get_any_plant_id(client)
    client.post(
        "/api/savefavourites",
        json={"plant_id": plant_id},
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    resp = client.get(
        "/api/userplants",
        headers={"Authorization": f"Bearer {user['token']}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("success") is True
    assert isinstance(data.get("favorite"), list)
    assert isinstance(data.get("my_plant"), list)
    assert any(p.get("id") == plant_id for p in data.get("favorite", []))
