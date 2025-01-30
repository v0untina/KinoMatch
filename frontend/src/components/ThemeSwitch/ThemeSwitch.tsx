"use client";

import {useTheme} from "next-themes";
import {useEffect, useState} from "react";
import {Button} from "@nextui-org/react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const {theme, setTheme} = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div>
      {theme === "light" ? (
        <Button color="default" isIconOnly size={"sm"} variant="solid" onClick={() => setTheme("dark")}>
          <span className="material-symbols-rounded">dark_mode</span>
        </Button>
      ) : (
        <Button color="default" isIconOnly size={"sm"} variant="solid" onClick={() => setTheme("light")}>
          <span className="material-symbols-rounded">light_mode</span>
        </Button>
      )
      }
    </div>
  )
};