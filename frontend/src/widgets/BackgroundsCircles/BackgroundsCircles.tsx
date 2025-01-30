import React from 'react';
import styles from "./BackgroundsCircles.module.css";

const BackgroundsCircles = () => {
  return (
    <div className={styles.bgWrapper}>
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
    </div>
  );
};

export default BackgroundsCircles;