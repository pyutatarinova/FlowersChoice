#!/bin/sh

echo "⏳ Waiting for PostgreSQL..."

# Ожидание БД
until nc -z $DB_HOST $DB_PORT; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up"

echo "⏳ Waiting for MinIO..."

# Проверка MinIO
until curl -s $MINIO_ENDPOINT/minio/health/live > /dev/null; do
  echo "MinIO is unavailable - sleeping"
  sleep 2
done

echo "✅ MinIO is up"

echo "🚀 Running upload_and_update_db.py..."
python /app/upload_and_update_db.py \
  --dir /app/minio_images \
  --minio-endpoint $MINIO_ENDPOINT \
  --minio-access $MINIO_ROOT_USER \
  --minio-secret $MINIO_ROOT_PASSWORD \
  --bucket plants \
  --db-host $DB_HOST \
  --db-port $DB_PORT \
  --db-name $DB_NAME \
  --db-user $DB_USER \
  --db-pass $DB_PASS


echo "🧠 Creating embeddings..."
python /app/ml_services/create_embed.py

echo "🌿 Starting Flask server..."
exec python server.py
