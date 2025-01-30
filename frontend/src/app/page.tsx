import styles from './page.module.css'
import React from "react";
import EventsViewer from "@/widgets/EventsViewer/EventsViewer";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import LeftBarLayout from "@/layouts/LeftBarLayout/LeftBarLayout";

export default function Home() {
  return (
    <div className={styles.wrap}>
      <MainLayout>
        <div className={styles.mainLayout}>

          <LeftBarLayout>
            <EventsViewer className={styles.content}/>
          </LeftBarLayout>

        </div>
      </MainLayout>
    </div>
  );
}
