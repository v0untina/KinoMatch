"use client"

import React, { useState, useRef, useCallback } from 'react';
import styles from './GeneralPage.module.css';

const GeneralPage = () => {
  const [activeSection, setActiveSection] = useState('feed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (file) => {
    if (file && file.type.match('image.*')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageChange(file);
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageChange(files[0]);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ postText, selectedImage });
    setIsModalOpen(false);
    setPostText('');
    setSelectedImage(null);
    setPreviewImage(null);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'feed':
        return (
          <div className={styles.feed}>
            <button 
              className={styles.add_post_button} 
              onClick={() => setIsModalOpen(true)}
            >
              добавить пост
            </button>
            <div className={styles.posts}>
              <div className={styles.post}>
                <div className={styles.about_post}></div>
                <div className={styles.comments}>
                    <span className={styles.comments_title}>комментарии</span>
                    <div className={styles.reviews}>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                </div>
                </div>
              </div>
              <div className={styles.post}>
                <div className={styles.about_post}></div>
                <div className={styles.comments}>
                    <span className={styles.comments_title}>комментарии</span>
                    <div className={styles.reviews}>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                  <div className={styles.review}>
                      <img  className={styles.image_user} src="/User.png" alt="" />
                      <p className={styles.comment}>Я была приятно удивлена новым мультфильмом о Гринче! <br />Яркая анимация и забавные персонажи сделали просмотр настоящим удовольствием. Особенно понравилась музыкальная составляющая — песни были очень запоминающимися. Рекомендую всем, кто хочет поднять настроение!</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        );
        case 'new':
          return <div>Контент новинок</div>;
        case 'collections':
          return <div>Контент подборок пользователей</div>;
        case 'rating':
          return <div>Контент рейтинга подборок</div>;
        default:
          return <div>Контент ленты постов</div>;
    }
  };

  return (
    <div className={styles.container}>
      {isModalOpen && (
        <div className={styles.modal_overlay}>
          <div className={styles.modal}>
            <h2>Новая запись</h2>
            <form className={styles.modal_form} onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Напишите что-нибудь..." 
                className={styles.modal_input}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
              <div 
                className={`${styles.image_upload_area} ${isDragging ? styles.dragging : ''}`}
                onClick={() => fileInputRef.current.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className={styles.image_preview}
                  />
                ) : (
                  <div className={styles.upload_placeholder}>
                    <img className={styles.upload_image} src="/Frame.png" alt="" />
                    <span>Загрузите изображение</span>
                    <span>или перетащите его сюда</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className={styles.file_input}
                />
              </div>
              
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
                setSelectedImage(null);
                setPreviewImage(null);
              }}
            >
              ×
            </button>
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