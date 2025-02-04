"use client";
import React, { useState } from 'react';

const MovieRecommendationWidget = () => {
  const [movie1, setMovie1] = useState('');
  const [movie2, setMovie2] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');

  const handleRecommendClick = async () => {
    setError(''); // Сбросить ошибку перед новым запросом
    setRecommendation(''); // Сбросить предыдущую рекомендацию

    try {
      const response = await fetch('http://localhost:5000/recommend_movie', { // URL Python API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movie1: movie1, movie2: movie2 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Ошибка API: ${errorData.error || response.statusText}`);
        return;
      }

      const data = await response.json();
      setRecommendation(data.recommendation);
    } catch (e) {
        setError(`Произошла ошибка при отправке запроса: ${(e as Error).message}`); // <-- Добавлено (e as Error)
      }
  };

  return (
    <div>
      <h2>Получить рекомендацию фильма</h2>
      <div>
        <label htmlFor="movie1">Фильм 1:</label>
        <input
          type="text"
          id="movie1"
          value={movie1}
          onChange={(e) => setMovie1(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="movie2">Фильм 2:</label>
        <input
          type="text"
          id="movie2"
          value={movie2}
          onChange={(e) => setMovie2(e.target.value)}
        />
      </div>
      <button onClick={handleRecommendClick} disabled={!movie1 || !movie2}>
        Рекомендовать фильм
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {recommendation && (
        <div>
          <h3>Рекомендация:</h3>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default MovieRecommendationWidget;