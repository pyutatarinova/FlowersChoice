from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import base64
import psycopg2
import random
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
import jwt
from functools import wraps

app = Flask(__name__)
CORS(app)

PORT = 3001
load_dotenv()

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
        host="localhost",
        port=5001
    )


def create_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
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
        except Exception:
            return jsonify({"success": False, "message": "Неверный токен"}), 401

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


# -----------------------------
# Start server
# -----------------------------
if __name__ == '__main__':
    app.run(port=PORT)
