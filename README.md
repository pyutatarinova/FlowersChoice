# 🌿 Flowers'Choice - Plants ML Web App

Веб-приложение для работы с базой растений с поддержкой семантического поиска (эмбеддинги через `sentence-transformers`), хранением изображений в MinIO и PostgreSQL в качестве основной БД.

---

# 🚀 Pipeline запуска проекта

## 1️⃣ Требования

* Docker
* Docker Compose
* 8+ GB RAM (рекомендуется, из-за ML-модели)
* Наличие в корне проекта файла .env с содержимым, соответствующим шаблону:
```yaml
DB_USER=postgres
DB_PASS=postgres  
DB_NAME=flowersdb
DB_PORT=5001
```

---

## 2️⃣ Первый запуск

```bash
docker compose build --no-cache
docker compose up
```

После запуска сервисы будут доступны:

| Сервис        | URL                                            |
| ------------- | ---------------------------------------------- |
| Frontend      | [http://localhost:5173](http://localhost:5173) |
| Backend API   | [http://localhost:3001](http://localhost:3001) |
| MinIO API     | [http://localhost:9000](http://localhost:9000) |
| MinIO Console | [http://localhost:9001](http://localhost:9001) |
| PostgreSQL    | localhost:DB_PORT                              |

---

## 3️⃣ Что происходит под капотом при запуске

### 🔹 Шаг 1 — сборка backend-образа

Во время `docker compose build`:

1. Устанавливается CPU-версия `torch`
2. Устанавливаются зависимости из `requirements.txt`
3. Скачивается модель:

   ```
   intfloat/multilingual-e5-base
   ```
4. Модель сохраняется внутри контейнера (`/models`)
5. Копируется backend-код

---

### 🔹 Шаг 2 — запуск контейнеров

`docker compose up` поднимает:

* `postgres` — база данных
* `minio` — S3-хранилище изображений
* `backend` — Flask API
* `frontend` — клиентское приложение

---

### 🔹 Шаг 3 — entrypoint backend

При старте backend:

1. ⏳ Ожидает готовности БД (wait-for-db)
2. 📦 При необходимости:

   * загружает изображения в MinIO
   * обновляет ссылки в БД
3. 🧠 Загружает ML-модель
4. 🚀 Запускает API сервер

---

# 📂 Структура проекта

```
project-root/
│
├── docker-compose.yml
├── .env
│
├── backend/
│   ├── server.py
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── ...
│
├── ml_services/
│   ├── create_embed.py
│   ├── plant_repository.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── minio/
│   └── upload_and_update_db.py
│
│
└── README.md
```

---

# 🧠 ML-часть

Используется модель:

```
intfloat/multilingual-e5-base
```

Она:

* поддерживает мультиязычный поиск
* генерирует embeddings
* работает на CPU

Модель предзагружается при сборке Docker-образа, поэтому при запуске не скачивается повторно.

---

# 🔁 Повторный запуск

```bash
docker compose down
docker compose up
```

Данные сохраняются благодаря volumes:

* volume Minio `minio_data`
* volume PostgreSQL `postgres_data`

---

# 🧪 Полезные команды

### Посмотреть логи backend

```bash
docker logs plants_backend
```

### Зайти внутрь контейнера

```bash
docker exec -it plants_backend bash
```

### Проверить запущенные контейнеры

```bash
docker ps
```

---

# ⚙️ Переменные окружения

Backend использует:

```
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASS

MINIO_ENDPOINT
MINIO_PUBLIC_ENDPOINT
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
```

---

# 📈 Возможные направления масштабирования

* Повысить качество ML сервиса
* Добавить Nginx reverse proxy и перевести Frontend в prod
* Развернуть на VPS с публичным IP
* Перевести MinIO в production-mode

---

# 📌 Кратко

Проект реализует:

* ML-поиск по тексту
* Хранение изображений через S3
* Docker-оркестрацию
* CPU-инференс модели
* Полноценную изолированную инфраструктуру

---
```