"use client";
import React, { useState } from 'react';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import { Link } from "@nextui-org/react";
import { ThemeSwitcher } from "@/components/ThemeSwitch/ThemeSwitch";
import { Menu } from "lucide-react";

const Header = ({ className }: { className?: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerInner}>
        <Link href={'/'}>
          <Logo size={"small"} colored />
          <img className={styles.ticket} src='/1.png' alt="" />
        </Link>
        <button className={styles.burger} onClick={toggleMenu}>
          <Menu size={32} />
        </button>
      </div>

      <div className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarInner}>
          <div className={styles.header_titles}>
            <h2 className={styles.subtitles}>главная</h2>
            <Link href={'/polling'}>
              <h2 className={styles.subtitles}>подобрать фильм</h2>
            </Link>
            <h2 className={styles.subtitles}>скрестить фильмы</h2>
            <h2 className={styles.subtitles}>подборки</h2>
          </div>
          <div className={styles.login_buttons}>
            <img src="/Login.png" alt="" />
            <Link href='/login'>
              <h2 className={styles.login}>вход</h2>
            </Link>
            <span>|</span>
            <Link href='/register'>
              <h2 className={styles.login}>регистрация</h2>
            </Link>
          </div>
          <div className={styles.theme}>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
