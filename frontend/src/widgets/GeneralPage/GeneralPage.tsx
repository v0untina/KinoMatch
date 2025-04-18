// frontend/src/widgets/GeneralPage/GeneralPage.tsx
"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth';
// Импорты для постов
import { Post, Comment, getPosts, createPost, likePost, addComment } from '@/api/posts';
// Импорты для новостей
import { getNews, NewsItem } from '@/api/news';
// --- Импорт для опубликованных подборок ---
// Добавляем isLikedByCurrentUser (пока опционально, API его еще не шлет)
import { getPublishedCompilations, type UserCompilationSummary as BaseUserCompilationSummary } from '@/api/compilations';
// --- Импорты для уведомлений и навигации ---
import toast from 'react-hot-toast';
import Link from 'next/link'; // Для ссылок
import Image from 'next/image'; // Для компонента Image

// --- Расширяем интерфейс подборки для фронтенда ---
interface UserCompilationSummary extends BaseUserCompilationSummary {
    isLikedByCurrentUser?: boolean; // Добавляем поле для статуса лайка
}

// --- PostCard компонент ---
// (Код PostCard остается БЕЗ ИЗМЕНЕНИЙ, как в твоем примере)
const PostCard = ({ post }: { post: Post }) => {
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false); // Используем поле из Post
    const [likesCount, setLikesCount] = useState(post.likes ?? 0);
    const [isLiking, setIsLiking] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [displayComments, setDisplayComments] = useState<Comment[]>(post.comments || []);

    // Обновляем isLiked при изменении post.isLikedByCurrentUser извне (если посты перезагружаются)
    useEffect(() => {
        setIsLiked(post.isLikedByCurrentUser ?? false);
        setLikesCount(post.likes ?? 0);
        setDisplayComments(post.comments || []);
    }, [post.isLikedByCurrentUser, post.likes, post.comments]);


    const formattedDate = post.timestamp ? new Date(post.timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Дата не указана';
    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = '/interface/defaultAvatar.webp'; };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; };

    const handleLikeClick = async () => {
        if (isLiking) return;
        setIsLiking(true);
        console.log(`[Like Button Click] Sending like/unlike request for post: ${post.postId}`);
        try {
            // Предполагаем, что auth есть в контексте, или likePost проверяет это
            const response = await likePost(post.postId);
            console.log(`[Like API Response] Post ${post.postId}:`, response);
            // Обновляем локальное состояние немедленно, т.к. API вернуло новое состояние
            setLikesCount(response.likes);
            setIsLiked(response.isLikedByCurrentUser);
            console.log(`[Like State Update] Post ${post.postId}. New count: ${response.likes}, Is liked by user: ${response.isLikedByCurrentUser}`);
            // Не нужно обновлять родителя, т.к. likePost уже сходил на сервер
        } catch (error: any) {
            console.error(`[Like Error] Failed to process like/unlike for post ${post.postId}:`, error);
            toast.error(`Ошибка обработки лайка: ${error.message || 'Неизвестная ошибка'}`);
            // Опционально: откатить состояние, если нужно, но обычно лучше оставить как есть
        } finally {
            setIsLiking(false);
        }
    };


    const handleCommentClick = () => setShowCommentsModal(true);
    const handleCloseCommentsModal = () => { if (!isSubmittingComment) { setShowCommentsModal(false); setCommentText(''); }};
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmittingComment) return;
        setIsSubmittingComment(true);
        const loadingToastId = toast.loading('Отправка комментария...');
        try {
            const updatedPost = await addComment(post.postId, commentText.trim());
            setDisplayComments(updatedPost.comments || []); // Обновляем комменты
            toast.success('Комментарий добавлен!', { id: loadingToastId });
            setCommentText('');
            setShowCommentsModal(false); // Закрываем модалку после успеха
        } catch (error: any) {
            toast.error(`Ошибка отправки комментария: ${error.message || 'Неизвестная ошибка'}`, { id: loadingToastId });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <div className={`${styles.post} ${styles.roundedCard}`}>
            {/* Модалка комментариев */}
            {showCommentsModal && (
                <div className={styles.modal_overlay} onClick={handleCloseCommentsModal}>
                    <div className={styles.comments_modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Комментарий к посту</h3>
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
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            {/* Основной контент поста */}
            <div className={styles.postMainContent}>
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
                <div className={styles.postActions}>
                    <button
                        onClick={handleLikeClick}
                        className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
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
                        disabled={isSubmittingComment} // Можно оставить блокировку на время отправки коммента
                    >
                        <img
                            src="/interface/commenting.png"
                            alt="Комментировать"
                            className={styles.actionIcon}
                        />
                        <span className={styles.commentsCounter}>{displayComments.length}</span>
                    </button>
                    {/* Можно добавить другие кнопки, например, "Поделиться" */}
                </div>
            </div>
            {/* Блок комментариев */}
            <div className={`${styles.comments} ${styles.roundedCard}`}>
                <span className={styles.comments_title}>Комментарии</span>
                <div className={styles.reviews}>
                    {(!displayComments || displayComments.length === 0) ? (
                        <p className={styles.comment_placeholder}>Комментариев пока нет.</p>
                    ) : (
                        displayComments.map((comment) => (
                            <div key={comment.id} className={styles.review}>
                                <img
                                    className={styles.image_user} // Возможно, лучше назвать comment_user_avatar
                                    src={'/interface/defaultAvatar.webp'} // TODO: Загружать аватар комментатора
                                    alt={`${comment.authorUsername} avatar`}
                                    onError={handleAvatarError}
                                />
                                <div className={styles.comment_content_container}>
                                    <div className={styles.comment_header}>
                                        <span className={styles.comment_author}>{comment.authorUsername}</span>
                                        <span className={styles.comment_timestamp}>
                                            {comment.createdAt
                                                ? new Date(comment.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
// --- /PostCard компонент ---


// --- NewsCard компонент ---
// (Код NewsCard остается БЕЗ ИЗМЕНЕНИЙ)
const NewsCard = ({ newsItem }: { newsItem: NewsItem }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; };
    return (
        <div className={`${styles.newsCard} ${styles.roundedCard}`}>
            {newsItem.images && newsItem.images.length > 0 && (
                <a href={newsItem.link || '#'} target="_blank" rel="noopener noreferrer">
                    <img
                        src={newsItem.images[0]}
                        alt={newsItem.title}
                        className={styles.newsImage}
                        onError={handleImageError}
                        loading="lazy"
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
                    <div className={styles.newsCategory}>{newsItem.category || 'Без категории'}</div>
                    {newsItem.date && <span className={styles.newsDate}>{newsItem.date}</span>}
                    {newsItem.author && <span className={styles.newsAuthor}>Автор: {newsItem.author}</span>}
                    {newsItem.views && <span className={styles.newsViews}>Просмотры: {newsItem.views}</span>}
                </div>
                {newsItem.link && <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className={styles.readMoreLink}>Читать полностью...</a>}
            </div>
        </div>
    );
};
// --- /NewsCard компонент ---

// --- КОМПОНЕНТ КАРТОЧКИ ОПУБЛИКОВАННОЙ ПОДБОРКИ (ИЗМЕНЕН) ---
interface PublishedCompilationCardProps {
    compilation: UserCompilationSummary;
    // Добавляем пропсы для лайка
    onLikeToggle: (id: number, currentState: boolean) => void; // Функция-обработчик
    isLiking: boolean; // Флаг блокировки кнопки во время запроса
    isAuthenticated: boolean; // Знает ли компонент, что пользователь вошел
}

const PublishedCompilationCard: React.FC<PublishedCompilationCardProps> = ({
    compilation,
    onLikeToggle,
    isLiking,
    isAuthenticated
}) => {
    const PUBLIC_POSTER_PATH = '/posters/';
    const PLACEHOLDER_POSTER = `${PUBLIC_POSTER_PATH}placeholder.jpg`;
    const getPosterUrl = (filename: string | null): string => { if (!filename) return PLACEHOLDER_POSTER; return `${PUBLIC_POSTER_PATH}${filename}`; };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = PLACEHOLDER_POSTER; };
    function getMovieDeclension(count: number): string { const cases = [2, 0, 1, 1, 1, 2]; const titles = ['фильм', 'фильма', 'фильмов']; return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]]; };

    // Получаем текущее состояние лайка из пропса compilation
    const isLiked = compilation.isLikedByCurrentUser ?? false;

    // Обработчик клика на кнопку лайка
    const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // Предотвращаем переход по ссылке, если кнопка внутри Link
        e.stopPropagation(); // Останавливаем всплытие события
        if (!isAuthenticated) {
            toast.error("Нужно войти, чтобы лайкать подборки");
            return;
        }
        onLikeToggle(compilation.id, isLiked); // Вызываем колбэк родителя
    };

    return (
        // Оборачиваем всю карточку в div, чтобы кнопка была частью карточки, но не ссылки
        <div className={styles.userCompilationCardWrapper}>
            <Link href={`/compilations/${compilation.id}`} className={styles.userCompilationCardLink} title={`Подборка "${compilation.title}"`}>
                <div className={styles.userCompilationPosters}>
                    {compilation.previewPosters.slice(0, 4).map((poster, index) => (
                        <div key={index} className={styles.userCompilationPosterWrapper}>
                            <Image
                                src={getPosterUrl(poster)}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 25vw, 100px"
                                style={{ objectFit: 'cover' }}
                                className={styles.userCompilationPoster}
                                onError={handleImageError}
                                unoptimized // Если постеры не оптимизированы Next.js
                            />
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - compilation.previewPosters.length) }).map((_, index) => (
                        <div key={`placeholder-${index}`} className={`${styles.userCompilationPosterWrapper} ${styles.placeholder}`}></div>
                    ))}
                </div>
                <div className={styles.userCompilationInfo}>
                    <h3 className={styles.userCompilationTitle}>{compilation.title}</h3>
                    <div className={styles.userCompilationMeta}>
                        <span>{compilation.movieCount} {getMovieDeclension(compilation.movieCount)}</span>
                        {compilation.author && (
                            <span className={styles.compilationAuthor}> от {compilation.author.username}</span>
                        )}
                    </div>
                </div>
            </Link>
             {/* --- Блок с кнопкой лайка --- */}
             <div className={styles.compilationActions}>
                 <button
                    onClick={handleLikeClick}
                    className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} // Используем те же стили, что и у постов
                    disabled={isLiking || !isAuthenticated} // Блокируем при запросе или если не авторизован
                    aria-pressed={isLiked}
                    aria-label={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
                 >
                     <img
                        src={isLiked ? '/interface/like_ON.png' : '/interface/like_OFF.png'}
                        alt={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
                        className={styles.actionIcon} // Тот же стиль иконки
                     />
                     {/* Можно добавить счетчик лайков, если API будет его возвращать */}
                     {/* <span className={styles.likesCounter}>{compilation.likesCount ?? 0}</span> */}
                 </button>
                 {/* Можно добавить другие кнопки, например, "Поделиться" */}
            </div>
        </div>
    );
};
// --- Конец PublishedCompilationCard ---


// --- GeneralPage компонент (основной) ---
const GeneralPage = () => {
    // Состояния для секций, модалки, постов, новостей
    const [activeSection, setActiveSection] = useState('collections'); // Начинаем с подборок
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [errorNews, setErrorNews] = useState<string | null>(null);
    const [newsLoaded, setNewsLoaded] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);

    // Состояния для слайдера
    const [currentSlide, setCurrentSlide] = useState(0);
    const posters = [ /* ... данные постеров ... */
        { id: 1, image: "/mstiteli.jpg", title: "Мстители Финал", alt: "" }, { id: 2, image: "/thor.jpeg", title: "ТОР", alt: "рот" }, { id: 3, image: "/starwars.jpg", title: "Звёздные войны", alt: "" }, { id: 4, image: "/xzcheeto.jpeg", title: "Бесславные ублюдки", alt: "" }, { id: 5, image: "/venom.jpg", title: "ВЕНОМ", alt: "" }
    ];
    const auth = useAuth(); // Получаем контекст аутентификации

    // Состояния для опубликованных подборок
    const [publishedCompilations, setPublishedCompilations] = useState<UserCompilationSummary[]>([]); // Используем расширенный тип
    const [isLoadingPublished, setIsLoadingPublished] = useState(false);
    const [errorPublished, setErrorPublished] = useState<string | null>(null);
    const [publishedLoaded, setPublishedLoaded] = useState(false);
    // --- Состояние для отслеживания процесса лайка подборки ---
    const [likingCompilationId, setLikingCompilationId] = useState<number | null>(null);


    // --- Эффекты ---
    // Эффект для слайдера
    useEffect(() => {
        const interval = setInterval(() => { setCurrentSlide(prev => (prev + 1) % posters.length); }, 6000);
        return () => clearInterval(interval);
    }, [posters.length]);

    // Эффект для загрузки постов
    useEffect(() => {
        if (activeSection === 'feed') {
            setLoadingPosts(true); setErrorPosts(null);
            getPosts()
                .then(data => {
                    // Сортировка и установка постов
                    const sortedPosts = data.sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));
                    setPosts(sortedPosts);
                })
                .catch(err => { console.error("Failed to load posts:", err); const message = err.response?.data?.message || err.message || "Не удалось загрузить посты."; setErrorPosts(message); toast.error(`Ошибка загрузки постов: ${message}`); })
                .finally(() => setLoadingPosts(false));
        }
    }, [activeSection]); // Зависимость только от activeSection

    // Функция загрузки новостей
    const loadNews = useCallback(async () => {
        if (newsLoaded || loadingNews) return; setLoadingNews(true); setErrorNews(null);
        try {
            const data = await getNews(); setNews(data); setFilteredNews(data); const uniqueCategories = [...new Set(data.map(item => item.category || 'Без категории'))].sort(); setCategories(['all', ...uniqueCategories]); setNewsLoaded(true);
        } catch (error: any) { console.error("Failed to load news:", error); setErrorNews(error.message || "Не удалось загрузить новости."); toast.error(`Ошибка загрузки новостей: ${error.message}`); }
        finally { setLoadingNews(false); }
    }, [newsLoaded, loadingNews]);

    // Эффект для фильтрации новостей
    useEffect(() => {
        if (activeCategory === 'all') { setFilteredNews(news); }
        else { setFilteredNews(news.filter(item => item.category === activeCategory || (!item.category && activeCategory === 'Без категории'))); }
    }, [activeCategory, news]);

    // Эффект для загрузки новостей при активации секции
    useEffect(() => { if (activeSection === 'news') { loadNews(); } }, [activeSection, loadNews]);

    // Эффект для загрузки опубликованных подборок
    const loadPublishedCompilations = useCallback(async () => {
        // Сбрасываем флаг загрузки при вызове, чтобы можно было перезагрузить
        setPublishedLoaded(false);
        setIsLoadingPublished(true);
        setErrorPublished(null);
        console.log("Fetching published compilations for GeneralPage...");
        try {
            // !!! ВАЖНО: getPublishedCompilations пока НЕ возвращает isLikedByCurrentUser
            // Это поле будет добавлено, когда бэкенд будет обновлен.
            // Пока что isLikedByCurrentUser будет undefined -> false
            const response = await getPublishedCompilations(20, 0);
             // Приводим тип к нашему расширенному интерфейсу
            setPublishedCompilations(response.data as UserCompilationSummary[]);
            setPublishedLoaded(true);
            console.log("Published compilations fetched:", response.data);
        } catch (error: any) {
            console.error("Failed to load published compilations:", error);
            const message = error.message || "Не удалось загрузить подборки.";
            setErrorPublished(message);
            toast.error(`Ошибка загрузки подборок: ${message}`);
        } finally {
            setIsLoadingPublished(false);
        }
    }, []); // Убираем зависимости publishedLoaded, isLoadingPublished, чтобы можно было вызвать повторно

    useEffect(() => {
        if (activeSection === 'collections') {
            // Загружаем только если еще не загружено или если активна секция
             if (!publishedLoaded) {
                loadPublishedCompilations();
             }
        }
    }, [activeSection, publishedLoaded, loadPublishedCompilations]);

     // Перезагрузка подборок при смене статуса аутентификации (чтобы обновить лайки)
    useEffect(() => {
        if (activeSection === 'collections' && auth?.user !== undefined) { // Проверяем, что статус аутентификации известен
           console.log("Auth status changed, reloading compilations for potential like status update.");
           loadPublishedCompilations();
        }
    }, [auth?.user, activeSection, loadPublishedCompilations]);


    // --- Функции обработчики ---
    // Обработчик изменения изображения для поста
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; setImageFile(null); setImagePreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = "";
        if (file) { if (!file.type.startsWith('image/')) { toast.error('Выберите файл изображения.'); return; } const maxSizeInBytes = 5 * 1024 * 1024; if (file.size > maxSizeInBytes) { toast.error(`Файл большой. Макс. размер: ${maxSizeInBytes / 1024 / 1024}MB`); return; } setImageFile(file); const reader = new FileReader(); reader.onloadend = () => setImagePreviewUrl(reader.result as string); reader.onerror = () => toast.error("Не удалось создать превью."); reader.readAsDataURL(file); }
    };
    // Очистка выбранного изображения
    const clearImageSelection = useCallback(() => { setImageFile(null); setImagePreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }, []);
    // Закрытие модального окна создания поста
    const closeModal = useCallback(() => { if (isSubmitting) return; setIsModalOpen(false); setPostText(''); clearImageSelection(); setIsSubmitting(false); }, [clearImageSelection, isSubmitting]);
    // Отправка нового поста
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); if (!postText.trim()) { toast.error("Текст поста пустой."); return; } if (!auth?.user) { toast.error("Нужно войти."); return; }
        setIsSubmitting(true); const toastId = toast.loading("Публикация..."); const payload = { content: postText.trim(), image: imageFile ?? undefined };
        try {
            const newPost = await createPost(payload); setPosts(prevPosts => { const updatedPosts = [newPost, ...prevPosts]; return updatedPosts.sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0)); }); toast.success("Пост опубликован!", { id: toastId }); closeModal();
        } catch (error: any) { console.error("Failed to create post:", error); const message = error.response?.data?.message || error.message || 'Ошибка'; toast.error(`Ошибка публикации: ${message}`, { id: toastId }); setIsSubmitting(false); }
    };

    // --- Обработчик лайка/анлайка для ПОДБОРКИ ---
    const handleCompilationLikeToggle = useCallback(async (collectionId: number, currentState: boolean) => {
        if (likingCompilationId) return; // Предотвращаем двойные клики
        if (!auth?.user) { toast.error("Нужно войти"); return; }

        setLikingCompilationId(collectionId); // Блокируем кнопку для этой подборки

        // Оптимистичное обновление UI
        setPublishedCompilations(prev => prev.map(comp =>
            comp.id === collectionId ? { ...comp, isLikedByCurrentUser: !currentState } : comp
        ));

        try {
            // !!! ВАЖНО: Эти функции еще не созданы в api/compilations.ts !!!
            // await (currentState ? unlikeCompilation(collectionId) : likeCompilation(collectionId));
            console.log(`TODO: Call API to ${currentState ? 'unlike' : 'like'} compilation ${collectionId}`);
            // Имитация задержки сети
            await new Promise(resolve => setTimeout(resolve, 500));
            // Пока что просто выводим сообщение об успехе (ЗАМЕНИТЬ НА РЕАЛЬНЫЙ ВЫЗОВ API)
            toast.success(currentState ? "Лайк убран (симуляция)" : "Подборка добавлена в избранное! (симуляция)");

            // После успешного ответа API (когда он будет), можно обновить данные, если API возвращает новое состояние
            // Например:
            // const updatedCompilationData = await getCompilationById(collectionId); // или получить обновленный список
            // setPublishedCompilations(prev => prev.map(comp =>
            //     comp.id === collectionId ? { ...comp, ...updatedCompilationData, isLikedByCurrentUser: !currentState } : comp
            // ));

        } catch (error: any) {
            console.error(`Error ${currentState ? 'unliking' : 'liking'} compilation ${collectionId}:`, error);
            toast.error(`Ошибка: ${error.message || 'Не удалось обновить лайк'}`);
            // Откат оптимистичного обновления в случае ошибки
            setPublishedCompilations(prev => prev.map(comp =>
                comp.id === collectionId ? { ...comp, isLikedByCurrentUser: currentState } : comp // Возвращаем старое состояние
            ));
        } finally {
            setLikingCompilationId(null); // Разблокируем кнопку
        }
    }, [auth?.user, likingCompilationId]); // Зависим от auth и likingCompilationId

    // Функция рендеринга контента активной секции
    const renderContent = () => {
        switch (activeSection) {
            case 'feed':
                return ( <div className={styles.feed}>{auth?.user && (<button className={styles.add_post_button} onClick={() => setIsModalOpen(true)} disabled={isSubmitting}> добавить пост </button>)} {loadingPosts && <p>Загрузка постов...</p>} {errorPosts && <p className={styles.error_message}>{errorPosts}</p>} {!loadingPosts && !errorPosts && (posts.length === 0 ? (<p>Постов пока нет.</p>) : (<div className={styles.posts}>{posts.map((post) => ( <PostCard key={post.postId} post={post} />))}</div>))}</div> );
            case 'news':
                 return ( <div className={styles.newsFeed}><div className={styles.newsFilters}>{categories.map(category => (<button key={category} className={`${styles.newsFilterButton} ${activeCategory === category ? styles.activeFilter : ''}`} onClick={() => setActiveCategory(category)}>{category === 'all' ? 'Все категории' : category}</button>))}</div> {loadingNews && <p>Загрузка новостей...</p>} {errorNews && <p className={styles.error_message}>{errorNews}</p>} {!loadingNews && !errorNews && (filteredNews.length === 0 ? (<p>Новостей нет.</p>) : (<div className={styles.newsList}>{filteredNews.map((item) => <NewsCard key={item.id} newsItem={item} />)}</div>))}</div> );
            case 'collections':
                return (
                    <div className={styles.publishedCompilationsSection}>
                        <h2>Подборки пользователей</h2>
                        {isLoadingPublished && <p>Загрузка подборок...</p>}
                        {errorPublished && <p className={styles.error_message}>{errorPublished}</p>}
                        {!isLoadingPublished && !errorPublished && (
                            publishedCompilations.length === 0 ? (<p>Опубликованных подборок пока нет.</p>) : (
                                <div className={styles.userCompilationsGrid}>
                                    {publishedCompilations.map((comp) => (
                                        <PublishedCompilationCard
                                            key={comp.id}
                                            compilation={comp}
                                            // Передаем обработчик лайка и статус загрузки/авторизации
                                            onLikeToggle={handleCompilationLikeToggle}
                                            isLiking={likingCompilationId === comp.id}
                                            isAuthenticated={!!auth?.user} // Передаем true/false
                                        />
                                    ))}
                                </div>
                            )
                         )}
                     </div>
                );
            case 'rating': return <div>Раздел "Рейтинг подборок" в разработке.</div>;
            default: return <div className={styles.feed}></div>; // По умолчанию лента
        }
    };

    // --- JSX разметка GeneralPage ---
    return (
        <div className={styles.container}>
            {/* Модальное окно создания поста */}
            {isModalOpen && ( <div className={styles.modal_overlay} onClick={closeModal}><div className={styles.modal} onClick={(e) => e.stopPropagation()}><h2>Новая запись</h2><form className={styles.modal_form} onSubmit={handleSubmit}><textarea placeholder="Напишите что-нибудь..." className={styles.modal_textarea} value={postText} onChange={(e) => setPostText(e.target.value)} rows={5} required disabled={isSubmitting} /><input id="post-image-upload" ref={fileInputRef} type="file" accept="image/*" className={styles.modal_file_input} onChange={handleImageChange} disabled={isSubmitting} /><div className={styles.image_upload_area}><label htmlFor="post-image-upload" className={`${styles.modal_file_label} ${isSubmitting ? styles.disabled_label : ''}`}>Выбрать файл</label>{imagePreviewUrl && (<div className={styles.image_preview_container}><img src={imagePreviewUrl} alt="Предпросмотр" className={styles.image_preview} /><button type="button" onClick={clearImageSelection} className={styles.clear_image_button} disabled={isSubmitting} aria-label="Удалить">×</button></div>)}</div><div className={styles.modal_buttons}><button type="submit" className={styles.modal_submit} disabled={isSubmitting || !postText.trim()}>{isSubmitting ? 'Публикация...' : 'Опубликовать'}</button></div></form><button className={styles.modal_close} onClick={closeModal} aria-label="Закрыть" disabled={isSubmitting}>×</button></div></div>)}
            {/* Слайдер */}
            <div className={styles.posters_slide}><div className={styles.slider_wrapper}><div className={styles.slider_track} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>{posters.map((poster) => (<div key={poster.id} className={styles.movie_card}><img className={styles.movie_poster} src={poster.image} alt={poster.alt}/><h2 className={styles.poster_title}>{poster.title.split(' ').map((word, i) => ( <React.Fragment key={i}>{word}{i < poster.title.split(' ').length - 1 && <br />}</React.Fragment> ))}</h2></div>))}</div></div><div className={styles.slider_indicators}>{posters.map((_, index) => (<button key={index} className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`} onClick={() => setCurrentSlide(index)} aria-label={`Перейти к слайду ${index + 1}`}/>))}</div></div>
            {/* Основной контент */}
            <div className={styles.main_content}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebar_section}>
                        <ul className={styles.sidebar_menu}>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('feed'); }} className={`${styles.sidebar_titles} ${activeSection === 'feed' ? styles.active : ''}`}>Лента постов</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('news'); }} className={`${styles.sidebar_titles} ${activeSection === 'news' ? styles.active : ''}`}>Новости</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('collections'); }} className={`${styles.sidebar_titles} ${activeSection === 'collections' ? styles.active : ''}`}>Подборки пользователей</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('rating'); }} className={`${styles.sidebar_titles} ${activeSection === 'rating' ? styles.active : ''}`}>Рейтинг подборок</a></li>
                        </ul>
                    </div>
                </aside>
                <main className={styles.content}>
                    {renderContent()} {/* Вызов функции рендеринга */}
                </main>
            </div>
        </div>
    );
};

export default GeneralPage;