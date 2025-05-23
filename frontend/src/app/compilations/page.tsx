// frontend/src/api/compilations.ts
import React from 'react';
import styles from './page.module.css'
import Compilations from '@/widgets/Compilations/Compilations';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
const Page = () => {
    return (
      <div className={styles.wrap}>
        <Header/>
        <Compilations/>
        <Footer/>
      </div>
    );
  };
  
  export default Page;