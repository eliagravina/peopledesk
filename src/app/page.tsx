import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verifica ruolo e reindirizza alla dashboard corretta
  const { data: utente } = await supabase
    .from('utenti')
    .select('ruolo, primo_accesso')
    .eq('id', user.id)
    .single()

  if (!utente) redirect('/auth/login')
  if (utente.primo_accesso) redirect('/auth/cambia-password')
  if (utente.ruolo === 'hr') redirect('/dashboard/hr')

  redirect('/dashboard/worker')
}
