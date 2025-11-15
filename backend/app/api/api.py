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