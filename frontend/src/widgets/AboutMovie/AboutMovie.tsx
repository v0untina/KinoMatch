"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./AboutMovie.module.css";

interface Movie {
  movie_id: number;
  title: string;
  original_title: string | null;
  year: number | null;
  description: string | null;
  kinomatch_rating: number | null;
  imdb_rating: number | null;
  poster_filename: string | null;
  trailer_filename: string | null;
  country_id: number | null;
  movie_actors?: {
    actors: {
      actor_id: number;
      name: string;
      photo_filename: string | null;
    };
    character_name: string | null;
  }[];
  movie_directors?: {
    directors: {
      director_id: number;
      name: string;
      photo_filename: string | null;
    };
  }[];
  movie_genres?: {
    genres: {
      genre_id: number;
      name: string;
    };
  }[];
  countries?: {
    country_id: number;
    name: string;
  };
}

const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null) return null;
    
    const numericRating = Number(rating);
    if (isNaN(numericRating)) return null;
  
    // Для 5-балльной системы
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.3 && numericRating % 1 <= 0.7;
    const hasPartialStar = numericRating % 1 > 0.7;
    const emptyStars = 5 - fullStars - (hasHalfStar || hasPartialStar ? 1 : 0);
  
    return (
      <div className={styles.rating_container}>
        {/* Полные звезды */}
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} filled={true} />
        ))}
        
        {/* Половина звезды */}
        {hasHalfStar && <StarIcon key="half" filled="half" />}
        
        {/* Чуть больше половины */}
        {hasPartialStar && <StarIcon key="partial" filled="partial" />}
        
        {/* Пустые звезды */}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} filled={false} />
        ))}
        
        <span className={styles.rating_value}>{numericRating.toFixed(1)}</span>
      </div>
    );
  };
  
  const StarIcon = ({ filled }: { filled: boolean | "half" | "partial" }) => {
    const starColor = "rgba(0, 185, 174, 1)";
    const emptyColor = "#E0E0E0";
    
    if (filled === true) {
      return (
        <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: starColor }}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      );
    } else if (filled === "half") {
      return (
        <div className={styles.star_partial_container}>
          <svg className={styles.star} viewBox="0 0 24 24" style={{ 
            fill: starColor,
            clipPath: 'inset(0 50% 0 0)'
          }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
      );
    } else if (filled === "partial") {
      return (
        <div className={styles.star_partial_container}>
          <svg className={styles.star} viewBox="0 0 24 24" style={{ 
            fill: starColor,
            clipPath: 'inset(0 20% 0 0)'
          }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
      );
    } else {
      return (
        <svg className={styles.star} viewBox="0 0 24 24" style={{ fill: emptyColor }}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      );
    }
  };

export default function AboutMovie() {
  const params = useParams();
  const movieId = params?.id;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setError("ID фильма не указан");
      setIsLoading(false);
      return;
    }

    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${baseURL}/movies/${movieId}`, {
          params: {
            include: JSON.stringify({
              movie_actors: { include: { actors: true } },
              movie_directors: { include: { directors: true } },
              movie_genres: { include: { genres: true } },
              countries: true
            })
          }
        });
        setMovie(response.data);
      } catch (e: any) {
        console.error("Ошибка при загрузке фильма:", e);
        setError("Не удалось загрузить информацию о фильме. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  if (!movieId) return <div className={styles.error}>ID фильма не указан</div>;
  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!movie) return <div className={styles.error}>Фильм не найден</div>;

  return (
    <div className={styles.container}>
      <div className={styles.poster_container}>
        <img
          src={movie.poster_filename ? `/posters/${movie.poster_filename}` : "/interface/defaultAvatar.webp"}
          alt={movie.title}
          className={styles.poster}
        />
        <div className={styles.buttons_container}>
          <button className={styles.trailer_button}>смотреть трейлер</button>
          <button className={styles.favorites_button}>добавить в избранное</button>
        </div>
      </div>

      <div className={styles.info_container}>
        <h1 className={styles.title}>{movie.title} | {movie.original_title}</h1>
        
        <div className={styles.meta}>
        {movie.kinomatch_rating && (
            <div className={styles.rating}>
              <StarRating rating={movie.kinomatch_rating} />
            </div>
          )}
          {movie.imdb_rating && (
            <span className={styles.imdb_rating}><span className={styles.imdb_title}>IMDb</span> {movie.imdb_rating}</span>
          )}
        </div>
        
        {movie.movie_genres && movie.movie_genres.length > 0 && movie.countries && ( // Проверка на наличие жанров и страны
          <div className={styles.about_film}>
              {movie.movie_genres.length > 0 && ( // Проверяем, есть ли жанры для отображения
                <div className={styles.film_container}>
                  <img className={styles.image_anim} src="/Animation.png" alt="Жанры" /> {/* Используйте корректный путь к иконке жанра */}
                  <p className={styles.zhanr}>
                    {movie.movie_genres.map((mg, index) => ( // Мапим через массив жанров
                      <React.Fragment key={mg.genres.genre_id}>
                        {mg.genres.name}
                        {index < movie.movie_genres.length - 1 ? ', ' : ''} {/* Разделитель между жанрами */}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              )}
              {movie.countries && ( // Проверяем, есть ли страна для отображения
                <div className={styles.film_container}>
                  <img className={styles.image_country} src="/Earth Globe.png" alt="Страна" /> {/* Используйте корректный путь к иконке страны */}
                  <p className={styles.country}>{movie.countries.name}</p> {/* Отображаем название страны */}
                </div>
              )}
          </div>
        )}

        {movie.description && (
          <div className={styles.description}>
            <p className={styles.description_title}>{movie.description}</p>
          </div>
        )}

        {
          <div className={styles.kinoteatrs}>
            <div className={styles.container_title}>
              <img className={styles.image_tv} src="/Retro TV.png" alt="" />
              <p className={styles.title_kino}>Онлайн-кинотеатры</p>
            </div>
            <div className={styles.images_kino}>
              <img className={styles.kino_image} src="/start.png" alt="" />
              <img className={styles.kino_image} src="/start.png" alt="" />
              <img className={styles.kino_image} src="/start.png" alt="" />
            </div>
          </div>
        }
      {movie.movie_actors && movie.movie_actors.length > 0 && (
        <div className={styles.actors}>
          <h3 className={styles.actors_title}>Актёры</h3>
          <div className={styles.people_list}>
            {movie.movie_actors.map((ma, index) => (
              <div 
                key={ma.actors.actor_id} 
                className={`${styles.person} ${styles.actor_enter}`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <img
                  src={ma.actors.photo_filename ? `/actors/${ma.actors.photo_filename}` : "/interface/defaultAvatar.webp"}
                  alt={ma.actors.name}
                  className={styles.person_photo}
                />
                <div className={styles.person_info}>
                  <span className={styles.person_name}>{ma.actors.name}<br /></span>
                  {ma.character_name && (
                    <span className={styles.character_name}>{ma.character_name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        {
          <div className={styles.review_container}>
            <h2 className={styles.review_title}>отзывы</h2>
            <div className={styles.reviews}>
              <div className={styles.review}>
                  <img  className={styles.image_user} src="/User.png" alt="" />
                  <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
              </div>
              <div className={styles.review}>
                  <img  className={styles.image_user} src="/User.png" alt="" />
                  <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
              </div>
              <div className={styles.review}>
                  <img  className={styles.image_user} src="/User.png" alt="" />
                  <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
              </div>
              <div className={styles.review}>
                  <img  className={styles.image_user} src="/User.png" alt="" />
                  <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
}