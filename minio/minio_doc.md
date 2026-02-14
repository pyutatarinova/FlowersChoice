Запустить docker docker-compose up -d


После запуска контейнера нужно запустить скрипт для подгрузки minio (в качестве  параметра --dir подставить папку где лежат все изображения):

python upload_and_update_db.py --dir C:\Projects_Visual_Studio\minio_photos\images --minio-endpoint http://localhost:9000 --minio-access minioadmin --minio-secret minioadmin --bucket plants --db-host localhost --db-port 5001 --db-name flowersdb --db-user postgres --db-pass postgres