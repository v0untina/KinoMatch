"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth'; // Импортируем хук аутентификации
import { getPosts, createPost, Post } from '@/api/posts'; // Импортируем API функции и тип Post
import toast from 'react-hot-toast'; // Для уведомлений

// --- Компонент для отображения одного поста ---
const PostCard = ({ post }: { post: Post }) => {
    const formattedDate = new Date(post.timestamp).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={styles.post}>
             {/* Левая часть поста */}
            <div className={styles.postMainContent}>
                <div className={styles.postHeader}>
                    <img
                        className={styles.postUserAvatar}
                        src={post.userAvatar || '/interface/defaultAvatar.webp'}
                        alt={post.username}
                        onError={(e) => e.currentTarget.src = '/interface/defaultAvatar.webp'} // Запасной аватар при ошибке загрузки
                    />
                    <div className={styles.postUserInfo}>
                        <span className={styles.postUsername}>{post.username}</span>
                        <span className={styles.postTimestamp}>{formattedDate}</span>
                    </div>
                </div>
                <div className={styles.postContent}>
                    <p>{post.content}</p>
                    {post.imageUrl && (
                        <img
                            className={styles.postImage}
                            src={post.imageUrl}
                            alt="Post image"
                            // Можно добавить onError для картинки поста
                            onError={(e) => e.currentTarget.style.display = 'none'} // Скрыть, если картинка не загрузилась
                         />
                    )}
                </div>
                <div className={styles.postActions}>
                     {/* Место для кнопок лайков/комментариев */}
                     <span>Лайки: {post.likes ?? 0}</span>
                </div>
            </div>

             {/* Правая часть поста (комментарии) */}
            <div className={styles.comments}>
                 <span className={styles.comments_title}>комментарии</span>
                 <div className={styles.reviews}>
                       {/* Логика отображения комментариев будет здесь, когда она появится */}
                       {(!post.comments || post.comments.length === 0) && (
                           <p className={styles.comment}>Комментариев пока нет.</p>
                       )}
                       {/* Пример рендеринга комментариев, если они есть */}
                       {/* {post.comments && post.comments.map((comment, index) => (
                           <div key={index} className={styles.review}>
                               <img className={styles.image_user} src={comment.userAvatar || '/interface/defaultAvatar.webp'} alt={comment.username} />
                               <p className={styles.comment}><strong>{comment.username}:</strong> {comment.text}</p>
                           </div>
                       ))} */}
                       {/* Статичные примеры для визуализации */}
                       <div className={styles.review}>
                           <img className={styles.image_user} src="/User.png" alt="" />
                           <p className={styles.comment}>Отличный пост!</p>
                       </div>
                       <div className={styles.review}>
                           <img className={styles.image_user} src="/User.png" alt="" />
                           <p className={styles.comment}>Согласен!</p>
                       </div>
                 </div>
            </div>
        </div>
    );
};
// --- Конец компонента PostCard ---


