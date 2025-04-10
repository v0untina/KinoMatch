"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GeneralPage.module.css';
import useAuth from '@/hooks/useAuth';
import { getPosts, createPost, Post } from '@/api/posts';
import toast from 'react-hot-toast';

const PostCard = ({ post }: { post: Post }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes ?? 0);

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

    // Обработчики кликов
    const handleLikeClick = () => {
        setIsLiked(!isLiked);
        setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
        console.log(`Post ${post.postId} Like toggled: ${!isLiked}`);
        // TODO: API call for like/unlike
    };
    const handleCommentClick = () => {
        console.log(`Post ${post.postId} Comment clicked`);
        // TODO: Implement comment focus/scroll logic
    };

    return (
        <div className={`${styles.post} ${styles.roundedCard}`}>
            <div className={styles.postMainContent}>
                <div className={styles.postHeader}>
                    <img
                        className={styles.postUserAvatar}
                        src={post.userAvatar || '/interface/defaultAvatar.webp'}
                        alt={`${post.username} avatar`}
                        onError={handleAvatarError}
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
                            onError={handleImageError}
                        />
                    )}
                </div>
                <div className={styles.postActions}>
                    <button onClick={handleLikeClick} className={styles.actionButton}>
                        <img
                           src={isLiked ? '/interface/like_ON.png' : '/interface/like_OFF.png'}
                           alt="Лайк"
                           className={styles.actionIcon}
                        />
                        <span className={styles.likesCounter}>{likesCount}</span>
                    </button>
                    <button onClick={handleCommentClick} className={styles.actionButton}>
                        <img
                           src="/interface/commenting.png"
                           alt="Комментарий"
                           className={styles.actionIcon}
                        />

                    </button>
                </div>
            </div>

            <div className={`${styles.comments} ${styles.roundedCard}`}>
                 <span className={styles.comments_title}>комментарии</span>
                 <div className={styles.reviews}>
                    {(!post.comments || post.comments.length === 0) && (
                        <p className={styles.comment}>Комментариев пока нет.</p>
                    )}
                    <div className={styles.review}> <img className={styles.image_user} src="/User.png" alt="" /> <p className={styles.comment}>Отличный пост!</p> </div>
                    <div className={styles.review}> <img className={styles.image_user} src="/User.png" alt="" /> <p className={styles.comment}>Согласен!</p> </div>
                 </div>
             </div>
        </div>
    );
};


const GeneralPage = () => {
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
    const auth = useAuth();

    // Загрузка постов
    useEffect(() => {
        setLoadingPosts(true);
        setErrorPosts(null);
        getPosts()
            .then(data => {
                console.log('Fetched posts:', data);
                setPosts(data);
            })
            .catch(err => {
                console.error("Failed to load posts:", err);
                const message = err.response?.data?.message || err.message || "Не удалось загрузить посты.";
                setErrorPosts(message);
                toast.error(`Ошибка загрузки постов: ${message}`);
            })
            .finally(() => setLoadingPosts(false));
    }, []);

    // Обработчик изменения файла
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setImageFile(null);
        setImagePreviewUrl(null);

        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Пожалуйста, выберите файл изображения.');
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeInBytes) {
                toast.error(`Файл слишком большой. Макс. размер: ${maxSizeInBytes / 1024 / 1024}MB`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviewUrl(reader.result as string);
            reader.onerror = () => toast.error("Не удалось создать превью.");
            reader.readAsDataURL(file);
        }
    };

    // Очистка выбранного изображения
    const clearImageSelection = useCallback(() => {
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    // Закрытие модалки
    const closeModal = useCallback(() => {
        if (isSubmitting) return; // Не закрывать во время отправки
        setIsModalOpen(false);
        setPostText('');
        clearImageSelection();
        setIsSubmitting(false);
    }, [clearImageSelection, isSubmitting]);

    // Отправка формы
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!postText.trim()) {
            toast.error("Текст поста не может быть пустым.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Публикация поста...");
        const payload = { content: postText.trim(), image: imageFile ?? undefined };

        try {
            const newPost = await createPost(payload);
            setPosts(prevPosts => [newPost, ...prevPosts]);
            toast.success("Пост успешно опубликован!", { id: toastId });
            closeModal(); // Закроет и сбросит isSubmitting
        } catch (error: any) {
            console.error("Failed to create post:", error);
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
            setIsSubmitting(false); // Разблокируем кнопку только в случае ошибки
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'feed':
                return (
                    <div className={styles.feed}>
                        {auth && !auth.loading && auth.user && (
                            <button
                                className={styles.add_post_button}
                                onClick={() => setIsModalOpen(true)}
                                disabled={auth.loading || isSubmitting} 
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
            default:
                 return <div className={styles.feed}> {auth && !auth.loading && auth.user && ( <button className={styles.add_post_button} onClick={() => setIsModalOpen(true)} disabled={auth.loading || isSubmitting} > добавить пост </button> )} {loadingPosts && <p>Загрузка постов...</p>} {errorPosts && <p className={styles.error_message}>{errorPosts}</p>} {!loadingPosts && !errorPosts && ( posts.length === 0 ? ( <p>Постов пока нет. Создайте первый!</p> ) : ( <div className={styles.posts}> {posts.map((post) => ( <PostCard key={post.postId} post={post} /> ))} </div> ) )} </div>;
        }
    };

    return (
        <div className={styles.container}>
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
                                rows={5}
                                required
                                disabled={isSubmitting}
                            />
                            <input
                                id="post-image-upload"
                                ref={fileInputRef}
                                type="file"
                                accept="image/*" 
                                className={styles.modal_file_input}
                                onChange={handleImageChange}
                                disabled={isSubmitting}
                            />
                             <div className={styles.image_upload_area}>
                                 <label htmlFor="post-image-upload" className={`${styles.modal_file_label} ${isSubmitting ? styles.disabled_label : ''}`}>
                                      Выбрать файл
                                 </label>

                                {imagePreviewUrl && (
                                    <div className={styles.image_preview_container}>
                                        <img
                                            src={imagePreviewUrl}
                                            alt="Предпросмотр изображения"
                                            className={styles.image_preview}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Важно!
                                                !isSubmitting && clearImageSelection();
                                            }}
                                            className={styles.clear_image_button}
                                            disabled={isSubmitting}
                                            aria-label="Удалить изображение"
                                        > × </button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modal_buttons}>
                                <button
                                    type="submit"
                                    className={styles.modal_submit}
                                    disabled={isSubmitting || !postText.trim()}
                                > {isSubmitting ? 'Публикация...' : 'Опубликовать'} </button>
                            </div>
                        </form>
                        <button
                            className={styles.modal_close}
                            onClick={closeModal}
                            aria-label="Закрыть"
                            disabled={isSubmitting}
                        >×</button>
                    </div>
                </div>
            )}

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
                            <li> <a className={`${styles.sidebar_titles} ${activeSection === 'feed' ? styles.active : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('feed'); }}> Лента постов </a> </li>
                            <li> <a className={`${styles.sidebar_titles} ${activeSection === 'new' ? styles.active : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('new'); }}> Новинки </a> </li>
                            <li> <a className={`${styles.sidebar_titles} ${activeSection === 'collections' ? styles.active : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('collections'); }}> Подборки пользователей </a> </li>
                            <li> <a className={`${styles.sidebar_titles} ${activeSection === 'rating' ? styles.active : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('rating'); }}> Рейтинг подборок </a> </li>
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