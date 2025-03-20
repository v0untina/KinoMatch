import React from "react";
import styles from "./page.module.css"
import TermsOfUse from "@/widgets/TermsOfUse/TermsOfUse";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
const Page = () => {
    return (
        <div className={styles.wrap}>
            <Header/>
            <TermsOfUse/>
            <Footer/>
        </div>
    );
};

export default Page;