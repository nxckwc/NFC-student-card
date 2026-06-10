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
    <div className={'fixed top-0 left-0 w-full z-50 backdrop-blur-sm border-b-gray-300/10 border'}>
        <div className={'flex min-h-10 min-w-full items-center justify-between p-2'}>
            <img src="/images-removebg-preview (1) (1).png" alt="icon" className={'h-12 w-12'} />
            
            <div className={'w-fit h-10 flex items-center justify-center text-white p-1 rounded-md gap-3'}>
              <div className={'flex-1 flex items-center justify-center gap-3'}>
                <Link href="/docs" className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>Docs</Link>
                <Link href="/about" className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>About</Link>
                <Link href="/contact" className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>Contact</Link>
              </div>
              
              <button className='px-3 py-1 rounded-2xl border border-white/20 text-sm flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition duration-300'
                onClick={toggleLocale}>
                  { locale === 'en' ? 'EN' : 'TH'}
              </button>
            </div>
        </div>
    </div>
  )
}

export default Navbar
