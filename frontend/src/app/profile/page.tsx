import React from 'react';
import styles from './page.module.css'
import UserProfile from '@/widgets/ProfileUser/ProfileUser';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
const Page = () => {
  return (
    <div className={styles.wrap}>
      <Header/>
      <UserProfile/>
      <Footer/>
    </div>
  );
};

export default Page;