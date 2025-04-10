"use client";
import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import { Link } from "@nextui-org/react";
import { ThemeSwitcher } from "@/components/ThemeSwitch/ThemeSwitch";
import { Menu, X } from "lucide-react";
import AuthContext from '@/context/auth.context';

// Компонент модального окна
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Закрыть модальное окно">
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const Header = ({ className }: { className?: string }) => {
    console.log("Rendering Header");
    const [menuOpen, setMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleLogout = () => {
        logout?.();
    };

    return (
        <div className={`${styles.header} ${className}`}>
            <div className={styles.headerInner}>
                <div className={styles.logo_header}>
                    <Link href={'/'}>
                        <Logo size={"small"} colored />
                        <img className={styles.ticket} src='/interface/1.png' alt="" />
                    </Link>
                </div>
                <div className={styles.header_buttons}>
                    <div className={styles.header_titles}>
                        <Link href={'/general'}>
                            <h2 className={styles.subtitles}>главная</h2>
                        </Link>
                        <Link href={'/polling'}>
                            <h2 className={styles.subtitles}>подобрать фильм</h2>
                        </Link>
                        <Link href={'/'} onClick={(e) => {
                          e.preventDefault();
                          setIsModalOpen(true);
                        }}>
                            <h2 className={styles.subtitles}>таблица рейтинга</h2>
                        </Link>
                        <Link href={'/crossing'}>
                            <h2 className={styles.subtitles}>скрестить фильм</h2>
                        </Link>
                        <Link href={'/compilations'}>
                            <h2 className={styles.subtitles}>подборки</h2>
                        </Link>
                    </div>

                    <div className={styles.login_buttons}>
                        {user ? (
                            <>  <Link href='/profile'>
                                <span className={styles.username_nickname}>{user.username}</span>
                                </Link>
                                <div className={styles.logout_container}>
                                <button onClick={handleLogout} className={styles.logout_button}>Выход</button>
                                <img className={styles.logout_image} src="/logout.png" alt="" />
                                </div>
                            </>
                        ) : (
                            <>
                                <img className={styles.login_image} src="/Login.png" alt="" />
                                <Link href='/login'>
                                    <h2 className={styles.login}>вход</h2>
                                </Link>
                                <span className={styles.span_login}>|</span>
                                <Link href='/register'>
                                    <h2 className={styles.login}>регистрация</h2>
                                </Link>
                            </>
                        )}
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
                        <Link href={'/'} onClick={(e) => {
                          e.preventDefault();
                          setIsModalOpen(true);
                          setMenuOpen(false);
                        }}>
                            <h2 className={styles.subtitles}>таблица рейтинга</h2>
                        </Link>
                        <Link href={'/crossing'}>
                            <h2 className={styles.subtitles}>скрестить фильм</h2>
                        </Link>
                        <Link href={'/compilations'}>
                            <h2 className={styles.subtitles}>подборки</h2>
                        </Link>
                    </div>
                    <div className={styles.login_buttons}>
                        {user ? (
                            <>
                              <span>{user.username}</span>
                              <button onClick={handleLogout} className={styles.logoutButton}>Выход</button>
                            </>
                        ) : (
                            <>
                                <img className={styles.login_image} src="/Login.png" alt="" />
                                <Link href='/login'>
                                    <h2 className={styles.login}>вход</h2>
                                </Link>
                                <span className={styles.span_login}>|</span>
                                <Link href='/register'>
                                    <h2 className={styles.login}>регистрация</h2>
                                </Link>
                            </>
                        )}
                    </div>
                    <div className={styles.theme}>
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <div className={styles.modal_main}>
                <h1 className={styles.modal_title}>таблица рейтинга</h1>
                <div className={styles.rating}>
                  <div className={styles.modal_card_people}>
                    <span className={styles.avatar}></span>
                    <p className={styles.nickname}>1. Пользователь 1</p> 
                    <p className={styles.count_point}>137</p>
                  </div>
                  <div className={styles.modal_card_people}>
                    <span className={styles.avatar}></span>
                    <p className={styles.nickname}>2. Пользователь 2</p> 
                    <p className={styles.count_point}>120</p>
                  </div>
                  <div className={styles.modal_card_people}>
                    <span className={styles.avatar}></span>
                    <p className={styles.nickname}>3. Пользователь 3</p> 
                    <p className={styles.count_point}>98</p>
                  </div>
                  <div className={styles.modal_card_people}>
                    <span className={styles.avatar}></span>
                    <p className={styles.nickname}>4. Пользователь 4</p> 
                    <p className={styles.count_point}>75</p>
                  </div>
                  <div className={styles.modal_card_people}>
                    <span className={styles.avatar}></span>
                    <p className={styles.nickname}>5. Пользователь 5</p> 
                    <p className={styles.count_point}>62</p>
                  </div>
                </div>
              </div>
            </Modal>
        </div>
    );
};

export default Header;