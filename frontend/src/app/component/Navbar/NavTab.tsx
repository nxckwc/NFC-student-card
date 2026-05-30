'use client'
import React from 'react'
import GeneralNavButton from './GeneralNavButton'
import LoginButton from './LoginButton'
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";


const NavTab = () => {
  const pathname = usePathname();
  const isLoginRoute = pathname.endsWith('/login');

  return (
    <div>
      <div className={'w-fit h-10 flex items-center justify-center text-white p-1 rounded-md gap-1'}>
        <GeneralNavButton />
        {!isLoginRoute && <LoginButton />}
      </div>
      
    </div>
  )
}

export default NavTab
