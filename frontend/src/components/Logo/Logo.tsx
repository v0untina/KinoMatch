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
        <span className={styles.mainText}>Kino</span>
        <span className={styles.blue}>Match</span>
      </span>
    </div>
  );
};

export default Logo;