const GeneralPage = () => {
    const [activeSection, setActiveSection] = useState('feed');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Состояние для постов
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);

    const auth = useAuth(); // Получаем весь контекст

    // Если контекст еще не загружен (например, при первой загрузке страницы)
    if (!auth) {
        return <div className={styles.container}><p>Загрузка данных пользователя...</p></div>; // Или другой индикатор загрузки
    }

    // Теперь безопасно деструктурируем
    const { user, loading: loadingAuth } = auth;

    // --- Загрузка постов при монтировании ---
    useEffect(() => {
        setLoadingPosts(true);
        setErrorPosts(null);
        getPosts()
            .then(data => {
                setPosts(data);
            })
            .catch(err => {
                console.error("Failed to load posts:", err);
                const message = err.response?.data?.message || "Не удалось загрузить посты.";
                setErrorPosts(message);
                toast.error(`Ошибка загрузки постов: ${message}`);
            })
            .finally(() => {
                setLoadingPosts(false);
            });
    }, []); // Пустой массив зависимостей - выполнить один раз

    // --- Обработчик отправки формы создания поста ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!postText.trim()) {
             toast.error("Текст поста не может быть пустым.");
             return;
        }

        // Простая проверка URL на наличие http/https (необязательно, т.к. type="url" делает это)
        if (imageUrl && !imageUrl.match(/^https?:\/\/.+/)) {
             toast.error("Введите корректный URL изображения (начинающийся с http:// или https://).");
             return;
        }

        const postData = {
            content: postText,
            imageUrl: imageUrl.trim() || undefined // Отправляем undefined если пусто или только пробелы
        };

        const toastId = toast.loading("Публикация поста...");

        try {
            const newPost = await createPost(postData);
            // Добавляем новый пост в начало списка
            setPosts(prevPosts => [newPost, ...prevPosts]);
            toast.success("Пост успешно опубликован!", { id: toastId });

            // Очищаем форму и закрываем модалку
            setIsModalOpen(false);
            setPostText('');
            setImageUrl('');
        } catch (error: any) {
            console.error("Failed to create post:", error);
            const errorMessage = error.response?.data?.message || "Не удалось опубликовать пост.";
            toast.error(`Ошибка: ${errorMessage}`, { id: toastId });
        }
    };

    // --- Логика рендера контента секций ---
    const renderContent = () => {
        switch (activeSection) {
            case 'feed':
                return (
                    <div className={styles.feed}>
                        {/* Показываем кнопку только если аутентификация завершена и пользователь есть */}
                        {!loadingAuth && user && (
                            <button
                                className={styles.add_post_button}
                                onClick={() => setIsModalOpen(true)}
                            >
                                добавить пост
                            </button>
                        )}
                         {/* Индикатор загрузки или сообщение об ошибке */}
                         {loadingPosts && <p>Загрузка постов...</p>}
                         {errorPosts && <p className={styles.error_message}>{errorPosts}</p>}

                         {/* Отображение постов */}
                        {!loadingPosts && !errorPosts && (
                             posts.length === 0 ? (
                                 <p>Постов пока нет.</p>
                             ) : (
                                 <div className={styles.posts}>
                                     {posts.map(post => (
                                         <PostCard key={post.postId} post={post} />
                                     ))}
                                 </div>
                             )
                        )}
                    </div>
                );
            case 'new':
                return <div>Контент новинок (не реализовано)</div>;
            case 'collections':
                return <div>Контент подборок пользователей (не реализовано)</div>;
            case 'rating':
                return <div>Контент рейтинга подборок (не реализовано)</div>;
            default:
                 // По умолчанию показываем ленту
                return <div className={styles.feed}> {/* ... Копируем логику из case 'feed' ... */} </div>;
        }
    };

    return (
        <div className={styles.container}>
            {/* --- Модальное окно создания поста --- */}
            {isModalOpen && (
                <div className={styles.modal_overlay}>
                    <div className={styles.modal}>
                        <h2>Новая запись</h2>
                        <form className={styles.modal_form} onSubmit={handleSubmit}>
                            <textarea
                                placeholder="Напишите что-нибудь..."
                                className={styles.modal_textarea}
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                rows={5} // Можно настроить высоту
                                required
                            />
                            <input
                                type="url"
                                placeholder="URL изображения (необязательно)"
                                className={styles.modal_input}
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                             {/* Предпросмотр для URL */}
                             {imageUrl && imageUrl.match(/^https?:\/\/.+/) && (
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className={styles.image_preview}
                                    onError={(e) => {
                                        // Прячем превью и можно добавить уведомление
                                        e.currentTarget.style.display = 'none';
                                        // toast.error("Не удалось загрузить превью изображения."); // Опционально
                                    }}
                                    onLoad={(e) => e.currentTarget.style.display = 'block'} // Показываем если загрузилось
                                />
                             )}

                            <div className={styles.modal_buttons}>
                                <button type="submit" className={styles.modal_submit}>
                                    Опубликовать
                                </button>
                            </div>
                        </form>
                        <button
                            className={styles.modal_close}
                            onClick={() => {
                                setIsModalOpen(false);
                                setPostText('');
                                setImageUrl('');
                            }}
                            aria-label="Закрыть" // Добавим aria-label для доступности
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* --- Остальной контент страницы --- */}
            <div className={styles.posters_slide}>
              <div className={styles.movie_card}>
                <img className={styles.movie_poster} src="/chtivo.png" alt="Криминальное чтиво" />
                <h2 className={styles.poster_title}>Криминальное <br />чтиво</h2>
              </div>
            </div>

            <div className={styles.main_content}>
                <aside className={styles.sidebar}>
                     <div className={styles.sidebar_section}>
                        <ul className={styles.sidebar_menu}>
                          <li>
                            <a
                              className={`${styles.sidebar_titles} ${activeSection === 'feed' ? styles.active : ''}`}
                              href="#"
                              onClick={(e) => { e.preventDefault(); setActiveSection('feed'); }}
                            >
                              Лента постов
                            </a>
                          </li>
                          <li>
                            <a
                              className={`${styles.sidebar_titles} ${activeSection === 'new' ? styles.active : ''}`}
                              href="#"
                              onClick={(e) => { e.preventDefault(); setActiveSection('new'); }}
                            >
                              Новинки
                            </a>
                          </li>
                          <li>
                            <a
                              className={`${styles.sidebar_titles} ${activeSection === 'collections' ? styles.active : ''}`}
                              href="#"
                              onClick={(e) => { e.preventDefault(); setActiveSection('collections'); }}
                            >
                              Подборки пользователей
                            </a>
                          </li>
                          <li>
                            <a
                              className={`${styles.sidebar_titles} ${activeSection === 'rating' ? styles.active : ''}`}
                              href="#"
                              onClick={(e) => { e.preventDefault(); setActiveSection('rating'); }}
                            >
                              Рейтинг подборок
                            </a>
                          </li>
                        </ul>
                      </div>
                </aside>
                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default GeneralPage;