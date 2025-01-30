import React, {useState} from 'react';
import useAuth from "@/hooks/useAuth";
import styles from "./UserProfileModal.module.css";
import {Avatar, Button, Link} from "@nextui-org/react";

const UserProfileModal = () => {
  const userData = useAuth()
  const [viewPass, setViewPass] = useState(false)
  const [pass, setPass] = useState('nowPass')
  const [isChange, setIsChange] = useState(true)

  const handleInput = (e) => {
    const newPass = e.target.value
    setPass(newPass);
    setIsChange(newPass === 'nowPass')
  }

  const handleChangePass = () => {
    //меняем пароль
  }

  const handleLogout = () => {
    userData?.logout();
  }

  const toggleViewPass = () => setViewPass(!viewPass);

  return (
    <div className={styles.profile_page}>
      <Avatar size="lg"></Avatar>

      <div className={styles.head_info}>
        <span className={styles.nick}>{userData?.user?.username ? userData?.user?.username : 'Undefinded'}</span>
        <span>{userData?.user?.username ? userData?.user?.email : 'Undefinded'}</span>
      </div>

      {/*<Input type={viewPass ? "text" : "password"} value={pass} onInput={handleInput} endContent={
        <button className="focus:outline-none" type="button" onClick={toggleViewPass}
                aria-label="toggle password visibility">
          {viewPass ? (
            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none"/>
          ) : (
            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none"/>
          )}
        </button>
      }/>*/}

      <Link href={'/change'}>
        <Button variant="light" size="sm" color="primary" onClick={handleChangePass}>Изменить
          пароль</Button>
      </Link>

      <Link href={'/register'}>
        <Button variant="light" size="sm" color="danger" onClick={handleLogout}>Выйти из аккаунта</Button>
      </Link>
    </div>
  )
    ;
};

export default UserProfileModal;