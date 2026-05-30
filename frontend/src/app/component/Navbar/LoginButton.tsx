'use client'
import React from 'react'
import { useRouter } from "next/navigation";

const LoginButton = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <button 
      className={'w-fit h-fit flex items-center justify-center bg-red-500 p-2 rounded-md font-bold cursor-pointer text-white hover:scale-105 transition duration-300'} 
      onClick={handleLogin}
    >
      Login
    </button>
  )
}

export default LoginButton
