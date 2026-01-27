# Быстрый старт одной командой
Откройте PowerShell в корневой папке проекта  
  
Запустите все сервисы:  

```
.\run-app.ps1 start
```  
Для запуска только инфраструктуры (БД + MinIO):  

```
.\run-app.ps1 start -Infra
```

# Что нужно доставить для запуска FRONT

- Скачать node.js
- Установить npm
- Перейти в директорию frontend и выполнить команды:
    - npm install
    - npm install express
    - npm install cors
- Создать в директории /frontend/src файл userProfile.json. 
В него будет складываться пользовательская информация от регистрации.
Помимо этого в логах сервера будет также выводиться пользовательская информация.
- Выполнить запуск сервера(бэкенд)
    - node server.js
- Выполнить запуск фронта
    - npm run install

# Как создать виртуальное окружение?
```
python -m venv venv
venv\Scripts\Activate.ps1
```

# Что нужно доставить для запуска Backend
1) Создать виртуальное окружение с именем venv командной:
    python -m venv venv
2) Установить в виртуальное окружение все необходимые библиотеки командой:
    pip install -r requirements.txt
3) Запустить сервер командой:
    python server.py

# Быстрый старт с помощью файла запуска
**Быстрый запуск одной командой**  
Откройте PowerShell в корневой папке проекта  
  
Запустите все сервисы:  

```
.\run-app.ps1 start
```  
Для запуска только инфраструктуры (БД + MinIO):  

```
.\run-app.ps1 start -Infra
```
**Доступные команды**  
Команда	Описание  
```
.\run-app.ps1 start	        # Запустить все сервисы  
.\run-app.ps1 start -Infra	# Только БД и MinIO  
.\run-app.ps1 stop	        # Остановить все  
.\run-app.ps1 stop -Infra	# Остановить инфраструктуру  
.\run-app.ps1 status	    # Статус всех сервисов  
.\run-app.ps1 restart	    # Перезапустить все
```  

После запуска будут доступны:  
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- База данных: http://localhost:5001
- MinIO (хранилище): http://localhost:9000
- Логин MinIO: minioadmin / minioadmin

**Структура проекта**  
FlowersChoice/  
├── run-app.ps1          ← основной скрипт запуска  
├── DB/                  ← база данных (Docker)  
├── minio/               ← объектное хранилище (Docker)  
├── backend/             ← Python Flask бэкенд  
└── frontend/            ← React/Vue фронтенд  
