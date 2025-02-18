import styles from './page.module.css'
import React from "react";
import MainLayout from "@/layouts/MainLayout/MainLayout";

export default function Home() {
  return (
    <div className={styles.wrap}>
      <MainLayout>
        <div className={styles.mainLayout}>
        </div>
      </MainLayout>
    </div>
  );
}
