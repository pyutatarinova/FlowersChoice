import base64
import json
import os

# import psycopg2
import random
import psycopg2
import sys
from datetime import date, datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from typing import Any, List, Tuple

import jwt
from dotenv import load_dotenv
from flasgger import Swagger
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add ml_services to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "ml_services"))

from plant_repository import PlantRepository

app = Flask(__name__)
CORS(app)
# Конфигурация Swagger с API Key
app.config["SWAGGER"] = {
    "title": "FlowersChoice API",
    "uiversion": 3,
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Введите: Bearer <ваш_токен>",
        }
    },
    "security": [{"Bearer": []}],
}
swagger = Swagger(app)

PORT = 3001
load_dotenv(dotenv_path=Path(__file__).parent / ".env")


JWT_SECRET = os.getenv("JWT_SECRET", "SUPER_SECRET_KEY")
JWT_ALGO = "HS256"
JWT_EXPIRE_MIN = 60


# -----------------------------
# Helpers
# -----------------------------
def generate_vector_embedding(dim=768):
    return [random.uniform(-1.0, 1.0) for _ in range(dim)]


def create_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def is_password_valid(password: str) -> bool:
    if not isinstance(password, str):
        return False
    if len(password) < 6:
        return False
    has_letter = any(ch.isalpha() for ch in password)
    has_digit = any(ch.isdigit() for ch in password)
    return has_letter and has_digit


# -----------------------------
# Middleware (auth decorator)
# -----------------------------
def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Требуется авторизация"}), 401

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Срок действия токена истёк"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Неверный токен"}), 401
        except Exception as e:
            print("JWT decode error:", e)
            return jsonify({"success": False, "message": "Ошибка токена"}), 401

        return f(payload, *args, **kwargs)

    return wrapper


def auth_optional(f):
    """Decorator that extracts user_id if token is present, otherwise uses a system user_id."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        user_payload = {"user_id": -1}  # Default system user_id

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                user_payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
                # print(f"Token decoded successfully, user_id: {user_payload.get('user_id')}")
            except jwt.ExpiredSignatureError:
                print("Token expired, using system user_id")
                user_payload = {"user_id": -1}
            except jwt.InvalidTokenError as e:
                print(f"Invalid token: {e}, using system user_id")
                user_payload = {"user_id": -1}
            except Exception as e:
                print(f"Unexpected error during token decode: {e}, using system user_id")
                user_payload = {"user_id": -1}

        return f(user_payload, *args, **kwargs)

    return wrapper


# -----------------------------
# Register
# -----------------------------
@app.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - password
          properties:
            name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "password123"
            has_pets:
              type: boolean
              example: false
            has_allergies:
              type: boolean
              example: false
            preferences:
              type: string
              example: "low maintenance plants"
    responses:
      200:
        description: Registration successful
        schema:
          type: object
          properties:
            success:
              type: boolean
            token:
              type: string
              description: JWT token for authentication
            message:
              type: string
      400:
        description: Missing required fields
      500:
        description: Database error
    """
    profile = request.get_json()
    if not profile or not all(k in profile for k in ["name", "email", "password"]):
        return jsonify({"success": False, "message": "Некорректные данные"}), 400

    if not is_password_valid(profile.get("password")):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Пароль должен быть не короче 6 символов и содержать буквы и цифры",
                }
            ),
            400,
        )

    encoded_password = base64.b64encode(profile["password"].encode("utf-8")).decode("utf-8")

    features = {
        "has_children": profile.get("has_children"),
        "has_pets": profile.get("has_pets"),
        "has_allergies": profile.get("has_allergies"),
        "preferences": profile.get("preferences"),
    }

    embedding = generate_vector_embedding()

    try:
        repo = PlantRepository()
        # If email already exists, show a clear registration warning.
        if repo.get_user_by_email(profile["email"]):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Почта уже зарегистрирована. Войдите или используйте другую",
                    }
                ),
                409,
            )

        user_id = repo.register_user(
            name=profile["name"],
            email=profile["email"],
            encoded_password=encoded_password,
            features=features,
            embedding=embedding,
            created_at=date.today(),
            updated_at=date.today(),
        )

        token = create_token(user_id, profile["email"])

        repo.update_user_token(user_id, token)  # Update token in database

        return jsonify({"success": True, "token": token, "message": "Регистрация успешна"})

    except psycopg2.IntegrityError as e:
        print("Ошибка регистрации (email уже существует):", e)
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Почта уже зарегистрирована. Войдите или используйте другую",
                }
            ),
            409,
        )
    except Exception as e:
        print("Ошибка при сохранении в БД:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


# -----------------------------
# Login
# -----------------------------
@app.route("/api/login", methods=["POST"])
def login():
    """
    User login
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "password123"
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            success:
              type: boolean
            token:
              type: string
              description: JWT token for authentication
            message:
              type: string
      400:
        description: Missing required fields
      401:
        description: Invalid password
      404:
        description: User not found
      500:
        description: Server error
    """
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"success": False, "message": "Некорректные данные"}), 400

    encoded_password = base64.b64encode(data["password"].encode("utf-8")).decode("utf-8")

    try:
        repo = PlantRepository()
        user_data = repo.get_user_by_email(data["email"])

        if not user_data:
            return jsonify({"success": False, "message": "Пользователь не найден"}), 404

        user_id, stored_password = user_data

        if stored_password != encoded_password:
            return jsonify({"success": False, "message": "Неверный пароль"}), 401

        new_token = create_token(user_id, data["email"])
        repo.update_user_token(user_id, new_token)

        return jsonify({"success": True, "token": new_token, "message": "Успешный вход"})

    except Exception as e:
        print("Ошибка при входе:", e)
        return jsonify({"success": False, "message": "Ошибка входа"}), 500


