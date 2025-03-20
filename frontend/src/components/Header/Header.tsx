"use client";
import React, { useState } from 'react';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import { Link } from "@nextui-org/react";
import { ThemeSwitcher } from "@/components/ThemeSwitch/ThemeSwitch";
import { Menu, X } from "lucide-react"; 

const Header = ({ className }: { className?: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerInner}>
        <div className={styles.logo_header}>
          <Link href={'/'}>
            <Logo size={"small"} colored />
            <img className={styles.ticket} src='/1.png' alt="" />
          </Link>
        </div>
        <div className={styles.header_buttons}>
        <div className={styles.header_titles}>
          <Link href={'/'}>
            <h2 className={styles.subtitles}>главная</h2>
          </Link>
          <Link href={'/polling'}>
            <h2 className={styles.subtitles}>подобрать фильм</h2>
          </Link>
          <Link href={'/'}>
            <h2 className={styles.subtitles}>скрестить фильмы</h2>
          </Link>
          <Link href={'/compilations'}>
            <h2 className={styles.subtitles}>подборки</h2>
          </Link>
        </div>

        <div className={styles.login_buttons}>
          <img className={styles.login_image} src="/Login.png" alt="" />
          <Link href='/login'>
            <h2 className={styles.login}>вход</h2>
          </Link>
          <span className={styles.span_login}>|</span>
          <Link href='/register'>
            <h2 className={styles.login}>регистрация</h2>
          </Link>
        </div>
        </div>

        <div className={styles.theme}>
          <ThemeSwitcher />
        </div>
        <button className={styles.burger} onClick={toggleMenu}>
          <Menu size={32} />
        </button>
      </div>
      <div className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarInner}>
          <button className={styles.closeButton} onClick={toggleMenu}>
            <X size={32} /> 
          </button>

          <div className={styles.header_titles}>
            <Link href={'/'}>
              <h2 className={styles.subtitles}>главная</h2>
            </Link>
            <Link href={'/polling'}>
              <h2 className={styles.subtitles}>подобрать фильм</h2>
            </Link>
            <Link href={'/'}>
              <h2 className={styles.subtitles}>скрестить фильмы</h2>
            </Link>
            <Link href={'/'}>
              <h2 className={styles.subtitles}>подборки</h2>
            </Link>
          </div>
          <div className={styles.login_buttons}>
            <img className={styles.login_image} src="/Login.png" alt="" />
            <Link href='/login'>
              <h2 className={styles.login}>вход</h2>
            </Link>
            <span className={styles.span_login}>|</span>
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