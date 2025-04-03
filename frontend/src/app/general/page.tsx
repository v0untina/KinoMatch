import React from 'react';
import styles from './page.module.css'
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import GeneralPage from '@/widgets/GeneralPage/GeneralPage';
const Page = () => {
  return (
    <div className={styles.wrap}>
      <Header/>
      <GeneralPage/>
      <Footer/>
    </div>
  );
};

export default Page;