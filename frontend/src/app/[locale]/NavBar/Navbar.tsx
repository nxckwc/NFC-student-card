'use client'
import React from 'react'
import { usePathname } from "next/navigation";
import  Link  from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { CalendarDays, ChartNoAxesColumn, Languages, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  const isLoginRoute = pathname.endsWith('/login');

  const locale = useLocale();
  const t = useTranslations('nav');
  const nextLocale = locale === 'en' ? 'th' : 'en';
  const localizedPath = pathname.replace(/^\/(en|th)(?=\/|$)/, `/${nextLocale}`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dce5de] bg-[#fbfdfb]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href={`/${locale}${isLoginRoute ? '/login' : '/dashboard'}`} className="flex min-w-0 items-center gap-2.5" aria-label={t('home')}>
          <Image src="/images-removebg-preview (1) (1).png" alt="Prankrataipittayakom crest" width={40} height={40} className="size-10 object-contain" priority />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold text-[#26332e]">{t('school')}</div>
            <div className="text-[11px] text-[#748078]">{t('product')}</div>
          </div>
        </Link>

        {!isLoginRoute && (
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 rounded-lg bg-[#e7f0eb] px-3 py-2 text-sm font-semibold text-[#356b5c]">
              <LayoutDashboard className="size-4" /> {t('overview')}
            </Link>
            <Link href={`/${locale}/dashboard#schedule`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#68756d] transition hover:bg-[#edf2ee]">
              <CalendarDays className="size-4" /> {t('schedule')}
            </Link>
            <Link href={`/${locale}/dashboard#reports`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#68756d] transition hover:bg-[#edf2ee]">
              <ChartNoAxesColumn className="size-4" /> {t('reports')}
            </Link>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href={localizedPath}
            replace
            scroll={false}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#dce5de] bg-white px-3 text-xs font-bold text-[#526159] transition hover:border-[#b9cbc0] hover:bg-[#f1f6f2]"
            aria-label={t('language')}
            title={t('language')}
          >
            <Languages className="size-4 text-[#d46a5f]" />
            {nextLocale.toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
