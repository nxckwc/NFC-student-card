'use client'
import React, { useEffect, useState } from 'react'
import { usePathname } from "next/navigation";
import  Link  from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import axios from 'axios';
import { CalendarDays, ChartNoAxesColumn, Languages, LayoutDashboard, UserCog, UserRound } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '');

const Navbar = () => {
  const pathname = usePathname();
  const isLoginRoute = pathname.endsWith('/login');
  const isDashboardRoute = pathname.endsWith('/dashboard');
  const isScheduleRoute = pathname.endsWith('/schedule');
  const isAccountRoute = pathname.endsWith('/account');
  const isAdminRoute = /^\/(en|th)\/admin/.test(pathname);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 8 || currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsNavVisible(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [hash, setHash] = useState('');
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [pathname]);

  useEffect(() => {
    if (isLoginRoute) {
      setIsAdmin(false);
      return;
    }
    let isActive = true;
    axios
      .get<{ user: { role: string } }>(`${API_BASE_URL}/auth/session`, { withCredentials: true })
      .then(({ data }) => {
        if (isActive) setIsAdmin(data.user.role === 'ADMIN');
      })
      .catch(() => {
        if (isActive) setIsAdmin(false);
      });
    return () => {
      isActive = false;
    };
  }, [isLoginRoute]);

  const locale = useLocale();
  const t = useTranslations('nav');
  const nextLocale = locale === 'en' ? 'th' : 'en';
  const localizedPath = pathname.replace(/^\/(en|th)(?=\/|$)/, `/${nextLocale}`);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      active
        ? 'bg-surface-active font-semibold text-accent-foreground'
        : 'font-medium text-text-nav hover:bg-surface-hover'
    }`;

  return (
    <>
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-xl transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href={`/${locale}${isLoginRoute ? '/login' : '/dashboard'}`} className="flex min-w-0 items-center gap-2.5" aria-label={t('home')}>
          <Image src="/images-removebg-preview (1) (1).png" alt="Prankrataipittayakom crest" width={40} height={40} className="size-10 object-contain" priority />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold text-text-primary">{t('school')}</div>
            <div className="text-[11px] text-text-muted">{t('product')}</div>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {!isLoginRoute && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <Link href={`/${locale}/dashboard`} className={navLinkClass(isDashboardRoute && !hash)}>
                <LayoutDashboard className="size-4" /> {t('overview')}
              </Link>
              <Link href={`/${locale}/schedule`} className={navLinkClass(isScheduleRoute)}>
                <CalendarDays className="size-4" /> {t('schedule')}
              </Link>
              <Link href={`/${locale}/dashboard#reports`} className={navLinkClass(isDashboardRoute && hash === '#reports')}>
                <ChartNoAxesColumn className="size-4" /> {t('reports')}
              </Link>
              <Link href={`/${locale}/account`} className={navLinkClass(isAccountRoute)}>
                <UserRound className="size-4" /> {t('account')}
              </Link>
              {isAdmin && (
                <Link href={`/${locale}/admin`} className={navLinkClass(isAdminRoute)}>
                  <UserCog className="size-4" /> {t('admin')}
                </Link>
              )}
            </nav>
          )}

          <Link
            href={localizedPath}
            replace
            scroll={false}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-border-strong hover:bg-surface-subtle"
            aria-label={t('language')}
            title={t('language')}
          >
            <Languages className="size-4 text-danger-accent" />
            {nextLocale.toUpperCase()}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
    {!isLoginRoute && <BottomNav isAdmin={isAdmin} isDashboardRoute={isDashboardRoute} isScheduleRoute={isScheduleRoute} isAccountRoute={isAccountRoute} isAdminRoute={isAdminRoute} hash={hash} />}
    </>
  )
}

const BottomNav = ({
  isAdmin,
  isDashboardRoute,
  isScheduleRoute,
  isAccountRoute,
  isAdminRoute,
  hash,
}: {
  isAdmin: boolean
  isDashboardRoute: boolean
  isScheduleRoute: boolean
  isAccountRoute: boolean
  isAdminRoute: boolean
  hash: string
}) => {
  const locale = useLocale()
  const t = useTranslations('nav')

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] transition ${
      active
        ? 'bg-surface-active font-semibold text-accent-foreground'
        : 'font-medium text-text-nav hover:bg-surface-hover'
    }`

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-2 py-1.5">
        <Link href={`/${locale}/dashboard`} className={itemClass(isDashboardRoute && !hash)} aria-current={isDashboardRoute && !hash ? 'page' : undefined}>
          <LayoutDashboard className="size-5" />
          {t('overview')}
        </Link>
        <Link href={`/${locale}/schedule`} className={itemClass(isScheduleRoute)} aria-current={isScheduleRoute ? 'page' : undefined}>
          <CalendarDays className="size-5" />
          {t('schedule')}
        </Link>
        <Link href={`/${locale}/dashboard#reports`} className={itemClass(isDashboardRoute && hash === '#reports')} aria-current={isDashboardRoute && hash === '#reports' ? 'page' : undefined}>
          <ChartNoAxesColumn className="size-5" />
          {t('reports')}
        </Link>
        <Link href={`/${locale}/account`} className={itemClass(isAccountRoute)} aria-current={isAccountRoute ? 'page' : undefined}>
          <UserRound className="size-5" />
            {t('account')}
        </Link>
        {isAdmin && (
          <Link href={`/${locale}/admin`} className={itemClass(isAdminRoute)} aria-current={isAdminRoute ? 'page' : undefined}>
            <UserCog className="size-5" />
            {t('admin')}
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
