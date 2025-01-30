"use client";
import React from 'react';
import styles from "./Header.module.css";
import Logo from "@/components/Logo/Logo";
import {Link} from "@nextui-org/react"
import {ThemeSwitcher} from "@/components/ThemeSwitch/ThemeSwitch";

const Header = ({className}: { className?: string }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerInner}>
        <Link href={'/'}>
          <Logo size={"small"} colored/>
        </Link>
        <div className="flex-grow"></div>
        <ThemeSwitcher/>
      </div>
    </div>
  );
};

export default Header;
