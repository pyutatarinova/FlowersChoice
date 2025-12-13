from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import base64
import psycopg2
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

app = Flask(__name__)
CORS(app)

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


def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host="127.0.0.1",
        port=5001
    )


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

# -----------------------------
# Register
# -----------------------------
@app.route('/api/register', methods=['POST'])
def register():
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
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO users (name, email, password, created_at, updated_at, features, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            profile['name'],
            profile['email'],
            encoded_password,
            date.today(),
            date.today(),
            json.dumps(features),
            embedding
        ))

        user_id = cursor.fetchone()[0]
        token = create_token(user_id, profile['email'])

        cursor.execute("UPDATE users SET token = %s WHERE id = %s", (token, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "token": token, "message": "Регистрация успешна"})

    except Exception as e:
        print("Ошибка при сохранении в БД:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


# -----------------------------
# Login
# -----------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"success": False, "message": "Некорректные данные"}), 400

    encoded_password = base64.b64encode(data['password'].encode("utf-8")).decode("utf-8")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, password FROM users WHERE email = %s", (data['email'],))
        row = cursor.fetchone()

        if not row:
            return jsonify({"success": False, "message": "Пользователь не найден"}), 404

        user_id, stored_password = row

        if stored_password != encoded_password:
            return jsonify({"success": False, "message": "Неверный пароль"}), 401

        new_token = create_token(user_id, data['email'])

        cursor.execute("UPDATE users SET token = %s WHERE id = %s", (new_token, user_id))
        conn.commit()

        cursor.close()
        conn.close()

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
    user_id = user_payload.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Некорректный токен"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, email, created_at, updated_at, features, embedding
            FROM users
            WHERE id = %s
        """, (user_id,))

        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"success": False, "message": "Пользователь не найден"}), 404

        user_info = {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "created_at": row[3],
            "updated_at": row[4],
            "features": row[5],
            "embedding": row[6],
        }

        return jsonify({"success": True, "user": user_info})

    except Exception as e:
        print("Ошибка в /api/userinfo:", e)
        return jsonify({"success": False, "message": "Ошибка получения данных"}), 500


@app.route('/api/savefavourites', methods=['POST'])
@auth_required
def save_favourites(user_payload):
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data:
        return jsonify({"success": False, "message": "Ожидался plant_id"}), 400

    plant_id = data["plant_id"]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверка на существующую запись, чтобы не было дублей
        cursor.execute("""
            SELECT 1 FROM user_plants
            WHERE user_id = %s AND plant_id = %s
        """, (user_id, plant_id))

        exists = cursor.fetchone()

        if exists:
            return jsonify({"success": False, "message": "Растение уже сохранено"}), 409
        
        cursor.execute("""
            INSERT INTO user_plants (user_id, plant_id, favorite, my_plant, score, comment)
            VALUES (%s, %s, TRUE, FALSE, 0.0, NULL)
        """, (
            user_id,
            plant_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Растение добавлено в избранное"})

    except Exception as e:
        print("Ошибка при сохранении избранного:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500


@app.route('/api/add-my-plant', methods=['POST'])
@auth_required
def add_my_plant(user_payload):
    user_id = user_payload.get("user_id")

    data = request.get_json()
    if not data or "plant_id" not in data:
        return jsonify({"success": False, "message": "Ожидался plant_id"}), 400

    plant_id = data["plant_id"]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверка на существующую запись
        cursor.execute("""
            SELECT favorite, my_plant FROM user_plants
            WHERE user_id = %s AND plant_id = %s
        """, (user_id, plant_id))

        existing_record = cursor.fetchone()

        if existing_record:
            # Если запись существует, обновляем my_plant на true
            cursor.execute("""
                UPDATE user_plants
                SET 
                  my_plant = TRUE,
                  favorite = FALSE
                WHERE user_id = %s AND plant_id = %s
            """, (user_id, plant_id))
            message = "Растение добавлено в мои растения"
        else:
            # Если записи нет, создаем новую с my_plant = true
            cursor.execute("""
                INSERT INTO user_plants (user_id, plant_id, favorite, my_plant, score, comment)
                VALUES (%s, %s, FALSE, TRUE, 0.0, NULL)
            """, (user_id, plant_id))
            message = "Растение добавлено в мои растения"

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": message})

    except Exception as e:
        print("Ошибка при добавлении растения:", e)
        return jsonify({"success": False, "message": "Ошибка сохранения в БД"}), 500
    

@app.route('/api/userplants', methods=['GET'])
@auth_required
def user_my_plants(user_payload):
    user_id = user_payload.get("user_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        def get_plants_by_flag(flag_column: str):
            """
            Универсальная функция:
            получает растения пользователя по флагу favorite / my_plant
            """
            cursor.execute(f"""
                SELECT p.id, p.name, p.features
                FROM user_plants up
                JOIN plants p ON p.id = up.plant_id
                WHERE up.user_id = %s AND up.{flag_column} = TRUE
            """, (user_id,))

            rows = cursor.fetchall()

            results = []
            for r in rows:
                plant = {
                    "id": int(r[0]),
                    "name": r[1],
                    "features": r[2],
                }
                results.append(_format_plant_response(plant))

            return results

        favorite_plants = get_plants_by_flag("favorite")
        my_plants = get_plants_by_flag("my_plant")

        cursor.close()
        conn.close()
        # print(my_plants)

        return jsonify({
            "success": True,
            "favorite": favorite_plants,
            "my_plant": my_plants
        })

    except Exception as e:
        print("Ошибка в /api/userfavoriteplants:", e)
        return jsonify({
            "success": False,
            "message": "Ошибка получения растений пользователя"
        }), 500



# -----------------------------
# Search Similar Plants
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


@app.route('/api/search-plants', methods=['POST'])
def search_plants():
    """Search for plants based on user criteria.
    
    Expects JSON with structure:
    {
        "location": {"text": "...", "tags": [...]},
        "care_regime": {"text": "...", "tags": [...]},
        "function": {"text": "...", "tags": [...]},
        "size_type": {"text": "...", "tags": [...]},
        "extra_notes": {"text": "...", "tags": [...]}
    }
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
        service = PlantSearchService()
        results = service.find_similar_plants(prompt, top_k=10)
        
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


# -----------------------------
# Start server
# -----------------------------
if __name__ == '__main__':
    app.run(port=PORT)
