import React from "react";
import styles from "./Footer.module.css"
import { Link } from "@nextui-org/react";

export default function Footer(){
  return(
    <footer className={styles.footer}>
      <div className={styles.tech_support}>
        <h1 className={styles.title}>Техническая поддержка</h1>
        <p className={styles.paragraph}>Мы с радостью ответим на все ваши вопросы!</p>
        <p className={styles.paragraph}>support_kinomatch@mail.ru</p>
      </div>
      <div className={styles.help}>
        <h1 className={styles.title}>Помощь</h1>
        <Link href={'/information'}>
        <p className={styles.paragraph}>Информация</p>
        </Link>
        <Link href={'/questions'}>
        <p className={styles.paragraph}>Общие вопросы</p>
        </Link>
      </div>
      <div className={styles.about_kinomatch}>
        <h1 className={styles.title}>КиноMatch</h1>
        <Link href={'/contacts'}>
           <p className={styles.paragraph}>Контакты</p>
        </Link>
        <Link href={'/documents'}>
           <p className={styles.paragraph}>Документы</p>
        </Link>
        <Link href={'/recommendationpolicy'}>
           <p className={styles.paragraph}>Правила применения рекомендательных технологий</p>
        </Link>
      </div>
    </footer>
  )
}