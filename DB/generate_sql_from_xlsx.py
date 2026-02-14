# Скрипт для генерации SQL INSERT запросов из Excel файла с растениями
# в sql файл `init.sql`, который затем можно выполнить для наполнения базы данных
# при поднятии docker-контейнера с Postgres

import pandas as pd
import json

# файлы
xlsx_file = "houseplants_dataset.xlsx"
sql_file = "init.sql"

# читаем Excel
df = pd.read_excel(xlsx_file)

# ожидаемые обязательные колонки
required = {"plant_id", "plant_name"}
missing = required - set(df.columns)
if missing:
    raise ValueError(f"В Excel отсутствуют обязательные столбцы: {missing}")

# открываем init.sql для дозаписи
with open(sql_file, "a", encoding="utf-8") as f:
    f.write("\n\n-- ===== Automatically generated INSERTs for plants =====\n")

    for _, row in df.iterrows():
        plant_id = int(row["plant_id"])
        plant_name = str(row["plant_name"]).replace("'", "''")  # эскейпим кавычки

        # формируем features JSON из всех колонок кроме id и name
        feature_dict = {}

        for col in df.columns:
            if col in ("plant_id", "plant_name"):
                continue

            value = row[col]

            # pandas может возвращать NaN → заменим на None
            if pd.isna(value):
                value = None

            feature_dict[col] = value

        features_json = json.dumps(feature_dict, ensure_ascii=False)

        # эскейпим одинарные кавычки внутри json
        features_json_sql = features_json.replace("'", "''")

        sql = (
            f"INSERT INTO plants (id, name, features) VALUES (\n"
            f"    {plant_id},\n"
            f"    '{plant_name}',\n"
            f"    '{features_json_sql}'::jsonb\n"
            f");\n"
        )

        f.write(sql)

print("Готово! SQL-запросы добавлены в init.sql")