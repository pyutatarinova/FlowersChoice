# Monitoring в FlowersChoice

## Что было настроено

Для backend-сервиса проекта добавлен базовый сбор метрик Prometheus через библиотеку `prometheus-flask-exporter`.

Сейчас monitoring состоит из двух частей:

1. Flask backend экспортирует метрики по HTTP endpoint.
2. Prometheus подключается к backend и регулярно забирает эти метрики.

## Какие изменения внесены

### 1. Backend теперь отдает метрики

В файл `backend/server.py` добавлена инициализация `PrometheusMetrics`.

Используется endpoint:

`/internal/metrics`

Почему выбран не стандартный `/metrics`, а `/internal/metrics`:

- endpoint выглядит более явно как технический;
- меньше шанс пересечения с пользовательскими API-маршрутами;
- проще отделять служебные маршруты от основного REST API.

Также из сбора исключены:

- сам endpoint `/internal/metrics`;
- Swagger UI пути `/apidocs/...`;
- статические ресурсы flasgger `/flasgger_static/...`.

Это сделано для того, чтобы служебные запросы не искажали прикладные метрики backend.

### 2. Добавлена зависимость для Flask

В `backend/requirements.txt` добавлена библиотека:

`prometheus-flask-exporter`

Она собирает стандартные метрики Flask-приложения без необходимости вручную описывать счетчики и гистограммы.

### 3. Добавлен Prometheus в docker-compose

В `docker-compose.yml` добавлен новый сервис:

`prometheus`

Сервис вынесен в отдельный Docker Compose profile:

`monitoring`

Он:

- запускается в отдельном контейнере;
- читает конфигурацию из `deploy/prometheus/prometheus.yml`;
- сохраняет данные в Docker volume `prometheus_data`;
- публикует веб-интерфейс на порту `9090`.

После запуска stack Prometheus UI будет доступен по адресу:

`http://localhost:9090`

Важно: Prometheus не стартует автоматически при обычном dev/prod запуске проекта. Он поднимается только если явно включить profile `monitoring`.

### 4. Добавлен scrape-конфиг Prometheus

Создан файл:

`deploy/prometheus/prometheus.yml`

В нем настроен job:

- `flowerschoice-backend`

Prometheus обращается к backend по внутреннему имени контейнера:

`backend:3001`

и забирает метрики с пути:

`/internal/metrics`

## Какие метрики доступны

Так как используется `prometheus-flask-exporter` в базовой конфигурации, доступны метрики, которые библиотека отдает "из коробки".

Обычно это метрики следующих типов:

- общее количество HTTP-запросов;
- количество запросов по endpoint;
- количество запросов по HTTP-методу;
- количество запросов по status code;
- длительность обработки запросов;
- метрики in-progress запросов, если они поддерживаются в текущей конфигурации библиотеки.

Точное имя каждой метрики зависит от версии библиотеки и от способа ее инициализации, но после запуска их можно посмотреть напрямую:

`http://localhost:3001/internal/metrics`

или через Prometheus UI.

## Как запустить monitoring локально

1. Для базового compose-запуска с monitoring включить profile:

```bash
docker compose --profile monitoring up --build
```

2. Для dev-режима использовать:

```bash
docker compose --profile monitoring --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

3. Для prod-режима использовать:

```bash
docker compose --profile monitoring --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

4. Убедиться, что backend запущен.

5. Открыть Prometheus:

`http://localhost:9090`

6. Перейти в раздел `Status -> Targets` и проверить, что target `flowerschoice-backend` находится в состоянии `UP`.

7. Сгенерировать несколько запросов к backend API и проверить, что метрики начали обновляться.

## Что важно понимать про текущую реализацию

Сейчас monitoring реализован в рабочем базовом виде, но это именно первый этап, а не полностью завершенная observability-схема.

### 1. Не до конца продуман сценарий с несколькими Gunicorn workers

В проекте backend запускается через Gunicorn, и число workers задается через:

`GUNICORN_WORKERS`

На данный момент отдельная multiprocess-настройка для Prometheus client не добавлялась.

Что это означает:

- для простого локального запуска метрики, скорее всего, будут полезны уже сейчас;
- при нескольких workers часть метрик может считаться не так, как ожидается;
- перед production-использованием нужно отдельно проверить корректность агрегации метрик и при необходимости включить multiprocess-режим для `prometheus_client`.

Это главное техническое ограничение текущей версии monitoring.

### 2. Метрики пока не защищены авторизацией

Endpoint `/internal/metrics` сейчас доступен внутри backend-сервиса без отдельной аутентификации.

В рамках Docker Compose это нормально, если:

- Prometheus работает в той же внутренней сети;
- backend port не публикуется наружу;
- к endpoint нет прямого внешнего доступа.

Но для production-среды желательно дополнительно продумать:

- ограничение доступа по сети;
- reverse proxy;
- internal-only ingress;
- basic auth или другой способ защиты, если endpoint окажется доступен извне.

### 3. Добавлены только стандартные HTTP-метрики

Сейчас не собираются отдельные бизнес-метрики, например:

- количество регистраций;
- количество логинов;
- число ошибок поиска растений;
- длительность обращения к БД;
- количество запросов к MinIO;
- длительность ML-поиска похожих растений.

Если monitoring будет использоваться не только для "жив ли сервис", но и для диагностики продукта, эти метрики стоит добавить отдельно.

### 4. Нет Grafana и готовых dashboard

Сейчас в проект добавлен только Prometheus.

Для полноценного monitoring-стека позже можно добавить:

- Grafana;
- готовые dashboards;
- alerting rules;
- Alertmanager.

### 5. Нет healthcheck- и readiness-стратегии для monitoring

Prometheus уже может видеть, доступен ли endpoint метрик, но в проекте пока отдельно не оформлены:

- явный health endpoint backend;
- readiness/liveness checks для контейнера backend;
- правила деградации при проблемах с БД, MinIO или ML-компонентами.

## Что можно сделать следующим шагом

Рекомендуемые следующие доработки:

1. Проверить корректность метрик при `GUNICORN_WORKERS > 1` и при необходимости внедрить multiprocess-конфигурацию.
2. Добавить отдельный `/health` endpoint для backend.
3. Подключить Grafana и собрать базовый dashboard.
4. Добавить бизнес-метрики для ключевых пользовательских сценариев.
5. Продумать защиту endpoint метрик для production-среды.

## Краткий итог

В проект уже встроен базовый monitoring:

- backend экспортирует Prometheus-метрики;
- Prometheus их регулярно считывает;
- данные доступны через UI Prometheus.

Текущая реализация хорошо подходит как стартовая точка для локальной разработки и первичной диагностики backend, но перед production-использованием нужно отдельно доработать вопросы multi-worker Gunicorn, безопасности и набора прикладных метрик.
