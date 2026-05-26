'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Utente } from '@/types'

interface AuthContextType {
  utente: Utente | null
  loading: boolean
  logout: () => Promise<void>
  refreshUtente: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  utente: null,
  loading: true,
  logout: async () => {},
  refreshUtente: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchUtente(userId: string) {
    const { data } = await supabase
      .from('utenti')
      .select('*')
      .eq('id', userId)
      .single()
    setUtente(data)
  }

  async function refreshUtente() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await fetchUtente(user.id)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUtente(session.user.id)
        } else {
          setUtente(null)
        }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setUtente(null)
  }

  return (
    <AuthContext.Provider value={{ utente, loading, logout, refreshUtente }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
