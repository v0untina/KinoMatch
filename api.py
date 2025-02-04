from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS 

app = Flask(__name__)
CORS(app) 

API_KEY = "AIzaSyBlpcDVPCIFRsBKbVkBeT3pOGvvJgfiWJw" 
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
        Порекомендуй мне один фильм, похожий на фильмы "{movie1}" и "{movie2}".
        Выведи ответ в **две строки** в следующем формате:

        Строка 1:  "Я рекомендую фильм \"[название рекомендованного фильма]\", потому что фильмы \"{movie1}\" и \"{movie2}\" похожи [краткое перечисление общих характеристик]."
        Строка 2: "Поэтому \"[название рекомендованного фильма]\" - отличный вариант для просмотра."
        """

        response = model.generate_content(user_query)
        recommendation_text = response.text

        return jsonify({'recommendation': recommendation_text}) 

    except Exception as e:
        print(f"Ошибка в API: {e}")
        return jsonify({'error': 'Произошла ошибка при обработке запроса.', 'details': str(e)}), 500 


if __name__ == '__main__':
    app.run(debug=True, port=5000) 