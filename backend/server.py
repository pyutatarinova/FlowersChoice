from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
import json
import os
import base64
# import psycopg2
import random
from datetime import date, datetime, timedelta, timezone
from dotenv import load_dotenv
import jwt
from functools import wraps
import sys
from pathlib import Path
from typing import List, Tuple, Dict, Any


# Add ml_services to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "ml_services"))

from plant_repository import PlantRepository

app = Flask(__name__)
CORS(app)
# Конфигурация Swagger с API Key
app.config['SWAGGER'] = {
    'title': 'FlowersChoice API',
    'uiversion': 3,
    'securityDefinitions': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Введите: Bearer <ваш_токен>'
        }
    },
    'security': [
        {'Bearer': []}
    ]
}
swagger = Swagger(app)

PORT = 3001
load_dotenv(dotenv_path=Path(__file__).parent / '.env')



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
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


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
@app.route('/api/register', methods=['POST'])
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

    encoded_password = base64.b64encode(profile['password'].encode("utf-8")).decode("utf-8")

    features = {
        "has_children": profile.get("has_children"),
        "has_pets": profile.get("has_pets"),
        "has_allergies": profile.get("has_allergies"),
        "preferences": profile.get("preferences")
    }

    embedding = generate_vector_embedding()

    try:
        repo = PlantRepository()
        user_id = repo.register_user(
            name=profile['name'],
            email=profile['email'],
            encoded_password=encoded_password,
            features=features,
            embedding=embedding,
            created_at=date.today(),
            updated_at=date.today()
        )

        token = create_token(user_id, profile['email'])

        repo.update_user_token(user_id, token) # Update token in database

        return jsonify({"success": True, "token": token, "message": "Регистрация успешна"})

    except Exception as e:
        print("Ошибка при сохранении в БД:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


# -----------------------------
# Login
# -----------------------------
@app.route('/api/login', methods=['POST'])
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

    encoded_password = base64.b64encode(data['password'].encode("utf-8")).decode("utf-8")

    try:
        repo = PlantRepository()
        user_data = repo.get_user_by_email(data['email'])

        if not user_data:
            return jsonify({"success": False, "message": "Пользователь не найден"}), 404

        user_id, stored_password = user_data

        if stored_password != encoded_password:
            return jsonify({"success": False, "message": "Неверный пароль"}), 401

        new_token = create_token(user_id, data['email'])
        repo.update_user_token(user_id, new_token)

        return jsonify({"success": True, "token": new_token, "message": "Успешный вход"})

    except Exception as e:
        print("Ошибка при входе:", e)
        return jsonify({"success": False, "message": "Ошибка входа"}), 500


# -----------------------------
# User Info (with middleware)
# -----------------------------
@app.route('/api/userinfo', methods=['GET'])
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


@app.route('/api/savefavourites', methods=['POST'])
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

    plant_id = data["plant_id"]

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


@app.route('/api/add-my-plant', methods=['POST'])
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
    

@app.route('/api/userplants', methods=['GET'])
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
                  plant_id:
                    type: integer
                  name:
                    type: string
                  description:
                    type: string
            my_plant:
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

        return jsonify({
            "success": True,
            "favorite": favorite_plants,
            "my_plant": my_plants
        })

    except Exception as e:
        print("Ошибка в /api/userplants:", e)
        return jsonify({
            "success": False,
            "message": "Ошибка получения растений пользователя"
        }), 500



# -----------------------------
# Search Similar Plants - ML
# -----------------------------
def _build_search_prompt(search_criteria: dict) -> str:
    """Transform frontend search criteria into a text prompt for the ML model.
    
    Combines all text fields and tags from different categories into a single coherent prompt.
    Handles two types of requests:
    1. Personal use: location, care_regime, function, size_type, extra_notes
    2. Gift: recipient, occasion, style, gift_location, extra_notes
    """
    parts = []
    
    # Detect if this is a gift request (has "recipient" or "occasion" fields)
    is_gift = "recipient" in search_criteria or "occasion" in search_criteria
    
    if is_gift:
        # Gift scenario
        parts.append("for gift")
        
        if search_criteria.get("recipient"):
            recipient = search_criteria["recipient"]
            if recipient.get("text"):
                parts.append(recipient["text"])
            if recipient.get("tags"):
                parts.extend(recipient["tags"])
        
        if search_criteria.get("occasion"):
            occasion = search_criteria["occasion"]
            if occasion.get("text"):
                parts.append(occasion["text"])
            if occasion.get("tags"):
                parts.extend(occasion["tags"])
        
        if search_criteria.get("style"):
            style = search_criteria["style"]
            if style.get("text"):
                parts.append(style["text"])
            if style.get("tags"):
                parts.extend(style["tags"])
        
        if search_criteria.get("gift_location"):
            gift_loc = search_criteria["gift_location"]
            if gift_loc.get("text"):
                parts.append(gift_loc["text"])
            if gift_loc.get("tags"):
                parts.extend(gift_loc["tags"])
    else:
        # Personal use scenario
        parts.append("for personal use")
        
        if search_criteria.get("location"):
            loc = search_criteria["location"]
            if loc.get("text"):
                parts.append(loc["text"])
            if loc.get("tags"):
                parts.extend(loc["tags"])
        
        if search_criteria.get("care_regime"):
            care = search_criteria["care_regime"]
            if care.get("text"):
                parts.append(care["text"])
            if care.get("tags"):
                parts.extend(care["tags"])
        
        if search_criteria.get("function"):
            func = search_criteria["function"]
            if func.get("text"):
                parts.append(func["text"])
            if func.get("tags"):
                parts.extend(func["tags"])
        
        if search_criteria.get("size_type"):
            size = search_criteria["size_type"]
            if size.get("text"):
                parts.append(size["text"])
            if size.get("tags"):
                parts.extend(size["tags"])
    
    if search_criteria.get("extra_notes"):
        extra = search_criteria["extra_notes"]
        if extra.get("text"):
            parts.append(extra["text"])
        if extra.get("tags"):
            parts.extend(extra["tags"])
    
    return ", ".join(filter(None, parts))


def _format_plant_response(plant_data: dict) -> dict:
    """Format plant data for frontend response with desired fields."""
    desired_features = [
        'light_requirements',
        'watering_frequency',
        'comfort_temp',
        'mature_size',
        'brief_description',
        'photo'
    ]
    
    features = plant_data.get('features') or {}
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
    merged['id'] = plant_data.get('id')
    merged['plant_name'] = plant_data.get('name')
    
    return merged


def _format_plant_response_with_rating(plant_data: dict) -> dict:
    """Format plant data for frontend response including rating information."""
    result = _format_plant_response(plant_data)
    result['avg_score'] = plant_data.get('avg_score', 0.0)
    result['rating_count'] = plant_data.get('rating_count', 0)
    result['rating_position'] = plant_data.get('rating_position', 0)
    return result


@app.route('/api/search-plants', methods=['POST'])
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
        prompt = _build_search_prompt(data)
        print(prompt)
        if not prompt or not prompt.strip():
            return jsonify({"success": False, "message": "Пожалуйста, укажите критерии поиска"}), 400
        
        # Search for similar plants
        user_id = user_payload.get('user_id')
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


@app.route('/api/remove-plant', methods=['POST'])
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
    if flag not in ['favorite', 'my_plant']:
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


@app.route('/api/update-plant-score', methods=['POST'])
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
    
    try:
        repo = PlantRepository()
        repo.update_plant_score(user_id, plant_id, score)
        
        return jsonify({"success": True, "message": "Оценка обновлена"})
    
    except Exception as e:
        print(f"Ошибка при обновлении оценки растения: {e}")
        if "not found" in str(e):
            return jsonify({"success": False, "message": "Растение не найдено в коллекции пользователя"}), 404
        return jsonify({"success": False, "message": "Ошибка обновления оценки"}), 500


@app.route('/api/plants-rating', methods=['GET'])
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
        description: "Items per page (1-100)"
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
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
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
            return jsonify({
                "success": False,
                "message": f"Страница {page} не существует. Всего страниц: {total_pages}"
            }), 400
        
        # Get paginated plants
        paginated_plants = all_plants[start_idx:end_idx]
        
        # Format results
        formatted_plants = [_format_plant_response_with_rating(p) for p in paginated_plants]
        
        return jsonify({
            "success": True,
            "total_count": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "plants": formatted_plants
        })
    
    except Exception as e:
        print(f"Ошибка при получении рейтинга растений: {e}")
        return jsonify({"success": False, "message": "Ошибка получения рейтинга"}), 500


# -----------------------------
# Start server
# -----------------------------
if __name__ == '__main__':
    app.run(port=PORT)
