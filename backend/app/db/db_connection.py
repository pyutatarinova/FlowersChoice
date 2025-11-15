from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
import jwt
from flask_cors import CORS
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# ===================== Конфигурация =====================
# Загружаем переменные из .env файла
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mysite")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "12345")
SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY")

SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY")
JWT_EXPIRATION = 3600  # 1 час

# SQLAlchemy URL
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
