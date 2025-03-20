import React from "react";
import styles from "./page.module.css"
import RecommendationPolicy from "@/widgets/RecommendationPolicy/recommendationpolicy";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
const Page = () => {
    return (
        <div className={styles.wrap}>
            <Header/>
            <RecommendationPolicy/>
            <Footer/>
        </div>
    );
};

export default Page;