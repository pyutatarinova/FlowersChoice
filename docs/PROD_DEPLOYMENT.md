# Production Deploy

Продовое окружение работает через `nginx` + собранный frontend.

## Используемые файлы

- `docker-compose.yml` (база)
- `docker-compose.prod.yml` (prod-override)
- `.env.prod` (prod-переменные)
- `.env.prod.example` (шаблон без секретов для git)
- `deploy/nginx/default.conf.template` (nginx template с HTTPS)
- `deploy/nginx/flowers-choice.ru.conf` (готовый статический вариант)

## Переменные для сервера

- `SITE_IP=178.72.179.125`
- `SITE_DOMAIN=flowers-choice.ru`
- `SITE_URL=https://flowers-choice.ru`
- `DB_PASS`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `JWT_SECRET` — должны быть уникальными

## Запуск

```bash
cd ~/FlowersChoice
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml down
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## HTTPS (Let's Encrypt)

1. Убедитесь, что DNS `flowers-choice.ru` указывает на `178.72.179.125`.
2. Убедитесь, что порты `80` и `443` открыты на сервере и в security group.
3. Выпустите сертификат:

```bash
docker run --rm -it \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d flowers-choice.ru \
  -m admin@flowers-choice.ru \
  --agree-tos --no-eff-email
```

4. Перезапустите web:

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate web
```

Примечание: до выпуска Let's Encrypt контейнер `web` поднимется с временным self-signed сертификатом (это ожидаемо).

## Ротация паролей (без потери данных)

1. Обновите секреты в `.env.prod`.
2. Измените пароль пользователя Postgres внутри контейнера:

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml exec db \
  psql -U postgres -d flowersdb -c "ALTER USER postgres WITH PASSWORD 'NEW_DB_PASSWORD';"
```

3. Пересоздайте сервисы, которые используют новые секреты:

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate minio backend web
```

4. Проверьте статус:

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

## Проверка

- `https://flowers-choice.ru` — frontend
- `https://flowers-choice.ru/api/plants-rating?page=1&per_page=5` — backend API
- `https://flowers-choice.ru/minio/` — MinIO API через nginx
- `https://flowers-choice.ru/minio-console/` — MinIO Console через nginx

## Логи

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```
