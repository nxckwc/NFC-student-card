'use client'
import React from 'react'
import GeneralNavButton from './GeneralNavButton'
import LoginButton from './LoginButton'
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import  Link  from 'next/link';


const NavTab = () => {
  const pathname = usePathname();
  const isLoginRoute = pathname.endsWith('/login');

  return (
    <div>
      <div className={'w-fit h-10 flex items-center justify-center text-white p-1 rounded-md gap-1'}>
        <GeneralNavButton />
        {!isLoginRoute && <Link href="/login">
              <button 
                className={'w-fit h-fit flex items-center justify-center bg-red-500 p-2 rounded-md font-bold cursor-pointer text-white hover:scale-105 transition duration-300'} 
              >
                Login
              </button>
          </Link>}
      </div>
      
    </div>
  )
}

export default NavTab
