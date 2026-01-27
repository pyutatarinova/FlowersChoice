# Swagger API Documentation для FlowersChoice

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

Или если уже установили все, просто обновите flasgger:
```bash
pip install flasgger==0.9.8
```

### 2. Запуск сервера
```bash
python server.py
```

Сервер запустится на: `http://localhost:3001`

### 3. Открыть документацию API
Перейдите в браузере на:
```
http://localhost:3001/apidocs/
```

или

```
http://localhost:3001/swagger/
```

---

## 📚 Что такое Swagger UI?

Swagger UI — это интерактивная документация API, которая позволяет:

✅ Просматривать все доступные методы API  
✅ Видеть параметры и типы данных для каждого метода  
✅ Читать описания методов  
✅ **Тестировать методы прямо из браузера** (Try it out)  
✅ Видеть примеры запросов и ответов  

---

## 🔑 Как использовать авторизацию в Swagger UI

Многие методы требуют авторизацию через JWT токен.

### Способ 1: Через кнопку "Authorize"

1. **Откройте Swagger UI**: http://localhost:3001/apidocs/
2. **Создайте токен** (выполните POST /api/register или GET /api/login)
3. **Скопируйте токен** из ответа
4. **Нажмите кнопку "Authorize"** в правом верхнем углу
5. **Введите**: `Bearer <ваш_токен>`
   - Например: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. **Нажмите "Authorize"**
7. Теперь все защищённые методы будут автоматически использовать этот токен

### Способ 2: Встроить токен в каждый запрос

В поле "Authorization" каждого метода можно вставить токен:
- Нажмите на значок замка 🔒 рядом с методом
- Введите токен

---

## 📖 Основные методы API

### Аутентификация

#### 📝 Регистрация
```
POST /api/register
```
Создать новый аккаунт.

**Тестирование в Swagger:**
1. Найдите "POST /api/register"
2. Нажмите "Try it out"
3. Заполните пример JSON:
```json
{
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "password": "mypassword123"
}
```
4. Нажмите "Execute"
5. Скопируйте `token` из ответа - он вам понадобится!

#### 🔐 Вход
```
POST /api/login
```
Вход в систему.

**Тестирование:**
1. Используйте email и password из регистрации
2. Получите новый токен

---

### Пользователь

#### 👤 Получить данные пользователя
```
GET /api/userinfo
```
Получить информацию о текущем пользователе (требует токен).

**Тестирование:**
1. Сначала авторизуйтесь (используйте кнопку "Authorize")
2. Нажмите "Try it out"
3. Нажмите "Execute"

---

### Растения

#### 🌟 Добавить в избранное
```
POST /api/savefavourites
```

**Параметры:**
```json
{
  "plant_id": 1
}
```

#### 🏠 Добавить в коллекцию
```
POST /api/add-my-plant
```

**Параметры:**
```json
{
  "plant_id": 1
}
```

#### ❌ Удалить из коллекции
```
POST /api/remove-plant
```

**Параметры:**
```json
{
  "plant_id": 1,
  "flag": "favorite"
}
```

Где `flag` может быть:
- `"favorite"` — удалить из избранного
- `"my_plant"` — удалить из коллекции

#### 📋 Получить мои растения
```
GET /api/userplants
```
Получить все растения пользователя (избранные и коллекцию).

#### 🔍 Поиск растений
```
POST /api/search-plants
```

**Пример запроса:**
```json
{
  "location": {
    "text": "Солнечное место",
    "tags": ["sunny", "window"]
  },
  "care_regime": {
    "text": "Легко ухаживать",
    "tags": ["easy", "low_maintenance"]
  }
}
```

---

## 💡 Примеры использования в коде

### JavaScript
```javascript
// Регистрация
const response = await fetch('http://localhost:3001/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John',
    email: 'john@example.com',
    password: 'pass123'
  })
});

const data = await response.json();
const token = data.token; // Сохраните токен!

// Использование авторизованного запроса
const response2 = await fetch('http://localhost:3001/api/userinfo', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userData = await response2.json();
console.log(userData);
```

### Python
```python
import requests

# Регистрация
response = requests.post('http://localhost:3001/api/register', json={
    'name': 'John',
    'email': 'john@example.com',
    'password': 'pass123'
})

token = response.json()['token']

# Авторизованный запрос
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:3001/api/userinfo', headers=headers)
print(response.json())
```

### cURL
```bash
# Регистрация
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "password": "pass123"
  }'

# Авторизованный запрос
curl -X GET http://localhost:3001/api/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 🔍 Где найти дополнительную информацию?

### В проекте:
- **Основная документация**: `/backend/API_DOCUMENTATION.md`
- **Исходный код**: `/backend/server.py`
- **База данных**: `/backend/plant_repository.py`

### Файлы Swagger:
- **JSON схема**: http://localhost:3001/swagger.json
- **UI интерфейс**: http://localhost:3001/apidocs/

---

## ⚙️ Настройка и конфигурация

### Переменные окружения (.env файл)
```
DB_NAME=flowers_db
DB_USER=postgres
DB_PASS=password
DB_HOST=127.0.0.1
JWT_SECRET=SUPER_SECRET_KEY
```

### Порт сервера
Сервер по умолчанию запускается на порту **3001**. Это можно изменить в `server.py`:
```python
PORT = 3001  # Измените это число
```

---

## 🐛 Решение проблем

### Ошибка "connection refused"
- Убедитесь, что сервер запущен: `python server.py`
- Проверьте порт: http://localhost:3001
- Если используете другой хост, измените URL

### Ошибка 401 (Unauthorized)
- Токен истёк (60 минут) — создайте новый
- Неверный формат токена — используйте `Bearer <token>`
- Токен не авторизован в Swagger — нажмите кнопку "Authorize"

### Ошибка 500 (Server Error)
- Проверьте консоль сервера для деталей ошибки
- Убедитесь, что БД запущена и доступна
- Проверьте логи в `.env` файле

---

## 📝 Структура ответа API

Все ответы возвращаются в JSON формате:

**Успешный ответ (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Ошибка (400, 401, 500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🎓 Дополнительные ресурсы

- [Swagger UI Official](https://swagger.io/tools/swagger-ui/)
- [Flasgger Documentation](https://github.com/flasgger/flasgger)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [JWT Authentication](https://jwt.io/)

---

**Последнее обновление:** 27 января 2026  
**Версия API:** 1.0