# -----------------------------
# User Info (with middleware)
# -----------------------------
@app.route("/api/userinfo", methods=["GET"])
@auth_required
def userinfo(user_payload):
    """
    Get user information
    ---
    tags:
      - User
    security:
      - Bearer: []
    responses:
      200:
        description: User information retrieved
        schema:
          type: object
          properties:
            success:
              type: boolean
            user:
              type: object
              properties:
                user_id:
                  type: integer
                name:
                  type: string
                email:
                  type: string
                has_pets:
                  type: boolean
                has_allergies:
                  type: boolean
                preferences:
                  type: string
      401:
        description: Unauthorized or invalid token
      404:
        description: User not found
      500:
        description: Server error
    """
    user_id = user_payload.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Некорректный токен"}), 401

    try:
        repo = PlantRepository()
        user_info = repo.get_user_info(user_id)

        if not user_info:
            return jsonify({"success": False, "message": "Пользователь не найден"}), 404

        return jsonify({"success": True, "user": user_info})

    except Exception as e:
        print("Ошибка в /api/userinfo:", e)
        return jsonify({"success": False, "message": "Ошибка получения данных"}), 500


@app.route("/api/savefavourites", methods=["OPTIONS"])
def savefavourites_options():
    """Handle CORS preflight request for savefavourites"""
    return "", 200


