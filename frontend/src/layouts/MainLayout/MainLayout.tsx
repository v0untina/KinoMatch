import React from "react";
import About from '@/widgets/Landing/AboutKMTCH/AboutKMTCH';
import Header from "@/components/Header/Header";
import BestFilms from "@/widgets/Landing/BestFilms/BestFilms";
import CrossingFilms from "@/widgets/Landing/CrossingFilms/CrossingFilms";
import Footer from "@/components/Footer/Footer";

export default function MainLayout() {
  return (
    <>
      <Header/>
      <About/>
      <BestFilms/>
      <CrossingFilms/>
      <Footer/>
    </>
  )
}