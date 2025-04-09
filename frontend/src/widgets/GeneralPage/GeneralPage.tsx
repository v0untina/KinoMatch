// GeneralPage.tsx


"use client"

import React, { useState, useEffect } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth';
import { getPosts, createPost, Post } from '@/api/posts';
import toast from 'react-hot-toast';

// Компонент для отображения одного поста
const PostCard = ({ post }: { post: Post }) => {
    const formattedDate = post.timestamp
        ? new Date(post.timestamp).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          })
        : 'Дата не указана';

    return (
        <div className={styles.post}>
            {/* Левая часть поста */}
            <div className={styles.postMainContent}>
                <div className={styles.postHeader}>
                    <img
                        className={styles.postUserAvatar}
                        src={post.userAvatar || '/interface/defaultAvatar.webp'}
                        alt={post.username}
                        onError={(e) => (e.currentTarget.src = '/interface/defaultAvatar.webp')}
                    />
                    <div className={styles.postUserInfo}>
                        <span className={styles.postUsername}>{post.username}</span>
                        <span className={styles.postTimestamp}>{formattedDate}</span>
                    </div>
                </div>
                <div className={styles.postContent}>
                    <p>{post.content || 'Контент отсутствует'}</p>
                    {post.imageUrl && (
                        <img
                            className={styles.postImage}
                            src={post.imageUrl}
                            alt="Post image"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    )}
                </div>
                <div className={styles.postActions}>
                    <span>Лайки: {post.likes ?? 0}</span>
                </div>
            </div>

            {/* Правая часть поста (комментарии) */}
            <div className={styles.comments}>
                <span className={styles.comments_title}>комментарии</span>
                <div className={styles.reviews}>
                    {(!post.comments || post.comments.length === 0) && (
                        <p className={styles.comment}>Комментариев пока нет.</p>
                    )}
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

const GeneralPage = () => {
    const [activeSection, setActiveSection] = useState('feed');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postText, setPostText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);

    const auth = useAuth();

    if (!auth) {
        return <div className={styles.container}><p>Загрузка данных пользователя...</p></div>;
    }

    const { user, loading: loadingAuth } = auth;

    // Загрузка постов при монтировании
    useEffect(() => {
        setLoadingPosts(true);
        setErrorPosts(null);
        getPosts()
            .then(data => {
                console.log('Fetched posts:', data); // Логируем данные для отладки
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
    }, []);

    // Обработчик отправки формы создания поста
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!postText.trim()) {
            toast.error("Текст поста не может быть пустым.");
            return;
        }

        if (imageUrl && !imageUrl.match(/^https?:\/\/.+/)) {
            toast.error("Введите корректный URL изображения (начинающийся с http:// или https://).");
            return;
        }

        const postData = {
            content: postText,
            imageUrl: imageUrl.trim() || undefined
        };

        const toastId = toast.loading("Публикация поста...");

        try {
            const newPost = await createPost(postData);
            console.log('Created post:', newPost); // Логируем новый пост
            setPosts(prevPosts => [newPost, ...prevPosts]);
            toast.success("Пост успешно опубликован!", { id: toastId });
            setIsModalOpen(false);
            setPostText('');
            setImageUrl('');
        } catch (error: any) {
            console.error("Failed to create post:", error);
            const errorMessage = error.response?.data?.message || "Не удалось опубликовать пост.";
            toast.error(`Ошибка: ${errorMessage}`, { id: toastId });
        }
    };

    // Логика рендера контента секций
    const renderContent = () => {
        switch (activeSection) {
            case 'feed':
                return (
                    <div className={styles.feed}>
                        {!loadingAuth && user && (
                            <button
                                className={styles.add_post_button}
                                onClick={() => setIsModalOpen(true)}
                            >
                                добавить пост
                            </button>
                        )}
                        {loadingPosts && <p>Загрузка постов...</p>}
                        {errorPosts && <p className={styles.error_message}>{errorPosts}</p>}
                        {!loadingPosts && !errorPosts && (
                            posts.length === 0 ? (
                                <p>Постов пока нет.</p>
                            ) : (
                                <div className={styles.posts}>
                                    {posts.map((post, index) => (
                                        <PostCard key={post.postId || index} post={post} />
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
                return <div className={styles.feed}>{/* Логика как в 'feed' */}</div>;
        }
    };

    return (
        <div className={styles.container}>
            {/* Модальное окно создания поста */}
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
                                rows={5}
                                required
                            />
                            <input
                                type="url"
                                placeholder="URL изображения (необязательно)"
                                className={styles.modal_input}
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            {imageUrl && imageUrl.match(/^https?:\/\/.+/) && (
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className={styles.image_preview}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                    onLoad={(e) => (e.currentTarget.style.display = 'block')}
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
                            aria-label="Закрыть"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Остальной контент страницы */}
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