@app.route("/api/savefavourites", methods=["POST"])
@auth_required
def save_favourites(user_payload):
    """
    Save plant to favorites
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - plant_id
          properties:
            plant_id:
              type: integer
              example: 1
    responses:
      200:
        description: Plant added to favorites
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
      400:
        description: Missing plant_id
      401:
        description: Unauthorized
      409:
        description: Plant already saved
      500:
        description: Database error
    """
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data:
        return jsonify({"success": False, "message": "Ожидался plant_id"}), 400

    try:
        plant_id = int(data["plant_id"])
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "plant_id должен быть целым числом"}), 400

    try:
        repo = PlantRepository()

        # Check if plant already exists
        if repo.check_user_plant_exists(user_id, plant_id):
            return jsonify({"success": False, "message": "Растение уже сохранено"}), 409

        repo.add_user_plant_favorite(user_id, plant_id)

        return jsonify({"success": True, "message": "Растение добавлено в избранное"})

    except Exception as e:
        print("Ошибка при сохранении избранного:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


@app.route("/api/add-my-plant", methods=["OPTIONS"])
def add_my_plant_options():
    """Handle CORS preflight request for add-my-plant"""
    return "", 200


@app.route("/api/add-my-plant", methods=["POST"])
@auth_required
def add_my_plant(user_payload):
    """
    Add plant to user's collection
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - plant_id
          properties:
            plant_id:
              type: integer
              example: 1
    responses:
      200:
        description: Plant added to collection
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
      400:
        description: Missing plant_id
      401:
        description: Unauthorized
      500:
        description: Database error
    """
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data:
        return jsonify({"success": False, "message": "Ожидался plant_id"}), 400

    plant_id = data["plant_id"]

    try:
        repo = PlantRepository()
        message = repo.add_or_update_user_my_plant(user_id, plant_id)

        return jsonify({"success": True, "message": message})

    except Exception as e:
        print("Ошибка при добавлении растения:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


@app.route("/api/userplants", methods=["GET"])
@auth_required
def user_my_plants(user_payload):
    """
    Get user's plants (favorites and my_plants)
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    responses:
      200:
        description: User's plants retrieved
        schema:
          type: object
          properties:
            success:
              type: boolean
            favorite:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  plant_name:
                    type: string
                  score:
                    type: number
                  notes:
                    type: string
                  light_requirements:
                    type: string
                  watering_frequency:
                    type: string
                  comfort_temp:
                    type: string
                  mature_size:
                    type: string
                  brief_description:
                    type: string
                  photo:
                    type: string
            my_plant:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  plant_name:
                    type: string
                  score:
                    type: number
                  notes:
                    type: string
                  light_requirements:
                    type: string
                  watering_frequency:
                    type: string
                  comfort_temp:
                    type: string
                  mature_size:
                    type: string
                  brief_description:
                    type: string
                  photo:
                    type: string
      401:
        description: Unauthorized
      500:
        description: Server error
    """
    user_id = user_payload.get("user_id")

    try:
        repo = PlantRepository()

        favorite_plants_data = repo.get_user_plants_by_flag(user_id, "favorite")
        my_plants_data = repo.get_user_plants_by_flag(user_id, "my_plant")

        # Format results
        favorite_plants = [_format_plant_response(p) for p in favorite_plants_data]
        my_plants = [_format_plant_response(p) for p in my_plants_data]

        return jsonify({"success": True, "favorite": favorite_plants, "my_plant": my_plants})

    except Exception as e:
        print("Ошибка в /api/userplants:", e)
        return jsonify({"success": False, "message": "Ошибка получения растений пользователя"}), 500


# -----------------------------
# Search Similar Plants - ML
# -----------------------------
def _build_prompt(search_criteria: dict) -> str: # noqa: C901
    """Build a robust search query string from questionnaire payload."""
    if not isinstance(search_criteria, dict):
        return ""

    def _clean_text(value: Any) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            value = str(value)
        return " ".join(value.replace("\n", " ").replace("\r", " ").strip().split())

    def _humanize_tag(tag: Any) -> str:
        text = _clean_text(tag).strip(" ,.;")
        if not text:
            return ""
        normalized = text.lower().replace("-", "_").replace(" ", "_")
        tag_map = {
            "safe_for_pets": "safe for pets, non-toxic for cats and dogs",
            "safe for pets": "safe for pets, non-toxic for cats and dogs",
            "flowering": "flowering plant",
            "colorful_leaves": "colorful foliage",
            "colorful leaves": "colorful foliage",
            "shade_tolerant": "tolerates low light or partial shade",
            "long_lasting": "durable, long-living plant",
            "bright_window": "bright light, near sunny window",
            "light_room": "bright indirect light room",
            "shade": "low light / shade",
            "balcony": "balcony placement, often seasonal",
            "bathroom": "high humidity placement, suitable for bathroom",
            "high_care": "needs frequent care and watering",
            "medium_care": "moderate care, regular weekly watering",
            "low_care": "low maintenance, drought tolerant",
            "high_humidity": "prefers high humidity",
            "air_purifying": "air-purifying benefits",
            "decorative": "strong decorative value",
            "greenery": "lush greenery effect",
            "photo_background": "visually expressive as photo background",
            "large_floor": "large floor plant",
            "hanging": "trailing / hanging growth habit",
            "table_top": "compact tabletop size",
            "any_size": "size is flexible",
            "partner": "gift for partner, romantic tone",
            "colleague": "gift for colleague, restrained style",
            "family": "gift for family member, warm and caring tone",
            "beginner": "recipient is beginner plant owner",
            "expert": "recipient is experienced plant owner",
            "birthday": "birthday or anniversary gift",
            "romantic": "romantic occasion",
            "care": "gratitude / support / care occasion",
            "symbolic": "symbolic gift (new start, move, career)",
            "expressive": "bright, unusual, expressive appearance",
            "minimalist": "minimalist and calm green look",
            "form_accent": "accent on leaf or trunk form",
            "office_gift": "small plant suitable for desk",
            "sunny_window": "sunny windowsill placement",
            "office": "office environment suitability",
            "living_area": "living room or kitchen placement",
            "large_volume": "large plant volume",
        }
        mapped = tag_map.get(normalized)
        if mapped:
            return mapped
        return text.replace("_", " ")

    def _extract_text_and_tags(value: Any) -> Tuple[str, List[str]]:
        if value is None:
            return "", []
        if isinstance(value, dict):
            text = _clean_text(value.get("text"))
            raw_tags = value.get("tags", [])
        else:
            text = _clean_text(value)
            raw_tags = []

        tags: List[str] = []
        if isinstance(raw_tags, list):
            for tag in raw_tags:
                t = _humanize_tag(tag)
                if t:
                    tags.append(t)
        elif isinstance(raw_tags, str):
            for tag in raw_tags.split(","):
                t = _humanize_tag(tag)
                if t:
                    tags.append(t)
        return text, tags

    def _dedupe_keep_order(values: List[str]) -> List[str]:
        seen = set()
        result: List[str] = []
        for item in values:
            cleaned = _clean_text(item)
            if not cleaned:
                continue
            key = cleaned.lower()
            if key in seen:
                continue
            seen.add(key)
            result.append(cleaned)
        return result

    has_gift_answers = any(search_criteria.get(k) for k in ("recipient", "occasion", "style", "gift_location"))
    scenario = "gift" if has_gift_answers else "personal"

    if scenario == "gift":
        field_order = [
            ("recipient", "recipient profile"),
            ("occasion", "gift occasion"),
            ("style", "visual style"),
            ("gift_location", "future location"),
            ("extra_notes", "extra constraints"),
        ]
        scenario_text = "gift recommendation"
    else:
        field_order = [
            ("location", "placement and light"),
            ("care_regime", "care effort"),
            ("function", "purpose"),
            ("size_type", "size and growth form"),
            ("extra_notes", "extra constraints"),
        ]
        scenario_text = "personal plant selection"

    structured_blocks: List[str] = []
    all_texts: List[str] = []
    all_tags: List[str] = []

    for key, label in field_order:
        text, tags = _extract_text_and_tags(search_criteria.get(key))
        all_texts.extend([text] if text else [])
        all_tags.extend(tags)
        if text or tags:
            block_parts: List[str] = []
            if text:
                block_parts.append(f"text: {text}")
            if tags:
                block_parts.append(f"tags: {', '.join(_dedupe_keep_order(tags))}")
            structured_blocks.append(f"{label}: " + "; ".join(block_parts))

    all_texts = _dedupe_keep_order(all_texts)
    all_tags = _dedupe_keep_order(all_tags)

    if not structured_blocks and not all_texts and not all_tags:
        return ""

    summary_bits: List[str] = []
    if all_texts:
        summary_bits.append("user intent: " + " | ".join(all_texts))
    if all_tags:
        summary_bits.append("key preferences: " + ", ".join(all_tags))

    priority_fields = (
        "light_requirements, watering_frequency, maintenance_level, humidity_preference, "
        "mature_size, growth_rate, toxicity, flowering, fragrance, health_benefits, brief_description"
    )

    prompt_parts = [
        "query: find the most relevant indoor plants in database",
        f"search type: {scenario_text}",
        f"priority plant fields: {priority_fields}",
    ]
    if summary_bits:
        prompt_parts.append(" | ".join(summary_bits))
    prompt_parts.extend(structured_blocks)

    return ". ".join(_dedupe_keep_order(prompt_parts))


def _format_plant_response(plant_data: dict) -> dict:
    """Format plant data for frontend response with desired fields."""
    desired_features = [
        "light_requirements",
        "watering_frequency",
        "comfort_temp",
        "mature_size",
        "brief_description",
        "photo",
    ]

    features = plant_data.get("features") or {}
    if isinstance(features, str):
        try:
            features = json.loads(features)
        except json.JSONDecodeError:
            features = {}

    merged = {}

    # Extract only desired features from the features JSONB
    if isinstance(features, dict):
        for key in desired_features:
            if key in features:
                merged[key] = features[key]

    # Add primary fields (ensure they override feature keys)
    merged["id"] = plant_data.get("id")
    merged["plant_name"] = plant_data.get("name")
    merged["score"] = plant_data.get("score", 0.0) if plant_data.get("score") is not None else 0.0
    merged["notes"] = plant_data.get("notes", "")

    return merged


def _format_plant_response_with_rating(plant_data: dict) -> dict:
    """Format plant data for frontend response including rating information."""
    result = _format_plant_response(plant_data)
    result["avg_score"] = plant_data.get("avg_score", 0.0)
    result["rating_count"] = plant_data.get("rating_count", 0)
    result["rating_position"] = plant_data.get("rating_position", 0)
    return result


@app.route("/api/search-plants", methods=["POST"])
@auth_optional
def search_plants(user_payload):
    """
    Search for plants based on user criteria
    ---
    tags:
      - Plants
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            location:
              type: object
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            care_regime:
              type: object
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            function:
              type: object
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            size_type:
              type: object
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            extra_notes:
              type: object
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            recipient:
              type: object
              description: For gift search
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
            occasion:
              type: object
              description: For gift search
              properties:
                text:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
    responses:
      200:
        description: Plants found
        schema:
          type: array
          items:
            type: object
            properties:
              plant_id:
                type: integer
              name:
                type: string
              description:
                type: string
      400:
        description: Missing search criteria
      500:
        description: Search service error
    """
    try:
        from search_similar import PlantSearchService

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Ожидались критерии поиска"}), 400
        print(data)
        # Build search prompt from criteria
        prompt = _build_prompt(data)
        print(prompt)
        if not prompt or not prompt.strip():
            return jsonify({"success": False, "message": "Пожалуйста, укажите критерии поиска"}), 400

        # Search for similar plants
        user_id = user_payload.get("user_id")
        service = PlantSearchService()
        results = service.find_similar_plants(prompt, user_id=user_id, top_k=10)

        # Format results for frontend
        formatted_results = []
        for plant in results:
            formatted_plant = _format_plant_response(plant)
            formatted_results.append(formatted_plant)

        # return jsonify({
        #     # "success": True,
        #     "plants": formatted_results
        # })
        return jsonify(formatted_results)

    except ImportError as e:
        print("Ошибка импорта сервиса поиска:", e)
        return jsonify({"success": False, "message": "Сервис поиска недоступен"}), 500

    except Exception as e:
        print("Ошибка при поиске растений:", e)
        return jsonify({"success": False, "message": "Ошибка при поиске растений"}), 500


@app.route("/api/remove-plant", methods=["POST"])
@auth_required
def remove_plant(user_payload):
    """
    Remove plant from user's collection
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - plant_id
            - flag
          properties:
            plant_id:
              type: integer
              example: 1
            flag:
              type: string
              enum: ['favorite', 'my_plant']
              example: "favorite"
              description: "Which flag to set to FALSE: 'favorite' removes from favorites, 'my_plant' removes from user's collection"
    responses:
      200:
        description: Plant removed successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
      400:
        description: Missing required fields or invalid flag
      401:
        description: Unauthorized
      500:
        description: Database error
    """
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data or "flag" not in data:
        return jsonify({"success": False, "message": "Требуются plant_id и flag"}), 400

    plant_id = data["plant_id"]
    flag = data["flag"]

    # Validate flag
    if flag not in ["favorite", "my_plant"]:
        return jsonify({"success": False, "message": "flag должен быть 'favorite' или 'my_plant'"}), 400

    try:
        repo = PlantRepository()
        message = repo.remove_user_plant_flag(user_id, plant_id, flag)

        return jsonify({"success": True, "message": message})

    except ValueError as e:
        print(f"Ошибка валидации при удалении растения: {e}")
        return jsonify({"success": False, "message": str(e)}), 400

    except Exception as e:
        print(f"Ошибка при удалении растения: {e}")
        return jsonify({"success": False, "message": "Ошибка удаления из БД"}), 500


@app.route("/api/remove-plant", methods=["OPTIONS"])
def remove_plant_options():
    """Handle CORS preflight request for remove-plant"""
    return "", 200


@app.route("/api/update-plant-score", methods=["OPTIONS"])
def update_plant_score_options():
    """Handle CORS preflight request for update-plant-score"""
    return "", 200


@app.route("/api/update-plant-score", methods=["POST"])
@auth_required
def update_plant_score(user_payload):
    """
    Update score for a plant in user's collection
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - plant_id
            - score
          properties:
            plant_id:
              type: integer
              example: 1
            score:
              type: number
              example: 4
              description: "Score value (0-5 or any numeric value)"
    responses:
      200:
        description: Score updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
      400:
        description: Missing required fields or invalid values
      401:
        description: Unauthorized
      404:
        description: Plant not found in user's collection
      500:
        description: Database error
    """
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data or "score" not in data:
        return jsonify({"success": False, "message": "Требуются plant_id и score"}), 400

    plant_id = data["plant_id"]

    # Validate score is numeric
    try:
        score = float(data["score"])
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "score должен быть числовым значением"}), 400

    if score < 0 or score > 5:
        return jsonify({"success": False, "message": "score должен быть в диапазоне от 0 до 5"}), 400

    try:
        repo = PlantRepository()
        repo.update_plant_score(user_id, plant_id, score)

        return jsonify({"success": True, "message": "Оценка обновлена"})

    except Exception as e:
        print(f"Ошибка при обновлении оценки растения: {e}")
        if "not found" in str(e):
            return jsonify({"success": False, "message": "Растение не найдено в коллекции пользователя"}), 404
        return jsonify({"success": False, "message": "Ошибка обновления оценки"}), 500


