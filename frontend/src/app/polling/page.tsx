import React from 'react';
import styles from './page.module.css'
import Pollingusers from '@/widgets/PollingUsers/PollingUsers';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
const Page = () => {
  return (
    <div className={styles.wrap}>
      <Header/>
      <Pollingusers/>
      <Footer/>
    </div>
  );
};

export default Page;