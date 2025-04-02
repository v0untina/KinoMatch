import React from "react";
import styles from './page.module.css'
import UsersQuestions from "@/widgets/Questions/UsersQuestions";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
const Page = () => {
    return (
        <div className={styles.wrap}>
            <Header/>
            <UsersQuestions/>
            <Footer/>
        </div>
    );
};

export default Page;