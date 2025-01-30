import React from 'react';
import styles from './CenteredModalLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({children}) => {
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.formInner}>
          {children}
        </div>
      </div>
      <div className={styles.bgWrapper}></div>
    </div>
  );
};

export default AuthLayout;