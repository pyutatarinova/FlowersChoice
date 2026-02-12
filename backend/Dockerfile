FROM python:3.11-slim

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install boto3
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-base')"


# Копируем проект
COPY backend ./backend
COPY ml_services ./ml_services
COPY minio/upload_and_update_db.py ./upload_and_update_db.py

# Копируем entrypoint
COPY backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

WORKDIR /app/backend

CMD ["../entrypoint.sh"]

