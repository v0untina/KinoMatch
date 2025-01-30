import styles from './MainLayout.module.css'
import React from "react";
import Header from "@/components/Header/Header";

export default function MainLayout({children}) {
  return (
    <>
      <Header/>

      <div className={styles.innerLayout}>
        {children}
      </div>
    </>

  )
}