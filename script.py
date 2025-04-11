#!/usr/bin/env python3
# -*- coding: utf-8 -*- # Указываем кодировку для совместимости

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import os
from datetime import datetime

# --- Константы ---
BASE_URL = "https://kg-portal.ru/news/"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}
# Определяем путь к файлу JSON относительно текущего скрипта
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Идем на один уровень вверх от parser.py и затем в backend/data/
JSON_OUTPUT_PATH = os.path.join(SCRIPT_DIR, 'backend', 'data', 'news.json')

# --- Функции парсинга (остаются как были) ---
def get_preferred_images(picture_tag):
    """Возвращает JPG изображения или любые другие, если JPG нет"""
    all_images = []
    jpg_images = []

    if picture_tag:
        # Обрабатываем тег <img>
        img_tag = picture_tag.find('img')
        if img_tag and 'src' in img_tag.attrs:
            img_url = urljoin(BASE_URL, img_tag['src'])
            all_images.append(img_url)
            if img_url.lower().endswith(('.jpg', '.jpeg')):
                jpg_images.append(img_url)

        # Обрабатываем теги <source>
        for source in picture_tag.find_all('source'):
            if 'srcset' in source.attrs:
                # Берем первый URL из srcset (обычно этого достаточно)
                img_url_candidate = source['srcset'].split(',')[0].split()[0]
                img_url = urljoin(BASE_URL, img_url_candidate)
                all_images.append(img_url)
                if img_url.lower().endswith(('.jpg', '.jpeg')):
                    jpg_images.append(img_url)

    # Убираем дубликаты, сохраняя порядок
    unique_jpg = list(dict.fromkeys(jpg_images))
    unique_all = list(dict.fromkeys(all_images))

    return unique_jpg if unique_jpg else unique_all

def parse_news_page(url):
    try:
        print(f"Запрос к {url}...")
        response = requests.get(url, headers=HEADERS, timeout=15) # Добавлен таймаут
        response.raise_for_status() # Проверка на HTTP ошибки
        response.encoding = 'utf-8' # Указываем кодировку явно
        soup = BeautifulSoup(response.text, 'html.parser')

        news_items = soup.find_all('div', class_='news_box')
        results = []
        print(f"Найдено {len(news_items)} новостей.")

        for i, item in enumerate(news_items):
            title_tag = item.find('h2', class_='news_title')
            link_tag = title_tag.parent if title_tag else None
            category_tag = item.find('div', class_='cat')
            date_tag = item.find('div', class_='date')
            author_tag = item.find('a', class_='author')
            views_tag = item.find('div', class_='views')
            text_tag = item.find('div', class_='news_text')
            picture_tag = item.find('picture')

            news_data = {
                'id': f"news_{datetime.now().strftime('%Y%m%d')}_{i+1}", # Уникальный ID для новости
                'title': title_tag.text.strip() if title_tag else "Нет заголовка",
                'link': urljoin(BASE_URL, link_tag['href']) if link_tag and link_tag.has_attr('href') else None,
                'category': category_tag.text.strip() if category_tag else None,
                'date': date_tag.text.strip() if date_tag else None,
                'author': author_tag.text.strip() if author_tag else None,
                'views': views_tag.text.strip() if views_tag else None,
                'text': text_tag.text.strip() if text_tag else None,
                'images': list(set(get_preferred_images(picture_tag))) # Убираем дубликаты еще раз на всякий случай
            }
            results.append(news_data)
            print(f"Обработана новость: {news_data['title'][:30]}...")

        return results

    except requests.exceptions.Timeout:
        print(f"Ошибка: Таймаут при запросе к {url}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе: {e}")
        return None
    except Exception as e:
        print(f"Непредвиденная ошибка при парсинге: {e}")
        return None

# --- Функция сохранения ---
def save_to_json(data, filepath):
    """Сохраняет данные в JSON файл."""
    try:
        # Убедимся, что директория существует
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Записываем в файл с кодировкой UTF-8 и отступами для читаемости
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Данные успешно сохранены в {filepath}")
    except IOError as e:
        print(f"Ошибка записи в файл {filepath}: {e}")
    except Exception as e:
        print(f"Непредвиденная ошибка при сохранении JSON: {e}")


# --- Основной блок выполнения ---
if __name__ == "__main__":
    print("Запуск парсера новостей...")
    news_data = parse_news_page(BASE_URL)

    if news_data:
        save_to_json(news_data, JSON_OUTPUT_PATH)
    else:
        print("Не удалось получить данные новостей. Файл JSON не будет обновлен.")

    print("Парсер завершил работу.")