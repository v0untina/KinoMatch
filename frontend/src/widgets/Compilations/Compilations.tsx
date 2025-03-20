"use client";
import React, { useState } from 'react';
import styles from "./Compilations.module.css";

const initialCards = [
  { name: "Карточка 1", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
  { name: "Карточка 2", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
  { name: "Карточка 3", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
  { name: "Карточка 4", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
  { name: "Карточка 5", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
  { name: "Карточка 6", link: "https://pictures.s3.yandex.net/frontend-developer/cards-compressed/arkhyz.jpg" },
];

function Card({ name, link }) {
  return (
    <li className={`${styles.places__item} ${styles.card}`}>
      <img className={styles.card__image} src={link} alt={name} />
      <div className={styles.card__description}>
        <h2 className={styles.card__title}>{name}</h2>
      </div>
    </li>
  );
}

export default function Compilations() {
  const [cards, setCards] = useState(initialCards);

  return (
    <main className={styles.main}>
      <ul className={styles.places__list}>
        {cards.map((card, index) => (
          <Card
            key={index}
            name={card.name}
            link={card.link}
          />
        ))}
      </ul>
    </main>
  );
}