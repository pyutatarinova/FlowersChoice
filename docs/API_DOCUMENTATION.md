# FlowersChoice API Documentation

## Swagger UI

Документация API доступна в интерактивном формате Swagger UI.

### Доступ к документации

Когда сервер запущен, откройте в браузере:
```
http://localhost:3001/apidocs/
```

или альтернативный путь:
```
http://localhost:3001/swagger/  
```  
Для авторизации именно так - `Bearer <ваш_токен>`  

Здесь вы сможете:
- 📖 Просмотреть все доступные методы API
- 🔧 Протестировать каждый метод прямо из браузера
- 📥 Увидеть примеры запросов и ответов
- 🔐 Использовать токен авторизации для защищённых методов

---

## API Endpoints

### Аутентификация (Authentication)

#### Регистрация
```
POST /api/register
```
Создать новый аккаунт пользователя.

**Параметры:**
- `name` (string, обязательно) - Имя пользователя
- `email` (string, обязательно) - Email
- `password` (string, обязательно) - Пароль
- `has_pets` (boolean, опционально) - Есть ли домашние животные
- `has_allergies` (boolean, опционально) - Есть ли аллергии
- `preferences` (string, опционально) - Предпочтения

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Регистрация успешна"
}
```

---

#### Вход (Login)
```
POST /api/login
```
Вход в систему с использованием email и пароля.

**Параметры:**
- `email` (string, обязательно) - Email
- `password` (string, обязательно) - Пароль

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Успешный вход"
}
```

---

### Пользователь (User)

#### Получить информацию о пользователе
```
GET /api/userinfo
```
Получить информацию текущего пользователя.

**Требует авторизацию:** Да (передайте токен в заголовке `Authorization: Bearer <token>`)

**Ответ:**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "has_pets": false,
    "has_allergies": false,
    "preferences": "low maintenance plants"
  }
}
```

---

### Растения (Plants)

#### Добавить растение в избранное
```
POST /api/savefavourites
```
Добавить растение в список избранных.

**Требует авторизацию:** Да

**Параметры:**
- `plant_id` (integer, обязательно) - ID растения

**Ответ:**
```json
{
  "success": true,
  "message": "Растение добавлено в избранное"
}
```

---

#### Добавить растение в коллекцию
```
POST /api/add-my-plant
```
Добавить растение в коллекцию пользователя.

**Требует авторизацию:** Да

**Параметры:**
- `plant_id` (integer, обязательно) - ID растения

**Ответ:**
```json
{
  "success": true,
  "message": "Растение добавлено в коллекцию"
}
```

---

#### Удалить растение из коллекции
```
POST /api/remove-plant
```
Удалить растение из избранного или коллекции пользователя.

**Требует авторизацию:** Да

**Параметры:**
- `plant_id` (integer, обязательно) - ID растения
- `flag` (string, обязательно) - Какой флаг удалить:
  - `'favorite'` - удалить из избранного
  - `'my_plant'` - удалить из коллекции

**Пример запроса:**
```json
{
  "plant_id": 1,
  "flag": "favorite"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Растение удалено из избранного"
}
```

---

#### Получить растения пользователя
```
GET /api/userplants
```
Получить список всех растений пользователя (избранные и его коллекция).

**Требует авторизацию:** Да

**Ответ:**
```json
{
  "success": true,
  "favorite": [
    {
      "plant_id": 1,
      "name": "Monstera",
      "description": "Large leafed plant"
    }
  ],
  "my_plant": [
    {
      "plant_id": 2,
      "name": "Pothos",
      "description": "Easy to care plant"
    }
  ]
}
```

---

#### Поиск растений
```
POST /api/search-plants
```
Поиск растений на основе критериев пользователя.

**Параметры:**
Один из следующих объектов или оба (для подарка):

**Для личного использования:**
- `location` (object)
  - `text` (string) - Описание места
  - `tags` (array) - Теги (например: ["sunny", "bedroom"])
- `care_regime` (object)
  - `text` (string) - Описание ухода
  - `tags` (array) - Теги (например: ["low_maintenance", "water_weekly"])
- `function` (object)
  - `text` (string) - Назначение растения
  - `tags` (array) - Теги (например: ["decoration", "air_purification"])
- `size_type` (object)
  - `text` (string) - Размер
  - `tags` (array) - Теги (например: ["small", "compact"])
- `extra_notes` (object)
  - `text` (string) - Дополнительные заметки
  - `tags` (array) - Теги

**Для подарка:**
- `recipient` (object) - Для кого подарок
  - `text` (string) - Описание
  - `tags` (array)
- `occasion` (object) - По какому случаю
  - `text` (string) - Описание
  - `tags` (array)

**Пример запроса (поиск для дома):**
```json
{
  "location": {
    "text": "Солнечное место на подоконнике",
    "tags": ["sunny", "window"]
  },
  "care_regime": {
    "text": "Минимальный уход",
    "tags": ["low_maintenance", "drought_tolerant"]
  }
}
```

**Ответ:**
```json
[
  {
    "plant_id": 1,
    "name": "Monstera",
    "description": "Крупнолистное растение",
    "care_difficulty": "easy",
    "watering_frequency": "weekly"
  },
  {
    "plant_id": 2,
    "name": "Pothos",
    "description": "Легко ухаживаемое растение",
    "care_difficulty": "easy",
    "watering_frequency": "2_weeks"
  }
]
```

---

## Использование токена авторизации

### В Swagger UI:
1. Получите токен через `/api/register` или `/api/login`
2. Нажмите на кнопку **"Authorize"** вверху страницы Swagger
3. Введите: `Bearer <ваш_токен>`
4. Нажмите **"Authorize"**
5. Теперь все защищённые методы будут использовать этот токен

### При разработке (примеры):

**JavaScript/Fetch:**
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

fetch('http://localhost:3001/api/userinfo', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

**cURL:**
```bash
curl -X GET http://localhost:3001/api/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Python/Requests:**
```python
import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:3001/api/userinfo', headers=headers)
print(response.json())
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешно |
| 400 | Неверные данные запроса |
| 401 | Требуется авторизация или истёк токен |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, растение уже добавлено) |
| 500 | Ошибка сервера |

---

## Примечания

- Все токены имеют срок действия 60 минут
- Пароли кодируются в Base64 при отправке (это базовая защита, используйте HTTPS в продакшене)
- API использует JSON для всех запросов и ответов
- CORS включен для всех источников (для разработки)

