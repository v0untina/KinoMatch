// frontend/src/widgets/Compilations/Compilations.tsx
"use client";
import React, { useState, useEffect } from 'react';
import styles from "./Compilations.module.css";
import { getCompilations } from '@/api/compilations';
import Link from 'next/link'; // Импортируем Link

interface Compilation {
  collection_id: number;
  title: string;
  imageFilename: string | null;
}

// Оборачиваем карточку в Link
function Card({ compilation }: { compilation: Compilation }) {
  const { collection_id, title, imageFilename } = compilation;
  const imageUrl = imageFilename ? `/compilations/${imageFilename}` : "https://via.placeholder.com/400x300";

  return (
    // Добавляем Link вокруг li
    <Link href={`/compilations/${collection_id}`} className={styles.cardLink}>
        <li className={`${styles.places__item} ${styles.card}`}>
            <img className={styles.card__image} src={imageUrl} alt={title} />
            <div className={styles.card__description}>
                <h2 className={styles.card__title}>{title}</h2>
            </div>
        </li>
    </Link>
  );
}

// Остальной код Compilations остается без изменений...
export default function Compilations() {
  const [compilations, setCompilations] = useState<Compilation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompilations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompilations();
        const compilationImageMap: { [title: string]: string } = {
          "Лучшие комедии": "best_comedies.png",
          "Жуткие фильмы": "creepy_movies.png",
          "Лучшие мультфильмы всех времен": "Thebestcartoonsofalltime.png",
          "Военные фильмы": "War_films.png",
          "Фильмы-мюзикл": "Musical_films.png",
          "Фильмы про супергероев": "Superhero_movies.png",
          "Фильмы про спорт": "sport_movies.png",
          "Захватывающие детективы": "Thrilling_detective_stories.webp",
          "Криминальные драмы": "criminal_drama.jpg",
          "Фантастические миры": "fantastic_world.jpg",
          "Дикий Запад": "wild_west.webp",
          "Документальное кино": "Documentary_films.jpg",
        };

        const compilationsWithImages = data.map(compilation => ({
          ...compilation,
          imageFilename: compilationImageMap[compilation.title] || null,
        }));
        setCompilations(compilationsWithImages);
      } catch (e: any) {
        setError(e.message || "Failed to load compilations");
      } finally {
        setLoading(false);
      }
    };

    fetchCompilations();
  }, []);

  if (loading) {
    return <p>Загрузка подборок...</p>;
  }

  if (error) {
    return <p>Ошибка загрузки подборок: {error}</p>;
  }

  return (
    <main className={styles.main}>
      {/* Оборачиваем ul в div, чтобы стили ссылок не ломали грид */}
      <div className={styles.places__list_wrapper}>
          <ul className={styles.places__list}>
            {compilations.map((compilation) => (
              <Card
                key={compilation.collection_id}
                compilation={compilation}
              />
            ))}
          </ul>
      </div>
    </main>
  );
}