'use client'

import {AuthProvider} from '@/context/auth.context';
import React from "react";
import {NextUIProvider} from "@nextui-org/react";
import {Toaster} from "react-hot-toast";
import {ThemeProvider as NextThemesProvider} from "next-themes";
import {FiltersProvider} from "@/context/filters.context";

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <FiltersProvider>
          <NextUIProvider>
            <NextThemesProvider attribute="class" defaultTheme="light">
              {children}
              <Toaster/>
            </NextThemesProvider>
          </NextUIProvider>
        </FiltersProvider>
      </AuthProvider>
    </>
  )
}