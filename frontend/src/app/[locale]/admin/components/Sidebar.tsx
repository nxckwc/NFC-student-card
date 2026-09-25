"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Activity, ChevronDown, FlaskConical, GraduationCap, LayoutDashboard, Nfc, Settings, Users } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (pathname: string) => boolean
}

const AdminNav = ({ variant, username }: { variant: 'sidebar' | 'mobile'; username?: string }) => {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('admin')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const items: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: t('nav.overview'),
      icon: <LayoutDashboard className="size-4" />,
      isActive: (path) => path === `/${locale}/admin`,
    },
    {
      href: `/${locale}/admin/accounts`,
      label: t('accounts'),
      icon: <Users className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/accounts`),
    },
    {
      href: `/${locale}/admin/students`,
      label: t('students'),
      icon: <GraduationCap className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/students`),
    },
    {
      href: `/${locale}/admin/activity`,
      label: t('logs'),
      icon: <Activity className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/activity`),
    },
    {
      href: `/${locale}/admin/reader`,
      label: t('nav.reader'),
      icon: <Nfc className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/reader`),
    },
    {
      href: `/${locale}/admin/test`,
      label: t('nav.apiTest'),
      icon: <FlaskConical className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/test`),
    },
    {
      href: `/${locale}/admin/settings`,
      label: t('nav.settings'),
      icon: <Settings className="size-4" />,
      isActive: (path) => path.startsWith(`/${locale}/admin/settings`),
    },
  ]

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
      active
        ? 'bg-surface-active font-bold text-accent-foreground'
        : 'font-medium text-text-nav hover:bg-surface-hover hover:text-accent-foreground'
    }`

  if (variant === 'mobile') {
    const activeItem = items.find((item) => item.isActive(pathname)) ?? items[0]

    return (
      <>
        <nav className="mb-6 hidden gap-1 overflow-x-auto rounded-lg border border-border bg-surface/85 p-1 min-[820px]:flex" aria-label={t('nav.overview')}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-bold sm:text-sm ${item.isActive(pathname) ? 'bg-accent text-white' : 'text-text-nav hover:bg-surface-chip'}`}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="relative mb-6 min-[820px]:hidden" aria-label={t('nav.overview')}>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface/90 px-3 py-2.5 text-sm font-bold text-text-primary shadow-sm"
            aria-expanded={isMobileMenuOpen}
            aria-controls="admin-mobile-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-white">{activeItem.icon}</span>
              <span className="truncate">{activeItem.label}</span>
            </span>
            <ChevronDown className={`size-4 shrink-0 text-text-nav transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileMenuOpen && (
            <div id="admin-mobile-menu" className="absolute inset-x-0 top-full z-20 mt-2 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
              {items.map((item) => {
                const active = item.isActive(pathname)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex min-h-11 items-center gap-2 rounded-md px-2.5 py-2 text-xs font-bold ${active ? 'bg-accent text-white' : 'text-text-nav hover:bg-surface-chip'}`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>
      </>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <nav className="flex flex-col gap-1 px-3" aria-label={t('navSection')}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`${linkClass(item.isActive(pathname))} ${item.href.endsWith('/activity') ? 'mb-2' : ''}`} aria-current={item.isActive(pathname) ? 'page' : undefined}>
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export const AdminSidebar = ({ username }: { username?: string }) => (
  <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/50 lg:block">
    <div className="sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col pt-5">
      <AdminNav variant="sidebar" username={username} />
    </div>
  </aside>
)

export const AdminMobileNav = () => <div className="lg:hidden"><AdminNav variant="mobile" /></div>
