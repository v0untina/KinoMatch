import React from 'react';
import styles from './page.module.css'
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import AboutMovie from '@/widgets/AboutMovie/AboutMovie';
const Page = () => {
  return (
    <div className={styles.wrap}>
      <Header/>
      <AboutMovie/>
      <Footer/>
    </div>
  );
};

export default Page;