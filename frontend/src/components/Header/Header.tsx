"use client";
import React from 'react';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import {Link} from "@nextui-org/react"
import {ThemeSwitcher} from "@/components/ThemeSwitch/ThemeSwitch";

const Header = ({className}: { className?: string }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerInner}>
        <Link href={'/'}>
          <Logo size={"small"} colored/>
          <img className={styles.ticket} src='/interface/1.png' alt="" />
        </Link>
        </div>
        <div className={styles.header_buttons}>
        <div className={styles.header_titles}>
          <h2 className={styles.subtitles}>главная</h2>
          <Link href={'/polling'}>
          <h2 className={styles.subtitles}>подобрать фильм</h2>
          </Link>
          <h2 className={styles.subtitles}>скрестить фильмы</h2>
          <h2 className={styles.subtitles}>подборки</h2>
        </div>
        <div className={styles.login_buttons}>
          <img src="/interface/Login.png" alt="" />
            <Link href='/login'>
          <h2 className={styles.login}>вход</h2>
          </Link>
          <span>|</span>
          <Link href='/register'>
          <h2 className={styles.login}>регистрация</h2>
          </Link>
        </div>
        </div>
        <div className={styles.theme}>
        <ThemeSwitcher/>
        </div>
    </div>
  );
};

export default Header;
