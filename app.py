from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
import jwt
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ===================== Конфигурация =====================
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mysite")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "12345")

SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY")
JWT_EXPIRATION = 3600  # 1 час

# SQLAlchemy URL
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ===================== ORM Модели =====================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    category = db.Column(db.String(255))
    suggestion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


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

    # Проверяем, существует ли пользователь
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"message": "Пользователь уже существует"}), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user.id, email)
    return jsonify({"token": token}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email и пароль обязательны"}), 400

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.checkpw(password.encode(), user.password.encode()):
        token = generate_token(user.id, email)
        return jsonify({"token": token})
    else:
        return jsonify({"message": "Неверный email или пароль"}), 401


@app.route("/api/form", methods=["POST"])
@token_required
def submit_feedback():
    data = request.get_json()

    new_feedback = Feedback(
        name=data.get("name", "Не указано"),
        email=data.get("email", "Не указано"),
        category=data.get("category", "Не указано"),
        suggestion=data.get("suggestion", "Не указано"),
    )

    db.session.add(new_feedback)
    db.session.commit()

    return jsonify({"success": True, "message": "Спасибо за ваше предложение!"})


# ===================== Главная =====================
@app.route("/")
def home():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()


# ===================== Запуск =====================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Автоматическое создание таблиц
    app.run(host="0.0.0.0", port=5000, debug=True)
