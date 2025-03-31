import React from "react";
import styles from "./page.module.css"
import Information from "@/widgets/Information/Information";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Info } from "lucide-react";
const Page = () => {
    return (
      <div className={styles.wrap}>
        <Header/>
        <Information/>
        <Footer/>
      </div>
    );
  };
  
  export default Page;