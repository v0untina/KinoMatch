import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'big';
  colored?: boolean;
}

const Logo: React.FC<LogoProps> = ({size = 'medium', colored = false}) => {
  // Определяем CSS-класс в зависимости от переданного размера и цвета
  const sizeClass = styles[size] || styles.medium;
  const coloredClass = colored ? styles.logoColored : "";

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.logo} ${sizeClass} ${coloredClass}`}>
        <span className={styles.mainText}>Все</span>
        <span className={styles.blue}>Матчи</span>
        <span className={styles.mainText}>.</span>
        <span className={styles.red}>РФ</span>
      </span>
    </div>
  );
};

export default Logo;