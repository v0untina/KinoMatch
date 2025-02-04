// frontend/src/app/page.tsx
import styles from './page.module.css'
import React from "react";
import EventsViewer from "@/widgets/EventsViewer/EventsViewer";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import LeftBarLayout from "@/layouts/LeftBarLayout/LeftBarLayout";
import MovieRecommendationWidget from '@/widgets/MovieRecommendationWidget/MovieRecommendationWidget'; // <--- Импортируем MovieRecommendationWidget

export default function Home() {
  return (
    <MainLayout>
      <LeftBarLayout>
        <div>
          <h1>Главная страница KinoMatch</h1>
          <p>Добро пожаловать в KinoMatch!</p>

          <MovieRecommendationWidget /> {/* <--- Используем MovieRecommendationWidget */}

          <EventsViewer /> {/* Пример использования EventsViewer */}
        </div>
      </LeftBarLayout>
    </MainLayout>
  )
}