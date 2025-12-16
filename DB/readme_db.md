## Быстрый старт
Запустить Docker desktop  
Создать файл .env с кредами к БД (в папке DB)    
В директории с файлами `init.sql` и `docker-compose.yml` ввести команду
```
docker-compose up -d
```

Поднимется БД из докера.  

## PGadmin
Чтобы подключить pgadmin к поднятой БД:
1. Открываем pqadmin
2. Add new server
3. Вводим название сервера
4. Заполяннем данные:  
    - Host name/address: db (если оба в контейнерах) или **localhost (если локально)**  
    - Port: 5432 (внутренний порт) или **5001 (внешний порт из docker-compose)**  
    - Maintenance database: flowersdb  
    - Username: из env  
    - Password: из env  
    - Save password? - поставьте галочку, чтобы не вводить каждый раз

## Для чего `postgres_data`?
При перезапуске:  
docker-compose down  # данные СОХРАНЯЮТСЯ в ./postgres_data  
docker-compose up -d # данные ЗАГРУЖАЮТСЯ из ./postgres_data  

init.sql НЕ выполняется (только при первом запуске)  
Все изменения в БД будут сохраняться в `postgres_data` (которые совершали и в pgadmin)  

postgres_data volume:
- Без него данные теряются при перезапуске
- С ним данные сохраняются
- Создается автоматически при первом запуске

## Как остановить докер?
```
# Из папки с docker-compose.yml. Это запускать:
docker-compose down

# Удалить контейнеры и volumes (данные будут потеряны!)
docker-compose down -v

# Удаляет также образы, полное удаление
docker-compose down -v --rmi all
```

## ! Ошибки
**Если ошибки с env**  
Нужно чтобы env был в директории DB   
ИЛИ как-то так (может быть неправильно) 
```
cd путь\FlowersChoice
docker-compose -f DB/docker-compose.yml up -d
```
**Ошибка при поднятии докера:**  
Проверь что БД готова (подожди 10-15 секунд): (команда для статуса)
```
docker ps
``` 
Убедись что данные вставились:(вывод кол-во записей в БД)
```
docker exec pgvector_postgres psql -U postgres -d flowers_choice -c "SELECT COUNT(*) FROM plants;"
```

## ! Экспорт БД
```
-- В pgAdmin или через psql экспортируйте данные в SQL
-- pgAdmin: правой кнопкой на базу → Backup
-- Командой:
# Создать data.sql
docker exec pgvector_postgres pg_dump -U postgres --data-only flowersdb > data.sql
```
```
# В docker-compose.yml добавить еще один volume
volumes:
  - ./init.sql:/docker-entrypoint-initdb.d/1_init.sql    # структура
  - ./data.sql:/docker-entrypoint-initdb.d/2_data.sql    # данные
  - ./postgres_data:/var/lib/postgresql/data
```
При запуске докера данные заполнятся автоматически после создания стурктуры. Файлы выполняются в алфавитном порядке по имени.sss