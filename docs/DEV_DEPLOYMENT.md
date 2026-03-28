# Local Dev Deploy

Локальная dev-версия работает на `localhost:5173` (Vite), API — через прокси `/api`.

## Используемые файлы

- `docker-compose.yml` (база)
- `docker-compose.dev.yml` (dev-override)
- `.env.dev` (dev-переменные)

## Запуск

```bash
cd ~/FlowersChoice
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Мониторинг Prometheus в dev не включен по умолчанию. Если он нужен, запускайте compose с profile `monitoring`:

```bash
docker compose --profile monitoring --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Проверка

- `http://localhost:5173` — frontend (Vite)
- `http://localhost:3001/api/plants-rating?page=1&per_page=5` — backend напрямую
- `http://localhost:9000` — MinIO API
- `http://localhost:9001` — MinIO Console

## Что важно

- Во фронте используются относительные URL (`/api`, `/minio`, `/minio-console`).
- В `vite.config.js` настроены proxy-правила для dev.
