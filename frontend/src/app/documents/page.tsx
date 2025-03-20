import React from "react";
import styles from "./page.module.css"
import Documents from "@/widgets/Documents/Documents";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
const Page = () => {
    return (
        <div className={styles.wrap}>
            <Header/>
            <Documents/>
            <Footer/>
        </div>
    );
};

export default Page;