"use client";

import React, {useEffect, useState} from 'react';
import styles from "./PagePreloader.module.css";
import {Spinner} from "@nextui-org/react";
import {usePathname} from 'next/navigation';

const PagePreloader = () => {
  const [visible, setVisible] = useState(true); // Отвечает за видимость компонента
  const pathname = usePathname();

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 450); // Задержка :)

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  const fullClassName = `${styles.preloaderWrapper} ${visible ? styles.visible : styles.hidden}`;

  return (
    <div className={fullClassName}>
      <Spinner size="lg"/>
    </div>
  );
};

export default PagePreloader;