@app.route("/api/update-plant-notes", methods=["OPTIONS"])
def update_plant_notes_options():
    """Handle CORS preflight request for update-plant-notes"""
    return "", 200


@app.route("/api/update-plant-notes", methods=["POST"])
@auth_required
def update_plant_notes(user_payload):
    """
    Update notes for a plant in user's collection
    ---
    tags:
      - Plants
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - plant_id
            - notes
          properties:
            plant_id:
              type: integer
              example: 1
            notes:
              type: string
              example: "Beautiful plant, needs bright light"
              description: "Notes text for the plant"
    responses:
      200:
        description: Notes updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
      400:
        description: Missing required fields
      401:
        description: Unauthorized
      404:
        description: Plant not found in user's collection
      500:
        description: Database error
    """
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data or "notes" not in data:
        return jsonify({"success": False, "message": "Требуются plant_id и notes"}), 400

    plant_id = data["plant_id"]
    notes = str(data["notes"]).strip()

    try:
        repo = PlantRepository()
        repo.update_plant_notes(user_id, plant_id, notes)

        return jsonify({"success": True, "message": "Заметки обновлены"})

    except Exception as e:
        print(f"Ошибка при обновлении заметок растения: {e}")
        if "not found" in str(e):
            return jsonify({"success": False, "message": "Растение не найдено в коллекции пользователя"}), 404
        return jsonify({"success": False, "message": "Ошибка обновления заметок"}), 500


