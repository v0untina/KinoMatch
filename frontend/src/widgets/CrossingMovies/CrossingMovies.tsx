"use client";
import React, { useState } from "react";
import styles from "./CrossingMovies.module.css";

export default function CrossingMovies() {
  const [selected_popcorns, set_selected_popcorns] = useState(2);
  const [movie_count, set_movie_count] = useState(2);

  const handle_popcorn_click = (count: number) => {
    if (count < 2) return;
    set_selected_popcorns(count);
    set_movie_count(count);
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>сколько фильмов скрещиваем?</h1>
      <div className={styles.popcorn_container}>
        {[1, 2, 3, 4, 5].map((count) => (
          <div
            key={count}
            className={`${styles.popcorn_wrapper} ${
              count <= selected_popcorns ? "" : styles.inactive
            } ${count === 1 ? styles.disabled : ""}`}
            onClick={() => handle_popcorn_click(count)}
          >
            <img
              src={count <= selected_popcorns ? "/popcorn_active.png" : "/popcorn_inactive.png"}
              alt={`${count} попкорна`}
              className={styles.popcorn_image}
            />
          </div>
        ))}
      </div>

      <div className={styles.movies_container}>
        {Array.from({ length: movie_count }).map((_, index) => (
          <React.Fragment key={index}>
            <div className={styles.movie_card}>
              <div className={styles.movie_content}>
                Фильм {index + 1}
              </div>
              <div className={styles.search_container}>
                <input 
                  type="text" 
                  placeholder="Поиск фильма..." 
                  className={styles.search_input}
                />
              </div>
            </div>
            
            {index < movie_count - 1 && (
              <div className={styles.divider}>
               <img className={styles.image_crossing} src="/crossing.png" alt="" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
        <div className={styles.buttons_result}>
            <button className={styles.button_set}>подобрать фильмы</button>
            <button className={styles.button_random}><img className={styles.image_random} src="/Dice.png" alt="" /></button>
        </div>
      <div className={styles.result}>
        
      </div>
    </div>
  );
}