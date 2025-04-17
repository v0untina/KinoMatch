"use client";
import React, { useState, useContext, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import { Link } from "@nextui-org/react"; // Убедись, что Link из NextUI импортирован, если ты его используешь
import { ThemeSwitcher } from "@/components/ThemeSwitch/ThemeSwitch";
import { Menu, X } from "lucide-react";
import AuthContext from '@/context/auth.context';
import { fetchTopRatedUsers, type TopUser } from '@/api/profile'; // <-- Убедись, что путь к API верный
import toast from 'react-hot-toast';

// Компонент модального окна
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;

  // Убедись, что код выполняется только на клиенте, где document доступен
  if (typeof document === 'undefined') {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}> {/* Закрытие по клику на оверлей */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Предотвращение закрытия по клику на контент */}
        <button className={styles.modalClose} onClick={onClose} aria-label="Закрыть модальное окно">
          × {/* Знак "x" для закрытия */}
        </button>
        {children}
      </div>
    </div>,
    document.body // Монтируем в body
  );
};


const Header = ({ className }: { className?: string }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для модального окна рейтинга
    const auth = useContext(AuthContext); // Используем переменную auth для ясности
    const { user, logout } = auth || {}; // Деструктуризация с проверкой на null/undefined

    // --- Состояния для рейтинга ---
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [isLoadingRating, setIsLoadingRating] = useState(false);
    const [errorRating, setErrorRating] = useState<string | null>(null);
    // ---

    const toggleMenu = () => setMenuOpen(!menuOpen);

    // Обработчик выхода
    const handleLogout = () => {
        if (logout) {
             logout();
             toast.success("Вы успешно вышли."); // Опционально: уведомление
        } else {
             console.error("Logout function is not available in AuthContext");
             toast.error("Ошибка выхода.");
        }
    };

    const openRatingModal = useCallback(() => setIsModalOpen(true), []);
    const closeRatingModal = useCallback(() => setIsModalOpen(false), []);

    // --- Функция загрузки рейтинга ---
    const loadRating = useCallback(async () => {
        if (isLoadingRating) return;
        setIsLoadingRating(true);
        setErrorRating(null);
        console.log("Fetching top rated users..."); // Лог для отладки
        try {
            const users = await fetchTopRatedUsers(5); // Загружаем топ-5
            console.log("Top users fetched:", users); // Лог для отладки
            setTopUsers(users);
        } catch (err: any) {
            console.error("Failed to load top users:", err);
            const message = err.message || "Не удалось загрузить рейтинг. Попробуйте позже.";
            setErrorRating(message);
            toast.error(`Ошибка загрузки рейтинга: ${message}`);
        } finally {
            setIsLoadingRating(false);
        }
    }, [isLoadingRating]); // Зависимость isLoadingRating

    // --- Эффект для загрузки рейтинга при открытии модалки ---
    useEffect(() => {
        if (isModalOpen && (topUsers.length === 0 || errorRating)) {
            loadRating();
        }
    }, [isModalOpen, loadRating, topUsers.length, errorRating]);

    return (
        <div className={`${styles.header} ${className}`}>
            {/* Верхняя часть хедера (лого, основные кнопки, тема, бургер) */}
            <div className={styles.headerInner}>
                {/* Логотип */}
                <div className={styles.logo_header}>
                    {/* Используем обычный 'a' тег или Link из 'next/link', если @nextui-org/react Link не для навигации */}
                    <a href={'/'} className={styles.logoLink}> {/* Заменил NextUI Link на 'a' для простоты */}
                        <Logo size={"small"} colored />
                        <img className={styles.ticket} src='/interface/1.png' alt="" />
                    </a>
                </div>

                {/* Основные кнопки навигации (для десктопа) */}
                <div className={styles.header_buttons}>
                    <div className={styles.header_titles}>
                         {/* Используем 'a' теги */}
                        <a href={'/general'} className={styles.subtitlesLink}>
                            <h2 className={styles.subtitles}>главная</h2>
                        </a>
                        <a href={'/polling'} className={styles.subtitlesLink}>
                            <h2 className={styles.subtitles}>подобрать фильм</h2>
                        </a>
                        {/* Кнопка для открытия модального окна */}
                        <button onClick={openRatingModal} className={`${styles.subtitlesLink} ${styles.ratingButton}`}>
                            <h2 className={styles.subtitles}>таблица рейтинга</h2>
                        </button>
                        <a href={'/crossing'} className={styles.subtitlesLink}>
                            <h2 className={styles.subtitles}>скрестить фильм</h2>
                        </a>
                        <a href={'/compilations'} className={styles.subtitlesLink}>
                            <h2 className={styles.subtitles}>подборки</h2>
                        </a>
                    </div>

                    {/* Кнопки входа/регистрации или имя пользователя/выход */}
                    <div className={styles.login_buttons}>
                        {user ? (
                            <>
                                <a href='/profile' className={styles.usernameLink}>
                                    <span className={styles.username_nickname}>{user.username}</span>
                                </a>
                                <div className={styles.logout_container}>
                                    <button onClick={handleLogout} className={styles.logout_button} aria-label="Выйти из аккаунта">Выход</button>
                                    <img className={styles.logout_image} src="/logout.png" alt="" />
                                </div>
                            </>
                        ) : (
                            <>
                                <img className={styles.login_image} src="/Login.png" alt="" />
                                <a href='/login' className={styles.loginLink}>
                                    <h2 className={styles.login}>вход</h2>
                                </a>
                                <span className={styles.span_login}>|</span>
                                <a href='/register' className={styles.loginLink}>
                                    <h2 className={styles.login}>регистрация</h2>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Переключатель темы */}
                <div className={styles.theme}>
                    <ThemeSwitcher />
                </div>

                {/* Кнопка бургер-меню (для мобильных) */}
                <button className={styles.burger} onClick={toggleMenu} aria-label="Открыть меню">
                    <Menu size={32} />
                </button>
            </div>

            {/* Боковое меню (sidebar) */}
            <div className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
                <div className={styles.sidebarInner}>
                    {/* Кнопка закрытия сайдбара */}
                    <button className={styles.closeButton} onClick={toggleMenu} aria-label="Закрыть меню">
                        <X size={32} />
                    </button>

                    {/* Навигация в сайдбаре */}
                    <div className={styles.sidebar_nav}>
                         <a href={'/general'} className={styles.sidebarLink} onClick={toggleMenu}>главная</a>
                         <a href={'/polling'} className={styles.sidebarLink} onClick={toggleMenu}>подобрать фильм</a>
                         <button onClick={() => { openRatingModal(); toggleMenu(); }} className={styles.sidebarLinkButton}>таблица рейтинга</button>
                         <a href={'/crossing'} className={styles.sidebarLink} onClick={toggleMenu}>скрестить фильм</a>
                         <a href={'/compilations'} className={styles.sidebarLink} onClick={toggleMenu}>подборки</a>
                    </div>

                     {/* Вход/Выход в сайдбаре */}
                    <div className={styles.sidebar_auth}>
                        {user ? (
                            <>
                              <a href='/profile' className={styles.sidebarUsername} onClick={toggleMenu}>{user.username}</a>
                              <button onClick={() => { handleLogout(); toggleMenu(); }} className={styles.sidebarLogoutButton}>Выход</button>
                            </>
                        ) : (
                            <>
                                <a href='/login' className={styles.sidebarLinkAuth} onClick={toggleMenu}>Вход</a>
                                <a href='/register' className={styles.sidebarLinkAuth} onClick={toggleMenu}>Регистрация</a>
                            </>
                        )}
                    </div>

                    {/* Переключатель темы в сайдбаре */}
                    <div className={styles.sidebar_theme}>
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>

            {/* Модальное окно рейтинга (рендер через портал) */}
            <Modal isOpen={isModalOpen} onClose={closeRatingModal}>
              <div className={styles.modal_main}>
                <h1 className={styles.modal_title}>таблица рейтинга</h1>
                <div className={styles.rating}>
                  {/* Отображение состояния загрузки */}
                  {isLoadingRating && <p className={styles.loadingMessage}>Загрузка рейтинга...</p>}

                  {/* Отображение ошибки */}
                  {errorRating && !isLoadingRating && (
                    <div className={styles.errorMessage}>
                      <p>{errorRating}</p>
                      {/* Кнопка повторной загрузки */}
                      <button onClick={loadRating} className={styles.retryButton}>Повторить</button>
                    </div>
                  )}

                  {/* Отображение пустого рейтинга */}
                  {!isLoadingRating && !errorRating && topUsers.length === 0 && (
                    <p className={styles.emptyMessage}>Рейтинг пока пуст.</p>
                  )}

                  {/* Отображение списка пользователей */}
                  {!isLoadingRating && !errorRating && topUsers.length > 0 && (
                    topUsers.map((ratedUser, index) => (
                      // Используем user_id как ключ
                      <div key={ratedUser.user_id} className={styles.modal_card_people}>
                        {/* TODO: Заменить span на Image компонент для аватара, если данные аватара будут приходить */}
                        <span className={styles.avatar}>
                            {/* <img src={getAvatarUrl(ratedUser.avatar_filename)} alt={`${ratedUser.username} avatar`} /> */}
                        </span>
                        <p className={styles.nickname}>{index + 1}. {ratedUser.username}</p>
                        <p className={styles.count_point}>{ratedUser.rating}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Modal>
        </div>
    );
};

export default Header;