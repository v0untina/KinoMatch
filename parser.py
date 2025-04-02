import requests
import os
import json
import shutil
import re
import time # Импортируем модуль time для пауз

# --- Конфигурация ---
TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YzYxMmFiNDEyYmI3NGVlZDI1MTY0NjNmNzFhOGQyMCIsIm5iZiI6MTc0MzYxNDc5Ny4yNzYsInN1YiI6IjY3ZWQ3MzRkODM2YzhlZGE3Y2FiMDEzZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xpdsAmclgjtqZO2cJVkhgVb9ZDpYUj8stI8Cc9XHOms' # ЗАМЕНИТЕ ЭТО!

BASE_URL = "https://api.themoviedb.org/3"
POSTER_SAVE_DIR = "posters"
DEFAULT_POSTER_SIZE = "w500"
NUM_MOVIES_TO_FETCH = 1000 # Количество фильмов для обработки
DELAY_BETWEEN_REQUESTS = 0.5 # Пауза в секундах между обработкой фильмов

IMAGE_BASE_URL = None
POSTER_SIZE = DEFAULT_POSTER_SIZE

# --- Вспомогательные функции ---

def sanitize_filename(filename):
    # ... (код функции без изменений) ...
    sanitized = re.sub(r'[\\/*?:"<>|]', "", filename)
    max_len = 200
    if len(sanitized) > max_len:
        name_part, ext_part = os.path.splitext(sanitized)
        available_len = max_len - len(ext_part) - 3
        sanitized = name_part[:available_len] + "..." + ext_part
    sanitized = sanitized.lstrip('.')
    if not sanitized or sanitized.isspace():
        sanitized = "invalid_filename"
    return sanitized.strip()

def make_tmdb_request(endpoint, params=None):
    # ... (код функции без изменений) ...
    if params is None:
        params = {}
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {TMDB_ACCESS_TOKEN}"
    }
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        # Добавим вывод статуса ошибки для лучшей диагностики
        status_code = e.response.status_code if hasattr(e, 'response') and e.response is not None else 'N/A'
        print(f"Ошибка запроса к TMDb API ({url}, Статус: {status_code}): {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Ответ API: {e.response.text}")
        return None
    except json.JSONDecodeError:
        print(f"Ошибка декодирования JSON ответа от {url}")
        if 'response' in locals():
             print(f"Ответ API: {response.text}")
        return None


def get_tmdb_configuration():
    # ... (код функции без изменений) ...
    global IMAGE_BASE_URL, POSTER_SIZE
    print("Запрашиваем конфигурацию TMDb...")
    config_data = make_tmdb_request("/configuration")
    if config_data and 'images' in config_data:
        IMAGE_BASE_URL = config_data['images'].get('secure_base_url')
        poster_sizes = config_data['images'].get('poster_sizes', [])
        if DEFAULT_POSTER_SIZE in poster_sizes:
            POSTER_SIZE = DEFAULT_POSTER_SIZE
        elif poster_sizes:
             POSTER_SIZE = poster_sizes[-2] if len(poster_sizes) > 1 else poster_sizes[0]
        else:
             POSTER_SIZE = 'original'

        if IMAGE_BASE_URL:
            print(f"Конфигурация получена. Базовый URL изображений: {IMAGE_BASE_URL}, Размер постера: {POSTER_SIZE}")
            return True
        else:
            print("Не удалось найти базовый URL изображений в конфигурации.")
            return False
    else:
        print("Не удалось получить или разобрать конфигурацию TMDb.")
        return False

