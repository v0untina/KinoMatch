import React from 'react';
import styles from './GeneralPage.module.css';

const GeneralPage = () => {
  return (
    <div className={styles.container}>
        <div className={styles.posters_slide}>
        <div className={styles.movieCard}>
          <img className={styles.moviePoster} src="/chtivo.png"></img>
          <h2 className={styles.poster_title}>Криминальное <br />чтиво</h2>
      </div>
      <div className={styles.movieCard}>
          <img className={styles.moviePoster} src="/chtivo.png"></img>
          <h2 className={styles.poster_title}>Криминальное <br />чтиво</h2>
      </div>
      <div className={styles.movieCard}>
          <img className={styles.moviePoster} src="/chtivo.png"></img>
          <h2 className={styles.poster_title}>Криминальное <br />чтиво</h2>
      </div>
      </div>
      <div className={styles.main_content}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>Лента постов</h3>
          <ul className={styles.sidebarMenu}>
            <li><a href="#">Новинки</a></li>
            <li><a href="#">Топ рейтингов</a></li>
            <li><a href="#">Подборки пользователей</a></li>
            <li><a href="#">Рейтинг подборок</a></li>
            <li><a href="#">Рейтинг пользователей</a></li>
          </ul>
        </div>
        </aside>
        <div className={styles.test}>
        </div>
        </div>
    </div>
  );
};

export default GeneralPage;