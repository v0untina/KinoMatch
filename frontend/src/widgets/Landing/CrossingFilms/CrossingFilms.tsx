"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./CrossingFilms.module.css";
import { Link } from "@nextui-org/react";

export default function CrossingFilms() {
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [areCardsVisible, setAreCardsVisible] = useState(false);
  const [isCrossingImageVisible, setIsCrossingImageVisible] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  const titleRef = useRef(null);
  const cardsRef = useRef(null);
  const crossingImageRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (entry.target === titleRef.current) setIsTitleVisible(true);
          if (entry.target === cardsRef.current) setAreCardsVisible(true);
          if (entry.target === crossingImageRef.current) setIsCrossingImageVisible(true);
          if (entry.target === buttonRef.current) setIsButtonVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(titleRef.current);
    observer.observe(cardsRef.current);
    observer.observe(crossingImageRef.current);
    observer.observe(buttonRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className={styles.main}>
      <h2
        ref={titleRef}
        className={`${styles.title} ${isTitleVisible ? styles.fadeIn : ''}`}
      >
        скрестить фильмы
      </h2>
      <div className={styles.crossing_center}>
        <div
          ref={cardsRef}
          className={`${styles.crossing} ${areCardsVisible ? styles.fadeIn : ''}`}
        >
          <div className={`${styles.crossing_card} ${areCardsVisible ? styles.cardAnimation : ''}`}>
            <img className={styles.card_image} src="posters/chernobyl.png" alt="" />
            <span className={styles.crossing_film_title}>Чернобыль: Зона отчуждения</span>
          </div>
          <img
            ref={crossingImageRef}
            className={`${styles.crossing_image} ${isCrossingImageVisible ? styles.crossingImageAnimation : ''}`}
            src="interface/crossing.png"
            alt=""
          />
          <div className={`${styles.crossing_card} ${areCardsVisible ? styles.cardAnimation : ''}`}>
            <img className={styles.card_image} src="posters/ram.png" alt="" />
            <span className={styles.crossing_film_title}>Рик и Морти / Rick and Morty</span>
          </div>
        </div>
      </div>
      <div
        ref={buttonRef}
        className={`${styles.loginlink} ${isButtonVisible ? styles.fadeIn : ''}`}
      >
        <Link href={'/login'}>
          <button className={styles.loginbutton}>подобрать фильм</button>
        </Link>
      </div>
    </main>
  );
}