@app.route("/api/plants-rating", methods=["GET"])
def plants_rating():
    """
    Get plants rating sorted by average user scores with pagination
    ---
    tags:
      - Plants
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
        description: "Page number (1-based)"
      - name: per_page
        in: query
        type: integer
        default: 20
        description: "Items per page (1-200)"
    responses:
      200:
        description: Plants rating retrieved
        schema:
          type: object
          properties:
            success:
              type: boolean
            total_count:
              type: integer
              description: "Total number of plants"
            page:
              type: integer
            per_page:
              type: integer
            total_pages:
              type: integer
            plants:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  plant_name:
                    type: string
                  avg_score:
                    type: number
                    description: "Average score from all user ratings"
                  rating_count:
                    type: integer
                    description: "Number of ratings"
                  rating_position:
                    type: integer
                    description: "Position in rating (1-based)"
                  light_requirements:
                    type: string
                  watering_frequency:
                    type: string
                  comfort_temp:
                    type: string
                  mature_size:
                    type: string
                  brief_description:
                    type: string
                  photo:
                    type: string
      400:
        description: Invalid pagination parameters
      500:
        description: Server error
    """
    try:
        # Get pagination parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 200:
            per_page = 20

        repo = PlantRepository()
        all_plants = repo.get_plants_rating()

        total_count = len(all_plants)
        total_pages = (total_count + per_page - 1) // per_page

        # Calculate pagination bounds
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        # Check if page is valid
        if page > total_pages and total_count > 0:
            return (
                jsonify({"success": False, "message": f"Страница {page} не существует. Всего страниц: {total_pages}"}),
                400,
            )

        # Get paginated plants
        paginated_plants = all_plants[start_idx:end_idx]

        # Format results
        formatted_plants = [_format_plant_response_with_rating(p) for p in paginated_plants]

        return jsonify(
            {
                "success": True,
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "plants": formatted_plants,
            }
        )

    except Exception as e:
        print(f"Ошибка при получении рейтинга растений: {e}")
        return jsonify({"success": False, "message": "Ошибка получения рейтинга"}), 500


