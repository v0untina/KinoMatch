import React from 'react';
import styles from './page.module.css'
import Contacts from '@/widgets/Contacts/Contacts';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
const Page = () => {
    return (
      <div className={styles.wrap}>
        <Header/>
        <Contacts/>
        <Footer/>
      </div>
    );
  };
  
  export default Page;