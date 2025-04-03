import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'big';
  colored?: boolean;
}

const Logo: React.FC<LogoProps> = () => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.logo} >
        <span className={styles.mainText}>киноmatch</span>
      </span>
    </div>
  );
};

export default Logo;