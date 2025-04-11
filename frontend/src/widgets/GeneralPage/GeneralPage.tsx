"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth';
// --- Оставляем ТОЛЬКО эту строку для API постов ---
import { Post, Comment, getPosts, createPost, likePost, addComment } from '@/api/posts';
// --- Строку ниже нужно было УДАЛИТЬ ---
// import { getPosts, createPost, Post } from '@/api/posts'; // <-- УДАЛИТЬ ЭТУ СТРОКУ
import { getNews, NewsItem } from '@/api/news'; // <-- Импорт новостей (если нужен)
import toast from 'react-hot-toast';

// --- PostCard компонент (остается без изменений) ---
const PostCard = ({ post }: { post: Post }) => {

    // Состояния для лайков
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes ?? 0);
    const [isLiking, setIsLiking] = useState(false);

    // Состояния для комментариев
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    // Локальное состояние для отображения комментов (обновляется после успешной отправки)
    // Это *не* идеальное решение, лучше обновлять состояние в GeneralPage,
    // но для демонстрации внутри PostCard можно сделать так:
    const [displayComments, setDisplayComments] = useState<Comment[]>(post.comments || []);

    // Форматирование даты поста
    const formattedDate = post.timestamp
        ? new Date(post.timestamp).toLocaleString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
          })
        : 'Дата не указана';

    // Обработчики ошибок изображений
    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = '/interface/defaultAvatar.webp';
    };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
    };

    // --- Обработчик лайка (без изменений) ---
    const handleLikeClick = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            console.log(`Sending like request for post: ${post.postId}`);
            const response = await likePost(post.postId);
            setLikesCount(response.likes);
            setIsLiked(current => !current); // Временное переключение
            console.log(`Post ${post.postId} like processed. New count from server: ${response.likes}`);
        } catch (error: any) {
            console.error("Failed to process like:", error);
            toast.error(`Ошибка обработки лайка: ${error.message || 'Неизвестная ошибка'}`);
        } finally {
            setIsLiking(false);
        }
    };

    // --- ОБРАБОТЧИКИ ДЛЯ КОММЕНТАРИЕВ ---
    const handleCommentClick = () => {
        setShowCommentsModal(true);
    };

    const handleCloseCommentsModal = () => {
        if (isSubmittingComment) return;
        setShowCommentsModal(false);
        setCommentText('');
    };

    // --- ИСПРАВЛЕННЫЙ Обработчик отправки комментария ---
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmittingComment) {
            if (!commentText.trim()) toast.error('Комментарий не может быть пустым');
            return;
        }

        setIsSubmittingComment(true);
        const loadingToastId = toast.loading('Отправка комментария...');

        try {
            console.log(`Отправка комментария для поста ${post.postId}: ${commentText.trim()}`);

            // Вызываем API функцию addComment
            const updatedPost = await addComment(post.postId, commentText.trim());

            console.log('Comment added successfully, server response (updated post):', updatedPost);

            // Обновляем локальное состояние комментариев для немедленного отображения
            setDisplayComments(updatedPost.comments || []);

            // --- ВАЖНО: Обновление состояния в родителе ---
            // Здесь нужно вызвать callback, переданный из GeneralPage,
            // чтобы обновить общий список постов.
            // Пример: onCommentAdded(updatedPost);
            // TODO: Реализовать передачу callback 'onCommentAdded' из GeneralPage
            //       и обновление состояния 'posts' в GeneralPage.
            // ---

            toast.success('Комментарий добавлен!', { id: loadingToastId });
            setCommentText('');       // Очищаем поле
            setShowCommentsModal(false); // Закрываем модалку

        } catch (error: any) {
            console.error("Failed to submit comment:", error);
            toast.error(`Ошибка отправки комментария: ${error.message || 'Неизвестная ошибка'}`, { id: loadingToastId });
        } finally {
            setIsSubmittingComment(false); // Разблокируем форму
        }
    };


    // --- JSX РАЗМЕТКА КАРТОЧКИ ПОСТА ---
    return (
        <div className={`${styles.post} ${styles.roundedCard}`}>
            {/* Модальное окно для комментариев */}
            {showCommentsModal && (
                <div className={styles.modal_overlay} onClick={handleCloseCommentsModal}>
                    <div className={styles.comments_modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Комментарий к посту</h3>
                         {/* Отображение списка комментов ВНУТРИ МОДАЛКИ (если нужно) */}
                         {/* Обычно комменты отображаются под постом, а не в модалке отправки */}
                         {/* <div className={styles.comments_list}> ... </div> */}

                        {/* Форма для нового комментария */}
                        <form onSubmit={handleSubmitComment} className={styles.comment_form}>
                            <textarea
                                className={styles.modal_textarea}
                                placeholder="Напишите ваш комментарий..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={4}
                                required
                                disabled={isSubmittingComment}
                            />
                            <button
                                type="submit"
                                className={styles.submit_comment_button}
                                disabled={isSubmittingComment || !commentText.trim()}
                            >
                                {isSubmittingComment ? 'Отправка...' : 'Отправить'}
                            </button>
                        </form>
                        <button
                            className={styles.modal_close}
                            onClick={handleCloseCommentsModal}
                            disabled={isSubmittingComment}
                            aria-label="Закрыть"
                        >×</button>
                    </div>
                </div>
            )}

            {/* Основной контент поста */}
            <div className={styles.postMainContent}>
                {/* Шапка поста */}
                <div className={styles.postHeader}>
                    <img
                        className={styles.postUserAvatar}
                        src={post.userAvatar || '/interface/defaultAvatar.webp'}
                        alt={`${post.username || 'User'} avatar`}
                        onError={handleAvatarError}
                    />
                    <div className={styles.postUserInfo}>
                        <span className={styles.postUsername}>{post.username || 'Автор неизвестен'}</span>
                        <span className={styles.postTimestamp}>{formattedDate}</span>
                    </div>
                </div>

                {/* Контент поста */}
                <div className={styles.postContent}>
                    {post.content && <p>{post.content}</p>}
                    {post.imageUrl && (
                        <img
                            className={styles.postImage}
                            src={post.imageUrl}
                            alt="Изображение к посту"
                            onError={handleImageError}
                            loading="lazy"
                        />
                    )}
                </div>

                {/* Кнопки действий */}
                <div className={styles.postActions}>
                    <button
                        onClick={handleLikeClick}
                        className={styles.actionButton}
                        disabled={isLiking}
                        aria-pressed={isLiked}
                    >
                        <img
                           src={isLiked ? '/interface/like_ON.png' : '/interface/like_OFF.png'}
                           alt={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
                           className={styles.actionIcon}
                        />
                        <span className={styles.likesCounter}>{likesCount}</span>
                    </button>
                    <button
                        onClick={handleCommentClick}
                        className={styles.actionButton}
                        disabled={isSubmittingComment}
                    >
                        <img
                           src="/interface/commenting.png"
                           alt="Комментировать"
                           className={styles.actionIcon}
                        />
                       {/* Отображаем счетчик комментов */}
                       <span className={styles.commentsCounter}>{displayComments.length}</span>
                    </button>
                </div>
            </div>

            {/* --- ИСПРАВЛЕННЫЙ Блок отображения комментариев --- */}
            <div className={`${styles.comments} ${styles.roundedCard}`}>
                <span className={styles.comments_title}>Комментарии</span>
                <div className={styles.reviews}>
                    {/* Проверяем массив displayComments (локальное состояние) */}
                    {(!displayComments || displayComments.length === 0) ? (
                        <p className={styles.comment_placeholder}>Комментариев пока нет.</p>
                    ) : (
                        // Рендерим комментарии из displayComments
                        displayComments.map((comment) => ( // Используем comment типа Comment
                            <div key={comment.id} className={styles.review}> {/* Ключ по comment.id */}
                                <img
                                    className={styles.image_user}
                                    src={'/interface/defaultAvatar.webp'} // Пока дефолтный аватар
                                    alt={`${comment.authorUsername} avatar`}
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        e.currentTarget.src = '/interface/defaultAvatar.webp';
                                    }}
                                />
                                <div className={styles.comment_content_container}>
                                    <div className={styles.comment_header}>
                                        <span className={styles.comment_author}>
                                            {comment.authorUsername}
                                         </span>
                                        <span className={styles.comment_timestamp}>
                                            {comment.createdAt
                                                ? new Date(comment.createdAt).toLocaleString('ru-RU', {
                                                      day: 'numeric', month: 'short',
                                                      hour: '2-digit', minute: '2-digit'
                                                  })
                                                : ''}
                                        </span>
                                    </div>
                                    <p className={styles.comment}>{comment.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
// --- /КОМПОНЕНТ PostCard ---

// --- NewsCard компонент (Новый) ---
const NewsCard = ({ newsItem }: { newsItem: NewsItem }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        // Можно поставить заглушку или просто скрыть
        e.currentTarget.style.display = 'none';
    };

    return (
        <div className={`${styles.newsCard} ${styles.roundedCard}`}>
            {newsItem.images && newsItem.images.length > 0 && (
                <a href={newsItem.link || '#'} target="_blank" rel="noopener noreferrer">
                    <img
                        src={newsItem.images[0]} // Показываем первое изображение
                        alt={newsItem.title}
                        className={styles.newsImage}
                        onError={handleImageError}
                        loading="lazy" // Ленивая загрузка для изображений
                    />
                </a>
            )}
            <div className={styles.newsContent}>
                <h3>
                    <a href={newsItem.link || '#'} target="_blank" rel="noopener noreferrer" className={styles.newsTitleLink}>
                        {newsItem.title}
                    </a>
                </h3>
                {newsItem.text && <p className={styles.newsText}>{newsItem.text.substring(0, 200)}{newsItem.text.length > 200 ? '...' : ''}</p>}
                <div className={styles.newsMeta}>
                    {newsItem.category && <span className={styles.newsCategory}>{newsItem.category}</span>}
                    {newsItem.date && <span className={styles.newsDate}>{newsItem.date}</span>}
                    {newsItem.author && <span className={styles.newsAuthor}>Автор: {newsItem.author}</span>}
                    {newsItem.views && <span className={styles.newsViews}>Просмотры: {newsItem.views}</span>}
                </div>
                 {newsItem.link && <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className={styles.readMoreLink}>Читать полностью</a>}
            </div>
        </div>
    );
};
// --- /NewsCard ---

// --- GeneralPage компонент (Основной) ---
const GeneralPage = () => {
    // Состояние для постов
    const [activeSection, setActiveSection] = useState('feed'); // 'feed' или 'new' или 'collections' и т.д.
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();

    // --- Новое состояние для новостей ---
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(false); // Начинаем с false, загружаем по клику
    const [errorNews, setErrorNews] = useState<string | null>(null);
    const [newsLoaded, setNewsLoaded] = useState(false); // Флаг, чтобы не загружать повторно

    // --- Функции для постов (остаются) ---
     // Загрузка постов
     useEffect(() => {
        // Загружаем посты только если активна секция 'feed' при первой загрузке
        if (activeSection === 'feed') {
             setLoadingPosts(true);
             setErrorPosts(null);
             getPosts()
                .then(data => {
                    console.log('Fetched posts:', data);
                    // Сортируем посты по дате (от новых к старым)
                    const sortedPosts = data.sort((a, b) =>
                       (b.timestamp ? new Date(b.timestamp).getTime() : 0) -
                       (a.timestamp ? new Date(a.timestamp).getTime() : 0)
                    );
                    setPosts(sortedPosts);
                })
                .catch(err => {
                    console.error("Failed to load posts:", err);
                    const message = err.response?.data?.message || err.message || "Не удалось загрузить посты.";
                    setErrorPosts(message);
                    toast.error(`Ошибка загрузки постов: ${message}`);
                })
                .finally(() => setLoadingPosts(false));
        }
    }, [activeSection]); // Добавляем activeSection в зависимости

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Сброс инпута

        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Пожалуйста, выберите файл изображения.'); return;
            }
            const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeInBytes) {
                toast.error(`Файл слишком большой. Макс. размер: ${maxSizeInBytes / 1024 / 1024}MB`); return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviewUrl(reader.result as string);
            reader.onerror = () => toast.error("Не удалось создать превью.");
            reader.readAsDataURL(file);
        }
    };

    const clearImageSelection = useCallback(() => {
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const closeModal = useCallback(() => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        setPostText('');
        clearImageSelection();
        setIsSubmitting(false);
    }, [clearImageSelection, isSubmitting]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!postText.trim()) {
            toast.error("Текст поста не может быть пустым."); return;
        }
         if (!auth?.user) {
             toast.error("Для создания поста необходимо войти."); return;
         }

        setIsSubmitting(true);
        const toastId = toast.loading("Публикация поста...");
        const payload = { content: postText.trim(), image: imageFile ?? undefined };

        try {
            const newPost = await createPost(payload);
             // Обновляем список постов, добавляя новый в начало
             setPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) =>
                (b.timestamp ? new Date(b.timestamp).getTime() : 0) -
                (a.timestamp ? new Date(a.timestamp).getTime() : 0)
             ));
            toast.success("Пост успешно опубликован!", { id: toastId });
            closeModal();
        } catch (error: any) {
            console.error("Failed to create post:", error);
            const message = error.response?.data?.message || error.message || 'Неизвестная ошибка';
            toast.error(`Ошибка публикации: ${message}`, { id: toastId });
            setIsSubmitting(false); // Разблокируем кнопку только в случае ошибки
        }
    };
    // --- /Функции для постов ---


    // --- Функция загрузки новостей ---
    const loadNews = useCallback(async () => {
        // Не загружать, если уже загружено или идет загрузка
        if (newsLoaded || loadingNews) return;

        setLoadingNews(true);
        setErrorNews(null);
        try {
            const data = await getNews();
            setNews(data);
            setNewsLoaded(true); // Помечаем, что новости загружены
        } catch (error: any) {
            console.error("Failed to load news:", error);
            setErrorNews(error.message || "Не удалось загрузить новости.");
            toast.error(`Ошибка загрузки новостей: ${error.message}`);
        } finally {
            setLoadingNews(false);
        }
    }, [newsLoaded, loadingNews]); // Зависимости для useCallback

    // --- Эффект для загрузки новостей при смене секции ---
    useEffect(() => {
        if (activeSection === 'new') {
            loadNews();
        }
        // При переключении с секции "new", сбрасываем флаг загрузки,
        // чтобы при следующем заходе они снова загрузились (для актуальности)
        // Либо можно не сбрасывать, если не нужна авто-актуализация без перезагрузки
        // return () => {
        //     if (activeSection === 'new') {
        //         setNewsLoaded(false); // Сброс при уходе из секции
        //     }
        // };
    }, [activeSection, loadNews]); // Запускаем при изменении секции или функции loadNews

    // --- Функция рендеринга контента ---
    const renderContent = () => {
        switch (activeSection) {
            case 'feed':
                return (
                    <div className={styles.feed}>
                        {auth?.user && ( // Показываем кнопку только авторизованным
                            <button
                                className={styles.add_post_button}
                                onClick={() => setIsModalOpen(true)}
                                disabled={isSubmitting}
                            > добавить пост </button>
                        )}
                        {loadingPosts && <p>Загрузка постов...</p>}
                        {errorPosts && <p className={styles.error_message}>{errorPosts}</p>}
                        {!loadingPosts && !errorPosts && (
                            posts.length === 0 ? (
                                <p>Постов пока нет. Создайте первый!</p>
                            ) : (
                                <div className={styles.posts}>
                                    {posts.map((post) => ( <PostCard key={post.postId} post={post} /> ))}
                                </div>
                            )
                        )}
                    </div>
                );
            case 'new': // <-- Новый раздел для новостей
                return (
                    <div className={styles.newsFeed}>
                        <h2 className={styles.sectionTitle}>Новинки и новости</h2>
                        {loadingNews && <p>Загрузка новостей...</p>}
                        {errorNews && <p className={styles.error_message}>{errorNews}</p>}
                        {!loadingNews && !errorNews && (
                            news.length === 0 ? (
                                <p>Новостей пока нет.</p>
                            ) : (
                                <div className={styles.newsList}>
                                    {news.map((item) => ( <NewsCard key={item.id} newsItem={item} /> ))}
                                </div>
                            )
                        )}
                    </div>
                );
            case 'collections':
                // TODO: Реализовать отображение подборок пользователей
                return <div>Раздел "Подборки пользователей" в разработке.</div>;
            case 'rating':
                // TODO: Реализовать отображение рейтинга подборок
                return <div>Раздел "Рейтинг подборок" в разработке.</div>;
            default:
                // По умолчанию показываем ленту постов
                return <div className={styles.feed}> {/* ... скопируйте сюда контент из case 'feed' ... */} </div>;
        }
    };

    // --- JSX разметка компонента ---
    return (
        <div className={styles.container}>
            {/* Модальное окно для создания поста */}
            {isModalOpen && (
                <div className={styles.modal_overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Новая запись</h2>
                        <form className={styles.modal_form} onSubmit={handleSubmit}>
                            <textarea
                                placeholder="Напишите что-нибудь..."
                                className={styles.modal_textarea}
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                rows={5} required disabled={isSubmitting} />
                            <input
                                id="post-image-upload" ref={fileInputRef} type="file"
                                accept="image/*" className={styles.modal_file_input}
                                onChange={handleImageChange} disabled={isSubmitting} />
                            <div className={styles.image_upload_area}>
                                 <label htmlFor="post-image-upload" className={`${styles.modal_file_label} ${isSubmitting ? styles.disabled_label : ''}`}>
                                      Выбрать файл
                                 </label>
                                {imagePreviewUrl && (
                                    <div className={styles.image_preview_container}>
                                        <img src={imagePreviewUrl} alt="Предпросмотр" className={styles.image_preview} />
                                        <button type="button" onClick={clearImageSelection}
                                            className={styles.clear_image_button} disabled={isSubmitting} aria-label="Удалить">×</button>
                                    </div>
                                )}
                            </div>
                            <div className={styles.modal_buttons}>
                                <button type="submit" className={styles.modal_submit}
                                    disabled={isSubmitting || !postText.trim()}>
                                    {isSubmitting ? 'Публикация...' : 'Опубликовать'} </button>
                            </div>
                        </form>
                        <button className={styles.modal_close} onClick={closeModal}
                            aria-label="Закрыть" disabled={isSubmitting}>×</button>
                    </div>
                </div>
            )}

            {/* Верхний слайдер/постер */}
            <div className={styles.posters_slide}>
                {/* ... ваш слайдер ... */}
                 <div className={styles.movie_card}>
                     <img className={styles.movie_poster} src="/chtivo.png" alt="Криминальное чтиво" />
                     <h2 className={styles.poster_title}>Криминальное <br />чтиво</h2>
                 </div>
            </div>

            {/* Основной контент: сайдбар + область контента */}
            <div className={styles.main_content}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebar_section}>
                        <ul className={styles.sidebar_menu}>
                            {/* Используем setActiveSection для переключения */}
                            <li> <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('feed'); }}
                                className={`${styles.sidebar_titles} ${activeSection === 'feed' ? styles.active : ''}`}> Лента постов </a> </li>
                            <li> <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('new'); }}
                                className={`${styles.sidebar_titles} ${activeSection === 'new' ? styles.active : ''}`}> Новинки </a> </li> {/* <-- Наш пункт */}
                            <li> <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('collections'); }}
                                className={`${styles.sidebar_titles} ${activeSection === 'collections' ? styles.active : ''}`}> Подборки пользователей </a> </li>
                            <li> <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('rating'); }}
                                className={`${styles.sidebar_titles} ${activeSection === 'rating' ? styles.active : ''}`}> Рейтинг подборок </a> </li>
                        </ul>
                    </div>
                </aside>
                <main className={styles.content}> {/* Используем <main> для семантики */}
                    {renderContent()} {/* Функция рендерит нужную секцию */}
                </main>
            </div>
        </div>
    );
};

export default GeneralPage;