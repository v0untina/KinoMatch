import React, { useState, useEffect } from 'react';
import styles from './CenteredModalLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const [currentFilm, setCurrentFilm] = useState(0);

  // Список всех фильмов
  const films = [
    { title: "Локи", image: "/ved'ma.jpg" },
    { title: "Chernobyl", image: "/loki.png" },
    { title: "The Dark Knight", image: "/chernobyl.png" },
    { title: "Rick and Morty", image: "/dark knight.png" }
  ];

  // Используем useEffect для автоматического переключения изображений
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFilm((prev) => (prev + 1) % films.length);
    }, 3000); // Перелистываем каждые 3 секунды

    return () => clearInterval(interval); // Очищаем интервал при размонтировании
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.formInner}>
          {children}
        </div>
      </div>
      <div className={styles.bgWrapper}>
        <div className={styles.best_films}>
          <div className={styles.bf_image_wrapper}>
            <img
              className={`${styles.bf_image2} ${styles.fadeIn}`}
              src={films[currentFilm].image}
              alt={films[currentFilm].title}
            />
            <h1 className={styles.image_title}>{films[currentFilm].title}</h1>
          </div>
        </div>
        <div className={styles.popular_films}>
          <div className={styles.film}>
            <h1 className={styles.image_title}>Локи</h1>        
            <img className={styles.bf_image} src="/loki.png" alt="" />
            <button className={styles.button_image}>Смотреть</button> 
          </div>
          <div className={styles.film}>
            <h1 className={styles.image_title}>Chernobyl</h1>        
            <img className={styles.bf_image} src="/chernobyl.png" alt="" />
            <button className={styles.button_image}>Смотреть</button> 
          </div>
          <div className={styles.film}>
            <h1 className={styles.image_title}>The Dark Knight</h1>        
            <img className={styles.bf_image} src="/dark knight.png" alt="" />
            <button className={styles.button_image}>Смотреть</button> 
          </div>
          <div className={styles.film}>
            <h1 className={styles.image_title}>Rick and Morty</h1>        
            <img className={styles.bf_image} src="/ram.png" alt="" />
            <button className={styles.button_image}>Смотреть</button> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
