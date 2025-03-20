import React from "react";
import styles from "./AboutKMTCH.module.css";
import {Link} from "@nextui-org/react"


export default function About() {
  return (
    <main className={styles.main}>
      <div className={styles.gologin}>
        <h1 className={styles.title}>КиноMatch создает волшебные моменты <br />вашего кинопутешествия!</h1>
        <ul className={styles.customList}>
          <li>Найдите идеальный фильм с помощью нашего опроса</li>
          <li>Cоздайте уникальные киновариации</li>
          <li>Делитесь впечатлениями с другими киноманами</li>
          <li>Открывайте новые подборки на любой вкус!</li>
        </ul>
        <img className={styles.robot} src="interface/robot.png" alt="" />
        <Link href={'/login'}>
        <button className={styles.loginbutton}>присоединяйтесь</button>
        </Link>
      </div>
    </main>
  );
}
