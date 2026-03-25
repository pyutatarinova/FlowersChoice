# Production Deploy (IP: 178.72.179.125)

Этот проект теперь настроен на продовый запуск через Docker и Nginx.

## Что используется

- `web` (Nginx + frontend build) — внешний вход, порт `80`
- `backend` (Flask через Gunicorn) — внутренний сервис
- `minio` — внутренний сервис, проксируется через Nginx
- `db` (PostgreSQL + pgvector) — внутренний сервис

## Глобальные переменные

Файл: `.env`

- `SITE_IP=178.72.179.125`
- `SITE_URL=http://178.72.179.125`

Эти переменные используются в:

- `docker-compose.yml`
- `deploy/nginx/default.conf.template`
- backend (`MINIO_PUBLIC_ENDPOINT`)

Готовый nginx-конфиг с фиксированным IP:

- `deploy/nginx/178.72.179.125.conf`

## Запуск на сервере

```bash
cd ~/FlowersChoice
docker compose down
docker compose up -d --build
```

## Проверка

Откройте в браузере:

- `http://178.72.179.125` — frontend
- `http://178.72.179.125/api/plants-rating?page=1&per_page=5` — backend API
- `http://178.72.179.125/minio-console/` — MinIO Console (если нужен доступ)

Проверка контейнеров:

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f backend
```

## Важно про фото

Скрипт загрузки в MinIO теперь обновляет `features.photo`, если URL в БД не совпадает с текущим `MINIO_PUBLIC_ENDPOINT`.

Это нужно, чтобы автоматически убрать старые ссылки вида `localhost` и заменить на продовые (`http://178.72.179.125/minio/...`).
