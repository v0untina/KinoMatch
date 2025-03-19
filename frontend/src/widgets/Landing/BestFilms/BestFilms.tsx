"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./BestFilms.module.css";

export default function BestFilms() {
  const [isNewFilmsVisible, setIsNewFilmsVisible] = useState(false);
  const [isBestFilmsVisible, setIsBestFilmsVisible] = useState(false);

  const newFilmsRef = useRef(null);
  const bestFilmsRef = useRef(null);

  useEffect(() => {
    const observerNewFilms = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNewFilmsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    
    const observerBestFilms = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsBestFilmsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (newFilmsRef.current) {
      observerNewFilms.observe(newFilmsRef.current);
    }

    if (bestFilmsRef.current) {
      observerBestFilms.observe(bestFilmsRef.current);
    }

    return () => {
      if (newFilmsRef.current) {
        observerNewFilms.unobserve(newFilmsRef.current);
      }
      if (bestFilmsRef.current) {
        observerBestFilms.unobserve(bestFilmsRef.current);
      }
    };
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.container_new_films} ref={newFilmsRef}>
        <h2 className={`${styles.subtitle} ${isNewFilmsVisible ? styles.fadeIn : ''}`}>
          популярные новинки
        </h2>
        <div className={`${styles.new_films} ${isNewFilmsVisible ? styles.slideUp : ''}`}>
          <div className={styles.card_film}>
            <img className={styles.image} src="/thor.jpeg" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image} src="/thor.jpeg" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image} src="/thor.jpeg" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image} src="/thor.jpeg" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <button className={styles.button_next}>></button>
        </div>
      </div>
      
      <div className={styles.best_films} ref={bestFilmsRef}>
        <h2 className={`${styles.subtitle} ${isBestFilmsVisible ? styles.fadeIn : ''}`}>
          топ рейтинга
        </h2>
        <div className={`${styles.new_films} ${isBestFilmsVisible ? styles.slideUp : ''}`}>
          <div className={styles.card_film}>
            <img className={styles.image_f} src="/loki.png" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image_f} src="/loki.png" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image_f} src="/loki.png" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <div className={styles.card_film}>
            <img className={styles.image_f} src="/loki.png" alt="" />
            <span className={styles.film_title}>Просто название фильма</span>
          </div>
          <button className={styles.button_next}>></button>
        </div>
      </div>
    </main>
  );
}
