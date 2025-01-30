import FiltersList from "@/widgets/FiltersList/FiltersList";
import styles from "@/app/page.module.css";
import React from "react";

export default function LeftBarLayout({children}) {
  return (
    <>
      <FiltersList className={styles.filters}/>
      {children}
    </>
  )
}