// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import React from 'react';
import "@/styles/globals.css";
import 'animate.css';
import { Providers } from "@/providers";
import PagePreloader from "@/components/PagePreloader/PagePreloader";

export const metadata: Metadata = {
    title: "КиноMatch",
    description: "VO",
    openGraph: {
        title: 'КиноMatch',
        description: "VO"
    }
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {

  return (
    <html lang="ru">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com"/>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com"/>
      <link
        href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Unbounded:wght@200..900&display=swap"
        rel="stylesheet"/>
    </head>
    <body>
    <Providers>
      <PagePreloader/>
      {children}
    </Providers>
    </body>
    </html>
  );
}