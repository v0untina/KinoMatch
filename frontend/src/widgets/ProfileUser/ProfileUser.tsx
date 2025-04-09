"use client";

import React, { useState } from "react";
import styles from "./ProfileUser.module.css";

export default function ProfileUser() {
  const [activeTab, setActiveTab] = useState<"saved" | "best_compilations" | "compilations">("saved");

  return (
    <main className={styles.main}>
        <div className={styles.user_info}>
            <div className={styles.avatar_user_nick}>
                <div className={styles.user_avatar}></div> 
                <div className={styles.container}>
                <p className={styles.username_profile}> USERNAME</p>
                <p className={styles.user_rating}>Рейтинг <span className={styles.rating_count}>128</span></p>
                </div>
            </div>
      </div>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab_button} ${activeTab === "saved" ? styles.active : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          избранные фильмы
        </button>
        <button 
          className={`${styles.tab_button} ${activeTab === "best_compilations" ? styles.active : ""}`}
          onClick={() => setActiveTab("best_compilations")}
        >
          избранные подборки
        </button>
        <button 
          className={`${styles.tab_button} ${activeTab === "compilations" ? styles.active : ""}`}
          onClick={() => setActiveTab("compilations")}
        >
          ваши подборки
        </button>
      </div>

      <div className={styles.tab_сontent}>
        {activeTab === "saved" && (
            <></>
        )}

        {activeTab === "best_compilations" && (
            <></>
        )}

        {activeTab === "compilations" && (
            <></>
        )}
      </div>
    </main>
  );
}