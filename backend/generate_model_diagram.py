import sys
import os
import inspect
from unittest.mock import MagicMock
from pydantic import BaseModel
import erdantic as erd

# 1. Заглушки для библиотек (чтобы импорт не падал из-за зависимостей)
mock_modules = [
    "passlib", "passlib.context", "jose", "jose.jwt", 
    "bcrypt", "app.services.security", "email_validator"
]
for mod in mock_modules:
    sys.modules[mod] = MagicMock()

# 2. Добавляем корень проекта в пути поиска
current_dir = os.getcwd()
sys.path.append(current_dir)

# --- НАСТРОЙКИ ---
root_folder = "app/models" # Главная папка для сканирования
# -----------------

all_models = []
seen_models = set()

print(f"🚀 Начинаю глубокое сканирование папки: {root_folder}")

# Используем os.walk для рекурсивного обхода всех подпапок
for root, dirs, files in os.walk(root_folder):
    for filename in files:
        if filename.endswith(".py") and filename != "__init__.py":
            # Вычисляем путь к файлу относительно корня (например, app/models/domain/users.py)
            file_path = os.path.join(root, filename)
            # Превращаем путь в формат импорта Python (app.models.domain.users)
            relative_path = os.path.relpath(file_path, current_dir)
            module_name = relative_path.replace(os.sep, ".").replace(".py", "")

            try:
                # Динамически импортируем найденный модуль
                module = __import__(module_name, fromlist=["*"])

                # Ищем в модуле классы Pydantic
                for name, obj in inspect.getmembers(module):
                    if inspect.isclass(obj) and issubclass(obj, BaseModel):
                        # Добавляем только если модель определена именно в этом файле
                        if obj not in seen_models and obj.__module__ == module_name:
                            all_models.append(obj)
                            seen_models.add(obj)
                            print(f"  ✅ Найдена: {module_name}.{name}")
            except Exception as e:
                # Если файл не импортируется (например, из-за сложных зависимостей), просто пишем об этом
                print(f"  ⚠️ Пропущен {module_name}: {e}")

# 3. Генерация диаграммы
if all_models:
    print(f"\n📊 Всего найдено уникальных моделей: {len(all_models)}")
    print("🎨 Рисую карту проекта...")
    try:
        output_file = "full_models_map.png"
        erd.draw(*all_models, out=output_file)
        print(f"\n✨ ГОТОВО! Карта сохранена в: {output_file}")
    except Exception as e:
        print(f"\n❌ Ошибка при генерации картинки: {e}")
        print("Подсказка: возможно, моделей слишком много для одной картинки.")
else:
    print("\n🤷 Модели не найдены. Проверь путь к папке app/models.")