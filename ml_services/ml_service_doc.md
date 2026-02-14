# Краткая документация о ml_services

Кратко о файлах в папке `ml_services` и их назначении.

- `create_embed.py` — генерация эмбеддингов и запись в БД
  - Читает `id`, `name`, `features` (JSONB) из таблицы `public.plants`.
  - Собирает один текст для каждой записи (name + поля из `features`).
  - Кодирует текст батчами с помощью `SentenceTransformer("intfloat/multilingual-e5-base")`.
  - Создаёт колонку `embedding` типа `vector(dim)` (если не существует) и записывает в неё векторы в формате PostgreSQL (`'[v1,v2,...]'::vector`).

- `search_similar.py` — поиск похожих растений по текстовому промпту
  - Берёт на вход произвольный текст (prompt), кодирует его моделью и запрашивает `PlantRepository`.
  - Возвращает `top_k` пар `(id, distance)` упорядоченных по расстоянию (меньше — ближе).
  - Использует ленивый singleton-кеш модели, чтобы не загружать модель многократно.

- `plant_repository.py` — слой репозитория для pgvector-запросов
  - Инкапсулирует подключение к Postgres и SQL-запросы.
  - Метод `top_k_by_embedding(embedding: List[float], k)` формирует литерал вектора и выполняет
    SQL-поиск по `embedding` с помощью оператора расстояния:

```sql
SELECT id, 1 - (embedding <=> {vec}::vector) AS cosine_similarity 
FROM public.plants WHERE embedding IS NOT NULL
ORDER BY cosine_similarity DESC LIMIT {limit};"
```

- В используемой конфигурации мы используем cosine distance `<=>` (pgvector возвращает именно cosine distance для соответствующей конфигурации). При таком результате можно получить меру похожести (similarity) так:

  ```text
  similarity = 1 - cosine_distance
  ```

  - Чем ближе `cosine_distance` к 0 — тем более похожи векторы.
  - Преобразование `1 - cosine_distance` даёт значение близости в диапазоне [0,2] (обычно [0,1] для нормализованных векторов).

## Короткие примеры запуска

- Сгенерировать эмбеддинги (dry-run):
```powershell
cd ml_services
python create_embed.py --dry-run --batch-size 64
```
- "--batch-size", type=int, default=128, help="SentenceTransformer batch size for encoding"
- "--dry-run", action="store_true", help="Only compute embeddings but don't write to DB"

- Найти похожие растения по тексту:
```powershell
cd ml_services
python search_similar.py "small fragrant pink shrub"
```

# Дополнительно  
## **Паттерн Singleton для модели ML**  
В классе `PlantSearchService` в `search_similar.py`

Это реализация **паттерна Singleton (одиночка)** для дорогой в создании ML модели.

## **1. Что делает этот код:**

### **Классовые переменные:**
```python
_model: SentenceTransformer | None = None
```
- `_model` - **классовая переменная** (принадлежит КЛАССУ, а не экземпляру)
- Хранится **одна модель на весь класс**, а не копия в каждом объекте
- `None` - начальное значение (модель еще не загружена)

### **Конструктор:**
```python
def __init__(self, repo: PlantRepository | None = None, model_name: str = "intfloat/multilingual-e5-base") -> None:
    self.model_name = model_name  # сохраняем имя модели
    self.repo = repo or PlantRepository()  # создаем или принимаем репозиторий
```

### **Классовый метод:**
```python
@classmethod
def _get_model(cls, model_name: str) -> SentenceTransformer:
    if cls._model is None:
        cls._model = SentenceTransformer(model_name)  # создаем ОДИН раз
    return cls._model  # возвращаем уже созданную модель
```

## **2. Как это работает на примере:**

```python
# Создаем первый объект
service1 = PlantService()
# 1. cls._model = None
# 2. Загружаем модель в память (долго!)
# 3. cls._model = <загруженная модель>

# Создаем второй объект
service2 = PlantService()
# cls._model УЖЕ загружен!
# Просто возвращаем существующую модель

print(service1._get_model("intfloat/multilingual-e5-base") is 
      service2._get_model("intfloat/multilingual-e5-base"))
# True - это ОДИН И ТОТ ЖЕ объект модели!
```

## **3. Проблема которую решает этот паттерн:**

### **Без Singleton:**
```python
class PlantService:
    def __init__(self):
        self.model = SentenceTransformer("intfloat/multilingual-e5-base")  # 500 МБ

# Создаем 10 объектов
services = [PlantService() for _ in range(10)]
# ПАМЯТЬ: 10 × 500 МБ = 5 ГБ 😱
# ВРЕМЯ: 10 × 10 секунд = 100 секунд
```

### **С Singleton:**
```python
class PlantService:
    _model = None
    
    def get_model(self):
        if self._model is None:
            self._model = SentenceTransformer("intfloat/multilingual-e5-base")  # 500 МБ
        
# Создаем 10 объектов
services = [PlantService() for _ in range(10)]
# ПАМЯТЬ: 1 × 500 МБ = 500 МБ
# ВРЕМЯ: 1 × 10 секунд = 10 секунд
```

## **4. Разница между `self` и `cls`:**

```python
class PlantService:
    _model = None  # классовая переменная
    
    def instance_method(self):
        # self - ссылка на ЭКЗЕМПЛЯР класса
        print(self.model_name)  # атрибут экземпляра
    
    @classmethod
    def class_method(cls):
        # cls - ссылка на САМ КЛАСС
        print(cls._model)  # классовая переменная
```

## **5. Визуализация в памяти:**

```
ПАМЯТЬ:
┌─────────────────┐
│ КЛАСС PlantService  │
│ _model: ──────────┐│
└─────────────────┘│
                   │
┌─────────────────┐▼
│ ЭКЗЕМПЛЯР 1      │
│ model_name       │
│ repo ───────────┐│
└─────────────────┘│
                   │
┌─────────────────┐▼
│ ЭКЗЕМПЛЯР 2      │
│ model_name       │
│ repo ───────────┐│
└─────────────────┘│
                   │
                   ▼
                SentenceTransformer
                (ОДИН на все экземпляры)
```

**Итог:** Этот паттерн экономит память и время, гарантируя что **дорогая ML модель загружается в память только один раз**, независимо от количества созданных объектов сервиса.
