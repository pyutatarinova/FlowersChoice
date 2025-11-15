from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import bcrypt
import jwt
from functools import wraps
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Позволяет кросс-доменные запросы

# ===================== Конфигурация =====================
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mysite")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "12345")

SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY")  # Секрет для JWT
JWT_EXPIRATION = 3600  # 1 час

# ===================== Подключение к БД =====================
def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    # Таблица пользователей
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    # Таблица пожеланий
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        category TEXT,
        suggestion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    cursor.close()
    conn.close()

# ===================== JWT =====================
def generate_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        if token.startswith("Bearer "):
            token = token[7:]
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

# ===================== API =====================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email и пароль обязательны"}), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (email, password)
            VALUES (%s, %s)
            RETURNING id
        """, (email, hashed_password))
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()

        token = generate_token(user_id, email)
        return jsonify({"token": token}), 201
    except psycopg2.Error as e:
        if "unique constraint" in str(e).lower():
            return jsonify({"message": "Пользователь уже существует"}), 400
        return jsonify({"message": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email и пароль обязательны"}), 400

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and bcrypt.checkpw(password.encode(), user["password"].encode()):
        token = generate_token(user["id"], email)
        return jsonify({"token": token})
    else:
        return jsonify({"message": "Неверный email или пароль"}), 401

@app.route("/api/form", methods=["POST"])
@token_required
def submit_feedback():
    data = request.get_json()
    name = data.get("name", "Не указано")
    email = data.get("email", "Не указано")
    suggestion = data.get("suggestion", "Не указано")
    category = data.get("category", "Не указано")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO feedback (name, email, category, suggestion)
            VALUES (%s, %s, %s, %s)
        """, (name, email, category, suggestion))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Спасибо за ваше предложение!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===================== Главная =====================
@app.route("/")
def home():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

# ===================== Запуск =====================
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
