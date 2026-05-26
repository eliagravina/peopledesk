'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginConEmail } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [ricordami, setRicordami] = useState(false)
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PeopleDesk'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setErrore('Inserisci email e password.'); return }
    setLoading(true); setErrore('')
    try {
      await loginConEmail(email, password)
      if (ricordami) localStorage.setItem('pd-email', email)
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
      setErrore(msg.includes('Invalid') ? 'Credenziali non valide. Riprova.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      {/* Grid decorativo */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(42,92,69,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(42,92,69,0.04) 1px,transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

      <div className="animate-slideUp w-full max-w-md mx-4 bg-[var(--surface)] rounded-[var(--r-xl)] p-10 shadow-[var(--shadow-lg)] border border-[var(--border2)] relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <i className="ti ti-building-community text-white text-lg" />
          </div>
          <span className="font-serif text-2xl text-[var(--text)]">{appName}</span>
        </div>

        <h1 className="text-xl font-semibold text-[var(--text)] mb-1">Bentornato</h1>
        <p className="text-sm text-[var(--text3)] mb-7">Accedi al portale HR della tua azienda</p>

        {errore && (
          <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-5 text-sm"
            style={{ background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #DFA0A0' }}>
            <i className="ti ti-alert-circle text-base flex-shrink-0 mt-0.5" />
            {errore}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Email aziendale</label>
            <input
              type="email" autoComplete="username"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-colors"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text2)]">
                <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'} text-base`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="ricordami" checked={ricordami}
              onChange={e => setRicordami(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[var(--accent)]" />
            <label htmlFor="ricordami" className="text-sm text-[var(--text2)] cursor-pointer">
              Ricordami su questo dispositivo
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-[var(--r-sm)] text-white text-sm font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}>
            {loading
              ? <><i className="ti ti-loader-2 animate-spin text-base" />Accesso in corso...</>
              : <><i className="ti ti-login text-base" />Accedi</>
            }
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text3)]">oppure</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <p className="text-center text-sm text-[var(--text2)]">
          Non hai un account?{' '}
          <Link href="/auth/registrati" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            Registrati come dipendente
          </Link>
        </p>
      </div>
    </div>
  )
}
