import React from 'react';
import styles from './page.module.css'
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import CrossingMovies from '@/widgets/CrossingMovies/CrossingMovies';
const Page = () => {
  return (
    <div className={styles.wrap}>
      <Header/>
      <CrossingMovies/>
      <Footer/>
    </div>
  );
};

export default Page;