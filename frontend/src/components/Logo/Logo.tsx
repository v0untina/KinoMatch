import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'big';
  colored?: boolean;
}

const Logo: React.FC<LogoProps> = ({size = 'medium', colored = false}) => {
  const sizeClass = styles[size] || styles.medium;
  const coloredClass = colored ? styles.logoColored : "";

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.logo} ${sizeClass} ${coloredClass}`}>
        <span className={styles.mainText}>киноmatch</span>
      </span>
    </div>
  );
};

export default Logo;