@app.route("/api/plants-rating/filter", methods=["GET"])
def plants_rating_filter():
    """
    Get filtered and paginated plants rating.
    ---
    tags:
      - Plants
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 200
      - name: search
        in: query
        type: string
      - name: growth_rate
        in: query
        type: string
        enum: [Умеренный, Быстрый, fast]
      - name: comfort_temp
        in: query
        type: number
      - name: flowering_misting
        in: query
        type: boolean
      - name: toxicity
        in: query
        type: string
        enum: [Не токсичен, Умеренно, Токсичен]
    responses:
      200:
        description: Success
        schema:
          type: object
          properties:
            success: {type: boolean}
            total_count: {type: integer}
            page: {type: integer}
            per_page: {type: integer}
            total_pages: {type: integer}
            plants: {type: array, items: {type: object}}
      400:
        description: Invalid parameters
        schema:
          type: object
          properties:
            success: {type: boolean}
            message: {type: string}
      500:
        description: Server error
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 200, type=int)
        search = request.args.get("search", default=None, type=str)
        growth_rate = request.args.get("growth_rate", default=None, type=str)
        comfort_temp_raw = request.args.get("comfort_temp", default=None, type=str)
        flowering_misting_raw = request.args.get("flowering_misting", default=None, type=str)
        toxicity = request.args.get("toxicity", default=None, type=str)

        if page < 1:
            page = 1
        if per_page < 1 or per_page > 200:
            per_page = 200

        comfort_temp = None
        if comfort_temp_raw is not None and str(comfort_temp_raw).strip() != "":
            comfort_temp = float(str(comfort_temp_raw).replace(",", "."))

        flowering_misting = None
        if flowering_misting_raw is not None and str(flowering_misting_raw).strip() != "":
            normalized_bool = str(flowering_misting_raw).strip().lower()
            if normalized_bool in ("true", "1", "yes"):
                flowering_misting = True
            elif normalized_bool in ("false", "0", "no"):
                flowering_misting = False
            else:
                return jsonify({"success": False, "message": "Invalid flowering_misting value"}), 400

        repo = PlantRepository()
        all_plants = repo.get_plants_rating_filtered(
            search=search,
            comfort_temp=comfort_temp,
            flowering_misting=flowering_misting,
            growth_rate=growth_rate,
            toxicity=toxicity,
        )

        total_count = len(all_plants)
        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1

        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        if page > total_pages and total_count > 0:
            return (
                jsonify({"success": False, "message": f"Page {page} does not exist. Total pages: {total_pages}"}),
                400,
            )

        paginated_plants = all_plants[start_idx:end_idx]
        formatted_plants = [_format_plant_response_with_rating(p) for p in paginated_plants]

        return jsonify(
            {
                "success": True,
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "plants": formatted_plants,
            }
        )

    except ValueError:
        return jsonify({"success": False, "message": "Invalid comfort_temp value"}), 400
    except Exception as e:
        print(f"Error in /api/plants-rating/filter: {e}")
        return jsonify({"success": False, "message": "Filter rating error"}), 500


# -----------------------------
# Start server
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
