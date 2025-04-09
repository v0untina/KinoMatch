from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

API_KEY = "AIzaSyAKBrjBHK61wm2Ktcrr-NApXBTX0qGrmf8"  # Замените на ваш ключ
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp-01-21')


@app.route('/recommend_movie', methods=['POST'])
def recommend_movie():
    """
    Эндпоинт API для рекомендации фильма на основе двух введенных фильмов.
    Принимает JSON запрос с названиями фильмов movie1 и movie2.
    Возвращает JSON ответ с рекомендацией фильма и обоснованием.
    """
    try:
        data = request.get_json()  # Получаем JSON данные из запроса
        movie1 = data.get('movie1')
        movie2 = data.get('movie2')

        if not movie1 or not movie2:
            return jsonify({'error': 'Необходимо передать названия фильмов movie1 и movie2 в JSON запросе.'}), 400 # Bad Request

        user_query = f"""
Пожалуйста, порекомендуй мне один фильм, похожий по духу и ключевым характеристикам на фильмы, **строго указанные по названиям как** "{movie1}" и "{movie2}".  Дай наиболее релевантную и интересную рекомендацию, но только если **оба названия фильмов будут успешно и однозначно распознаны и найдены в твоей базе знаний**.

**Крайне важные инструкции (выполнять абсолютно точно):**

1. **Сверх-строгое распознавание и проверка НАЗВАНИЙ фильмов:**
    * **Интерпретируй строку "{movie1}" ТОЛЬКО как ПОТЕНЦИАЛЬНОЕ НАЗВАНИЕ ФИЛЬМА.**  Твоя задача - **точно и однозначно** определить, является ли строка "{movie1}" **валидным и полным названием фильма**, известным тебе.
        * **Условие 1: Строка "{movie1}" должна быть ФАКТИЧЕСКИМ НАЗВАНИЕМ ФИЛЬМА.**  Примеры валидных названий: "Форсаж", "Угнать за 60 секунд", "Криминальное чтиво".  Примеры **НЕвалидных названий**: "когда вышел форсаж 1", "ебанный форсаж 2", "фильм про гонки", "какой-то боевик".
        * **Условие 2: Строка "{movie1}" не должна содержать НИЧЕГО, КРОМЕ названия фильма.**  Никаких вопросов, описаний, лишних слов, фраз, уточнений, дат, оценок и т.д.  Только чистое название фильма.
        * **Условие 3: Ты должна ЗНАТЬ фильм с ТОЧНО ТАКИМ названием.**  Проверь свою базу знаний.

    * **Если строка "{movie1}" НЕ СООТВЕТСТВУЕТ ВСЕМ ТРЕМ УСЛОВИЯМ выше, немедленно и БЕЗ ИСКЛЮЧЕНИЙ ответь: "Фильм \"{movie1}\" не найден." и НЕМЕДЛЕННО ЗАВЕРШИ выполнение запроса.**  НИКАКИХ попыток интерпретации, догадок или поиска похожего по смыслу.

    * Повтори АБСОЛЮТНО ТЕ ЖЕ САМЫЕ ТРИ УСЛОВИЯ для строки "{movie2}".
    * **Только и ИСКЛЮЧИТЕЛЬНО если ОБЕ строки ({movie1} и "{movie2}") УСПЕШНО прошли проверку по ВСЕМ ТРЕМ УСЛОВИЯМ, переходи к следующему шагу.**  В противном случае - немедленный ответ "не найден" и завершение.

2. **Анализ и рекомендация (только если ОБА фильма найдены и названия распознаны):**
    * Тщательно проанализируй фильмы, названия которых ты распознала из "{movie1}" и "{movie2}".  Обрати внимание на: жанр, темы, атмосферу, стиль, режиссуру.
    * Выбери фильм, который имеет **существенное и явное сходство** с обоими фильмами по ключевым параметрам.

3. **Формат ответа (строго две строки, только если оба фильма найдены):**

   Строка 1: "Я рекомендую фильм \"[название рекомендованного фильма]\", потому что фильмы \"{movie1}\" и \"{movie2}\" похожи [краткое описание общих характеристик]."
   Строка 2: "Поэтому \"[название рекомендованного фильма]\" - отличный вариант для просмотра."

        """

        response = model.generate_content(user_query)
        recommendation_text = response.text

        return jsonify({'recommendation': recommendation_text})

    except Exception as e:
        print(f"Ошибка в API: {e}")
        return jsonify({'error': 'Произошла ошибка при обработке запроса.', 'details': str(e)}), 500


@app.route('/api/submit_poll', methods=['POST'])
def submit_poll():
    """
    API endpoint для приема ответов на опрос о предпочтениях фильмов.
    Принимает JSON запрос с ответами пользователя.
    В будущем будет использоваться для подбора фильмов.
    """
    print(">>> Функция submit_poll() вызвана!")
    try:
        poll_answers = request.get_json()

        if not poll_answers:
            return jsonify({'error': 'Нет данных об ответах на опрос в JSON запросе.'}), 400

        print("----- Получены ответы на опрос: -----")
        print(poll_answers)
        print("-------------------------------------")

        # Формирование запроса к нейросети на основе ответов
        user_preferences = ""
        for question_id, answer in poll_answers.items():
            question_id = int(question_id) # Преобразуем ID вопроса в целое число
            if question_id == 0:
                user_preferences += f"Я хочу испытать настроение: {answer}. "
            elif question_id == 1:
                if isinstance(answer, list):
                    user_preferences += f"Мне интересны жанры: {', '.join(answer)}. "
                else:
                    user_preferences += f"Мне интересен жанр: {answer}. "
            elif question_id == 2:
                user_preferences += f"Я предпочитаю смотреть фильмы: {answer}ом. "
            elif question_id == 3:
                user_preferences += f"Мне нравится {answer} стиль. "
            elif question_id == 4:
                user_preferences += f"Мне нравится  {answer} сюжет. "
            elif question_id == 5:
                user_preferences += f"Мне нравится  {answer} главный герой. "
            elif question_id == 6:
                user_preferences += f"Мне нравится {answer} элемент фильма. "
            elif question_id == 7:
                user_preferences += f"Для меня важен {answer} элемент фильма. "
            elif question_id == 8:
                user_preferences += f"Мне нравится смотреть в {answer}. "
            elif question_id == 9:
                user_preferences += f"Мне нравится  {answer} уровень реализма. "

        prompt = f"""
        Порекомендуй мне один фильм на основе следующих предпочтений:
        {user_preferences}
        Дай только название фильма и год выпуска.
        """



        # Отправка запроса к нейросети
        try:
            response = model.generate_content(prompt)
            recommendation = response.text

        except Exception as inner_e:
            print(f"Внутренняя ошибка при вызове нейросети: {inner_e}")
            recommendation = "Ошибка при получении рекомендации от нейросети."

        print("<<< Функция submit_poll() успешно завершена!")
        return jsonify({'success': True, 'recommendation': recommendation}), 200
    except Exception as e:
        print(f"Внешняя ошибка при обработке ответов на опрос: {e}")
        return jsonify({'error': 'Произошла ошибка при обработке ответов на опрос.', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)