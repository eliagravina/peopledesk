'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: number
  badgeColor?: string
}

interface SidebarProps {
  navItems: NavItem[]
  bottomItems?: NavItem[]
}

export function Sidebar({ navItems, bottomItems }: SidebarProps) {
  const { utente, logout } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PeopleDesk'

  return (
    <>
      {/* Mobile overlay */}
      <div className={clsx('fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity',
        collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )} onClick={() => setCollapsed(true)} />

      {/* Sidebar */}
      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200',
        'w-[230px] shrink-0',
        collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
      )} style={{ background: 'var(--text)' }}>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)' }}>
              <i className="ti ti-building-community text-white text-sm" />
            </div>
            <span className="font-serif text-[17px] text-white">{appName}</span>
          </div>
          <div className="text-[10px] mt-1 opacity-30 text-white">Portale aziendale interno</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all',
                  active
                    ? 'bg-white/11 text-white font-medium'
                    : 'text-white/55 hover:bg-white/7 hover:text-white/85'
                )}>
                <i className={`ti ${item.icon} text-[15px]`} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={clsx(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white',
                    item.badgeColor || 'bg-red-500'
                  )}>{item.badge}</span>
                )}
              </Link>
            )
          })}

          {bottomItems && bottomItems.length > 0 && (
            <>
              <div className="h-px bg-white/8 my-2" />
              {bottomItems.map(item => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all',
                      active ? 'bg-white/11 text-white font-medium' : 'text-white/55 hover:bg-white/7 hover:text-white/85'
                    )}>
                    <i className={`ti ${item.icon} text-[15px]`} />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User panel */}
        <div className="border-t border-white/8">
          <div className="flex items-center gap-2.5 px-3 py-3">
            <div className={clsx('av w-8 h-8 text-[11px]', utente?.av_cls || 'av-teal')}>
              {utente?.av_init || '??'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate">
                {utente?.nome} {utente?.cognome}
              </div>
              <div className="text-[10px] opacity-35 text-white truncate">
                {utente?.ruolo === 'hr' ? 'Responsabile HR' : utente?.reparto}
              </div>
            </div>
            <button onClick={logout} title="Esci"
              className="w-7 h-7 rounded-md border border-white/12 flex items-center justify-center hover:bg-white/10 transition-colors">
              <i className="ti ti-logout text-[13px] text-white/50" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="fixed bottom-4 left-4 z-40 md:hidden w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ background: 'var(--accent)' }}>
        <i className={`ti ${collapsed ? 'ti-menu-2' : 'ti-x'} text-lg`} />
      </button>
    </>
  )
}
