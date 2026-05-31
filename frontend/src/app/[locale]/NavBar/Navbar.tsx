'use client'
import React from 'react'
import { usePathname, useRouter } from "next/navigation";
import  Link  from 'next/link';
import { useLocale } from 'next-intl';

const Navbar = () => {
  const pathname = usePathname();
  const isLoginRoute = pathname.endsWith('/login');

  const router = useRouter();
  const locale = useLocale();
  
  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'th' : 'en'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <div className={'fixed top-0 left-0 w-full z-50 backdrop-blur-sm'}>
        <div className={'flex min-h-10 min-w-full items-center justify-between p-2'}>
            <img src="/images-removebg-preview (1) (1).png" alt="icon" className={'h-12 w-12'} />
            
            <div className={'w-fit h-10 flex items-center justify-center text-white p-1 rounded-md gap-1'}>
              <div className={'flex-1 flex items-center justify-center gap-2'}>
                <Link href="/docs" className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>Docs</Link>
                <Link href="/about" className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>About</Link>
              </div>
              {!isLoginRoute && <Link href="/login">
                    <button 
                      className={'w-fit h-fit flex items-center justify-center bg-red-500 p-2 rounded-md font-bold cursor-pointer text-white hover:scale-105 transition duration-300'} 
                    >
                      Login
                    </button>
                </Link>}
              <button className='px-2 py-1 rounded border border-white/20 text-sm'
                onClick={toggleLocale}>
                  { locale === 'en' ? 'TH' : 'EN'}
              </button>
            </div>
        </div>
    </div>
  )
}

export default Navbar
