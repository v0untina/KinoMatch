"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth';
// Убедитесь, что импортируете обновленную функцию likePost и интерфейсы
import { Post, Comment, getPosts, createPost, likePost, addComment } from '@/api/posts';
import { getNews, NewsItem } from '@/api/news';
import toast from 'react-hot-toast';

// --- PostCard компонент ---
const PostCard = ({ post }: { post: Post }) => {
    // Состояния для лайков
    // TODO: Идеально, если начальное состояние isLiked будет передано как проп
    //       из GeneralPage, основанное на данных с сервера при загрузке постов.
    //       Например: const PostCard = ({ post, isInitiallyLiked }: { post: Post, isInitiallyLiked: boolean }) => { ... }
    //       и useState(isInitiallyLiked)
    const [isLiked, setIsLiked] = useState(false); // Пока оставляем false по умолчанию
    const [likesCount, setLikesCount] = useState(post.likes ?? 0);
    const [isLiking, setIsLiking] = useState(false);

    // Состояния для комментариев (без изменений)
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [displayComments, setDisplayComments] = useState<Comment[]>(post.comments || []);

    // Форматирование даты (без изменений)
    const formattedDate = post.timestamp
        ? new Date(post.timestamp).toLocaleString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
          })
        : 'Дата не указана';

    // Обработчики ошибок изображений (без изменений)
    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = '/interface/defaultAvatar.webp';
    };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
    };

    // --- ИСПРАВЛЕННЫЙ Обработчик лайка ---
    const handleLikeClick = async () => {
        if (isLiking) return;
        setIsLiking(true);
        console.log(`[Like Button Click] Sending like/unlike request for post: ${post.postId}`);
        try {
            // Вызываем API, ожидая ответ { postId, likes, isLikedByCurrentUser }
            const response = await likePost(post.postId);
            console.log(`[Like API Response] Post ${post.postId}:`, response);

            // Обновляем состояние СТРОГО по ответу сервера
            setLikesCount(response.likes);
            setIsLiked(response.isLikedByCurrentUser); // Устанавливаем isLiked из ответа

            console.log(`[Like State Update] Post ${post.postId}. New count: ${response.likes}, Is liked by user: ${response.isLikedByCurrentUser}`);

        } catch (error: any) {
            console.error(`[Like Error] Failed to process like/unlike for post ${post.postId}:`, error);
            // Не откатываем состояние, так как оно было обновлено только после успешного ответа
            // или не обновлялось вовсе при ошибке.
            toast.error(`Ошибка обработки лайка: ${error.message || 'Неизвестная ошибка'}`);
        } finally {
            setIsLiking(false); // Снимаем блокировку кнопки
        }
    };
    // --- /ИСПРАВЛЕННЫЙ Обработчик лайка ---

    // Обработчики комментариев (без изменений)
    const handleCommentClick = () => setShowCommentsModal(true);
    const handleCloseCommentsModal = () => {
        if (isSubmittingComment) return;
        setShowCommentsModal(false);
        setCommentText('');
    };
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        const loadingToastId = toast.loading('Отправка комментария...');

        try {
            // TODO: Передать callback из GeneralPage для обновления основного списка постов
            const updatedPost = await addComment(post.postId, commentText.trim());
            setDisplayComments(updatedPost.comments || []); // Обновляем только локально
            toast.success('Комментарий добавлен!', { id: loadingToastId });
            setCommentText('');
            setShowCommentsModal(false);
        } catch (error: any) {
            toast.error(`Ошибка отправки комментария: ${error.message || 'Неизвестная ошибка'}`, { id: loadingToastId });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // --- JSX разметка PostCard ---
    return (
        <div className={`${styles.post} ${styles.roundedCard}`}>
            {/* Модалка комментариев (без изменений) */}
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
                        >×</button>
                    </div>
                </div>
            )}

            {/* Основной контент поста (без изменений) */}
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

                {/* Действия поста (кнопка лайка использует обновленное состояние) */}
                <div className={styles.postActions}>
                    <button
                        onClick={handleLikeClick}
                        // Добавляем класс liked для стилизации, если isLiked === true
                        className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
                        disabled={isLiking}
                        aria-pressed={isLiked} // aria-pressed теперь отражает состояние с сервера
                    >
                        <img
                           // Иконка зависит от isLiked, которое обновляется с сервера
                           src={isLiked ? '/interface/like_ON.png' : '/interface/like_OFF.png'}
                           alt={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
                           className={styles.actionIcon}
                        />
                        {/* Счетчик лайков обновляется с сервера */}
                        <span className={styles.likesCounter}>{likesCount}</span>
                    </button>
                    {/* Кнопка комментариев (без изменений) */}
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
                       <span className={styles.commentsCounter}>{displayComments.length}</span>
                    </button>
                </div>
            </div>

            {/* Блок комментариев (без изменений) */}
            <div className={`${styles.comments} ${styles.roundedCard}`}>
                <span className={styles.comments_title}>Комментарии</span>
                <div className={styles.reviews}>
                    {(!displayComments || displayComments.length === 0) ? (
                        <p className={styles.comment_placeholder}>Комментариев пока нет.</p>
                    ) : (
                        displayComments.map((comment) => (
                            <div key={comment.id} className={styles.review}>
                                <img
                                    className={styles.image_user}
                                    src={'/interface/defaultAvatar.webp'} // Пока статика
                                    alt={`${comment.authorUsername} avatar`}
                                    onError={handleAvatarError} // Используем тот же обработчик
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
// --- /PostCard компонент ---


// --- NewsCard компонент (без изменений) ---
const NewsCard = ({ newsItem }: { newsItem: NewsItem }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
    };

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
                <div className={styles.newsCategory}>
                    {newsItem.category || 'Без категории'}
                </div>
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


// --- GeneralPage компонент (основной) ---
const GeneralPage = () => {
    // Состояния (без изменений, кроме лайков в PostCard)
    const [activeSection, setActiveSection] = useState('feed');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const posters = [ /* ... данные постеров ... */
        { id: 1, image: "/mstiteli.jpg", title: "Мстители Финал", alt: "" },
        { id: 2, image: "/thor.jpeg", title: "ТОР", alt: "рот" },
        { id: 3, image: "/starwars.jpg", title: "Звёздные войны", alt: "" },
        { id: 4, image: "/xzcheeto.jpeg", title: "Бесславные ублюдки", alt: "" },
        { id: 5, image: "/venom.jpg", title: "ВЕНОМ", alt: "" }
    ];
    const auth = useAuth();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [errorNews, setErrorNews] = useState<string | null>(null);
    const [newsLoaded, setNewsLoaded] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);


    // Эффекты и функции (без изменений, кроме лайков в PostCard)
    useEffect(() => { // Слайдер
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % posters.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [posters.length]);

    useEffect(() => { // Загрузка постов
        if (activeSection === 'feed') {
            setLoadingPosts(true);
            setErrorPosts(null);
            getPosts()
                .then(data => {
                    // TODO: Здесь бэкенд должен также возвращать информацию о том,
                    // лайкнул ли ТЕКУЩИЙ пользователь каждый пост (e.g., post.isLikedByCurrentUser)
                    // и передать это в PostCard как проп isInitiallyLiked.
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
    }, [activeSection]);

    const loadNews = useCallback(async () => { // Загрузка новостей
        if (newsLoaded || loadingNews) return;
        setLoadingNews(true);
        setErrorNews(null);
        try {
            const data = await getNews();
            setNews(data);
            setFilteredNews(data);
            const uniqueCategories = [...new Set(data.map(item => item.category || 'Без категории'))].sort();
            setCategories(['all', ...uniqueCategories]);
            setNewsLoaded(true);
        } catch (error: any) {
            console.error("Failed to load news:", error);
            setErrorNews(error.message || "Не удалось загрузить новости.");
            toast.error(`Ошибка загрузки новостей: ${error.message}`);
        } finally {
            setLoadingNews(false);
        }
    }, [newsLoaded, loadingNews]);

    useEffect(() => { // Фильтрация новостей
        if (activeCategory === 'all') {
            setFilteredNews(news);
        } else {
            setFilteredNews(news.filter(item =>
                item.category === activeCategory ||
                (!item.category && activeCategory === 'Без категории')
            ));
        }
    }, [activeCategory, news]);

    useEffect(() => { // Загрузка новостей при смене секции
        if (activeSection === 'news') {
            loadNews();
        }
    }, [activeSection, loadNews]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { // Обработка изображения
        const file = event.target.files?.[0];
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Пожалуйста, выберите файл изображения.'); return;
            }
            const maxSizeInBytes = 5 * 1024 * 1024;
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

    const clearImageSelection = useCallback(() => { // Очистка изображения
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const closeModal = useCallback(() => { // Закрытие модалки
        if (isSubmitting) return;
        setIsModalOpen(false);
        setPostText('');
        clearImageSelection();
        setIsSubmitting(false);
    }, [clearImageSelection, isSubmitting]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Отправка поста
        e.preventDefault();
        if (!postText.trim()) { toast.error("Текст поста не может быть пустым."); return; }
        if (!auth?.user) { toast.error("Для создания поста необходимо войти."); return; }

        setIsSubmitting(true);
        const toastId = toast.loading("Публикация поста...");
        const payload = { content: postText.trim(), image: imageFile ?? undefined };

        try {
            const newPost = await createPost(payload);
            setPosts(prevPosts => {
                const updatedPosts = [newPost, ...prevPosts];
                return updatedPosts.sort((a, b) => {
                    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return timeB - timeA;
                });
            });
            toast.success("Пост успешно опубликован!", { id: toastId });
            closeModal();
        } catch (error: any) {
            console.error("Failed to create post:", error);
            const message = error.response?.data?.message || error.message || 'Неизвестная ошибка';
            toast.error(`Ошибка публикации: ${message}`, { id: toastId });
            setIsSubmitting(false);
        }
    };

    const renderContent = () => { // Рендеринг контента секций
        switch (activeSection) {
            case 'feed':
                return (
                    <div className={styles.feed}>
                        {auth?.user && (
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
                                    {/* Передаем post в PostCard */}
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post.postId}
                                            post={post}
                                            // TODO: Передать начальное состояние лайка:
                                            // isInitiallyLiked={post.isLikedByCurrentUser ?? false}
                                         />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                );
            case 'news':
                return (
                    <div className={styles.newsFeed}>
                         <div className={styles.newsFilters}>
                             {categories.map(category => (
                                 <button
                                     key={category}
                                     className={`${styles.newsFilterButton} ${activeCategory === category ? styles.activeFilter : ''}`}
                                     onClick={() => setActiveCategory(category)}
                                 >
                                     {category === 'all' ? 'Все категории' : category}
                                 </button>
                             ))}
                         </div>

                         {loadingNews && <p>Загрузка новостей...</p>}
                         {errorNews && <p className={styles.error_message}>{errorNews}</p>}
                         {!loadingNews && !errorNews && (
                             filteredNews.length === 0 ? (
                                 <p>Новостей в выбранной категории пока нет.</p>
                             ) : (
                                 <div className={styles.newsList}>
                                     {filteredNews.map((item) => <NewsCard key={item.id} newsItem={item} />)}
                                 </div>
                             )
                         )}
                     </div>
                );
            case 'collections': return <div>Раздел "Подборки пользователей" в разработке.</div>;
            case 'rating': return <div>Раздел "Рейтинг подборок" в разработке.</div>;
            default: return <div className={styles.feed}></div>;
        }
    };

    // --- JSX разметка GeneralPage ---
    return (
        <div className={styles.container}>
            {/* Модалка создания поста (без изменений) */}
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

            {/* Слайдер (без изменений) */}
            <div className={styles.posters_slide}>
                <div className={styles.slider_wrapper}>
                    <div
                        className={styles.slider_track}
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {posters.map((poster) => (
                            <div key={poster.id} className={styles.movie_card}>
                                <img
                                    className={styles.movie_poster}
                                    src={poster.image}
                                    alt={poster.alt}
                                />
                                <h2 className={styles.poster_title}>
                                    {poster.title.split(' ').map((word, i) => (
                                        <React.Fragment key={i}>
                                            {word}
                                            {i < poster.title.split(' ').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </h2>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.slider_indicators}>
                     {posters.map((_, index) => (
                         <button
                             key={index}
                             className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                             onClick={() => setCurrentSlide(index)}
                             aria-label={`Перейти к слайду ${index + 1}`}
                         />
                     ))}
                 </div>
            </div>

            {/* Основной контент (без изменений) */}
            <div className={styles.main_content}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebar_section}>
                        <ul className={styles.sidebar_menu}>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('feed'); }}
                                    className={`${styles.sidebar_titles} ${activeSection === 'feed' ? styles.active : ''}`}>
                                    Лента постов
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('news'); }}
                                    className={`${styles.sidebar_titles} ${activeSection === 'news' ? styles.active : ''}`}>
                                    Новости
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('collections'); }}
                                    className={`${styles.sidebar_titles} ${activeSection === 'collections' ? styles.active : ''}`}>
                                    Подборки пользователей
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('rating'); }}
                                    className={`${styles.sidebar_titles} ${activeSection === 'rating' ? styles.active : ''}`}>
                                    Рейтинг подборок
                                </a>
                            </li>
                        </ul>
                    </div>
                </aside>
                <main className={styles.content}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default GeneralPage;