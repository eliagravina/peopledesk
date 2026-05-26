import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

const workerNav = [
  { href: '/dashboard/worker/chat',         icon: 'ti-message-circle',  label: 'Chat HR' },
  { href: '/dashboard/worker/storico',      icon: 'ti-history',         label: 'Le mie richieste' },
  { href: '/dashboard/worker/notifiche',    icon: 'ti-bell-ringing',    label: 'Notifiche',     badgeColor: 'bg-red-500' },
  { href: '/dashboard/worker/appuntamenti', icon: 'ti-calendar-time',   label: 'Appuntamenti' },
  { href: '/dashboard/worker/timbra',       icon: 'ti-wifi',            label: 'Timbra NFC' },
  { href: '/dashboard/worker/bacheca',      icon: 'ti-news',            label: 'Bacheca' },
]

const workerBottom = [
  { href: '/dashboard/worker/profilo', icon: 'ti-user-circle', label: 'Il mio profilo' },
]

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { count: unreadCount } = await supabase
    .from('notifiche')
    .select('*', { count: 'exact', head: true })
    .eq('destinatario_id', user.id)
    .eq('letta', false)

  const navWithBadges = workerNav.map(item => ({
    ...item,
    badge: item.href.includes('notifiche') ? (unreadCount ?? 0) : undefined
  }))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar navItems={navWithBadges} bottomItems={workerBottom} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