def download_image(url, save_path):
    # ... (код функции без изменений) ...
    try:
        print(f"Скачивание изображения с {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'wb') as f:
             f.write(response.content)
        print(f"Изображение успешно сохранено как {save_path}")
        return True
    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if hasattr(e, 'response') and e.response is not None else 'N/A'
        print(f"Ошибка скачивания изображения {url} (Статус: {status_code}): {e}")
        return False
    except IOError as e:
        print(f"Ошибка сохранения файла {save_path}: {e}")
        return False
    except Exception as e:
        print(f"Непредвиденная ошибка при сохранении файла {save_path}: {e}")
        return False

# --- Основная логика ---

if not get_tmdb_configuration():
    print("Не удалось получить конфигурацию TMDb. Завершение скрипта.")
    exit()

print("\nЗапрашиваем популярные фильмы...")
popular_movies_data = make_tmdb_request("/movie/popular", params={"language": "ru-RU", "page": 1})

if popular_movies_data and 'results' in popular_movies_data:
    # Берем первые NUM_MOVIES_TO_FETCH фильмов из списка (или меньше, если их меньше)
    movies_to_process = popular_movies_data['results'][:NUM_MOVIES_TO_FETCH]

    if not movies_to_process:
        print("Не найдено фильмов в списке популярных.")
    else:
        print(f"Начинаем обработку {len(movies_to_process)} фильмов...")

        # --- Цикл по фильмам ---
        for index, movie_summary in enumerate(movies_to_process):
            movie_id = movie_summary.get('id')
            movie_title_summary = movie_summary.get('title', 'Название не найдено') # Название из общего списка

            if not movie_id:
                print(f"\nФильм #{index + 1}: Пропускаем запись без ID.")
                continue # Переходим к следующему фильму

            print(f"\n--- Фильм #{index + 1}: ID {movie_id} ({movie_title_summary}) ---")
            print("Запрашиваем детали...")

            # Запрашиваем детали для текущего фильма
            movie_details = make_tmdb_request(f"/movie/{movie_id}", params={
                "language": "ru-RU",
                "append_to_response": "credits,videos"
            })

            if movie_details:
                # Извлекаем информацию
                movie_title = movie_details.get('title', f'unknown_movie_{movie_id}')
                release_year = movie_details.get('release_date', 'N/A')[:4]
                overview = movie_details.get('overview', 'Описание отсутствует.')
                rating = movie_details.get('vote_average', 'N/A')
                genres = ', '.join([genre['name'] for genre in movie_details.get('genres', [])]) or 'Жанры не указаны'
                poster_path = movie_details.get('poster_path')

                print(f"  Название: {movie_title}")
                print(f"  Год выпуска: {release_year}")
                # print(f"  Описание: {overview[:100]}...") # Можно сократить вывод описания
                print(f"  Рейтинг TMDb: {rating}")
                print(f"  Жанры: {genres}")
                print(f"  Постер (путь): {poster_path}")

                # Скачивание и сохранение постера
                if poster_path and IMAGE_BASE_URL:
                    poster_url = f"{IMAGE_BASE_URL}{POSTER_SIZE}{poster_path}"
                    original_filename = os.path.basename(poster_path)
                    _, file_extension = os.path.splitext(original_filename)
                    if not file_extension:
                        file_extension = ".jpg"

                    sanitized_title = sanitize_filename(movie_title)
                    # Добавим год к имени файла для большей уникальности (опционально)
                    # filename_year = f" ({release_year})" if release_year != 'N/A' else ""
                    # new_filename = f"{sanitized_title}{filename_year}{file_extension}"
                    new_filename = f"{sanitized_title}{file_extension}"

                    save_filepath = os.path.join(POSTER_SAVE_DIR, new_filename)

                    download_image(poster_url, save_filepath)
                elif not poster_path:
                    print("  У фильма нет постера.")
                else:
                    print("  Не удалось сформировать URL постера (проблема с конфигурацией).")

                # Вывод актеров, режиссеров и трейлеров (можно убрать или оставить для отладки)
                cast = movie_details.get('credits', {}).get('cast', [])
                print(f"  Актеры (первые 3): {', '.join([a.get('name', '?') for a in cast[:3]])}")
                crew = movie_details.get('credits', {}).get('crew', [])
                directors = [member.get('name', '?') for member in crew if member.get('job') == 'Director']
                print(f"  Режиссеры: {', '.join(directors) if directors else 'Не найдены'}")
                # videos = movie_details.get('videos', {}).get('results', [])
                # trailers = [v for v in videos if v.get('type') == 'Trailer' and v.get('site') == 'YouTube']
                # print(f"  Трейлер YouTube: {'Найден' if trailers else 'Не найден'}")

            else:
                print(f"  Не удалось получить детальную информацию для фильма ID {movie_id}.")

            # --- Пауза перед следующим фильмом ---
            print(f"Пауза {DELAY_BETWEEN_REQUESTS} сек...")
            time.sleep(DELAY_BETWEEN_REQUESTS)
            # --- Конец цикла по фильмам ---

        print(f"\nОбработка {len(movies_to_process)} фильмов завершена.")

else:
    print("Не удалось получить список популярных фильмов или список пуст.")

print("\nСкрипт завершен.")