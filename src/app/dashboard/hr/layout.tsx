import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

const hrNav = [
  { href: '/dashboard/hr',            icon: 'ti-calendar-month', label: 'Calendario' },
  { href: '/dashboard/hr/richieste',  icon: 'ti-bell',           label: 'Richieste',   badgeColor: 'bg-red-500' },
  { href: '/dashboard/hr/convoca',    icon: 'ti-user-plus',      label: 'Convoca' },
  { href: '/dashboard/hr/incontri',   icon: 'ti-calendar-event', label: 'Incontri',    badgeColor: 'bg-yellow-500' },
  { href: '/dashboard/hr/dipendenti', icon: 'ti-users',          label: 'Dipendenti',  badgeColor: 'bg-blue-500' },
  { href: '/dashboard/hr/bacheca',    icon: 'ti-news',           label: 'Bacheca' },
  { href: '/dashboard/hr/timbrature', icon: 'ti-fingerprint',    label: 'Timbrature' },
  { href: '/dashboard/hr/presenze',   icon: 'ti-table',          label: 'Foglio presenze' },
  { href: '/dashboard/hr/export',     icon: 'ti-file-spreadsheet', label: 'Esporta .xlsx' },
]

const hrBottom = [
  { href: '/dashboard/hr/profilo', icon: 'ti-user-circle', label: 'Il mio profilo' },
]

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Conta richieste pending per il badge
  const { count: pendingCount } = await supabase
    .from('richieste')
    .select('*', { count: 'exact', head: true })
    .eq('stato', 'pending')

  const { count: incontriCount } = await supabase
    .from('incontri')
    .select('*', { count: 'exact', head: true })
    .eq('concluso', false)

  const navWithBadges = hrNav.map(item => ({
    ...item,
    badge: item.href.includes('richieste') ? (pendingCount ?? 0)
         : item.href.includes('incontri')  ? (incontriCount ?? 0)
         : undefined
  }))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar navItems={navWithBadges} bottomItems={hrBottom} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
