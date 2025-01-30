'use client'
import useAuth from "@/hooks/useAuth";
import styles from './ShortUserProfile.module.css'

import {Avatar, Button, Link, Popover, PopoverContent, PopoverTrigger} from "@nextui-org/react";
import UserProfileModal from "@/modals/UserProfileModal/UserProfileModal";
import React from "react";
import {usePathname} from "next/navigation";

export default function ShortUserProfile() {
  const userData = useAuth()
  const path = usePathname()
  return (
    <div className={styles.short_info}>
      {
        userData?.user ? (
          <Popover placement="top">
            <PopoverTrigger>
              <Button variant="light" fullWidth className={styles.short_info_inner}>
                <Avatar size="sm"></Avatar>

                <div className={styles.short_info_text}>
                  <span
                    className={styles.nick}>{userData?.user?.username ? userData?.user?.username : 'Undefinded'}</span>
                </div>

                {
                  path === '/' ? (
                    <Link href={'/favorites'} className={styles.favorite}></Link>
                  ) : (
                    <></>
                  )
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className={styles.profile_popover}>
              <UserProfileModal/>
            </PopoverContent>

          </Popover>

        ) : (
          <div className={styles.short_info_reg}>
            <Link href="/login">
              <Button variant="light" color="default">Войти</Button>
            </Link>
            <Link href="/register">
              <Button variant="solid" color="primary">Регистрация</Button>
            </Link>
          </div>
        )
      }

    </div>
  )
}