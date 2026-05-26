'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registraDipendente } from '@/lib/api'

export default function RegistratiPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', reparto: '', password: '', password2: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PeopleDesk'

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function pwdStrength(p: string) {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.cognome || !form.email || !form.reparto || !form.password) {
      setErrore('Compila tutti i campi.'); return
    }
    if (form.password.length < 8) { setErrore('Password di almeno 8 caratteri.'); return }
    if (form.password !== form.password2) { setErrore('Le password non coincidono.'); return }
    setLoading(true); setErrore('')
    try {
      await registraDipendente(form)
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setErrore(err instanceof Error ? err.message : 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  const strength = pwdStrength(form.password)
  const strengthColor = ['', '#9B3232', '#B07D2C', '#2A5C45', '#2A5C45'][strength] || ''
  const strengthLabel = ['', 'Debole', 'Discreta', 'Buona', 'Ottima'][strength] || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(42,92,69,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(42,92,69,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="animate-slideUp w-full max-w-md mx-4 bg-[var(--surface)] rounded-[var(--r-xl)] p-10 shadow-[var(--shadow-lg)] border border-[var(--border2)] relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <i className="ti ti-building-community text-white text-lg" />
          </div>
          <span className="font-serif text-2xl text-[var(--text)]">{appName}</span>
        </div>

        <h1 className="text-xl font-semibold text-[var(--text)] mb-1">Crea il tuo profilo</h1>
        <p className="text-sm text-[var(--text3)] mb-7">Registrati come dipendente per accedere al portale</p>

        {/* Ruolo locked */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="p-3 border-2 rounded-[var(--r-md)] text-center cursor-pointer"
            style={{ borderColor: 'var(--accent)', background: 'var(--accent-lt)' }}>
            <i className="ti ti-user text-xl block mb-1" style={{ color: 'var(--accent)' }} />
            <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Dipendente</div>
            <div className="text-xs" style={{ color: 'var(--text3)' }}>Accesso standard</div>
          </div>
          <div className="p-3 border rounded-[var(--r-md)] text-center opacity-40 cursor-not-allowed">
            <i className="ti ti-shield-lock text-xl block mb-1 text-[var(--text3)]" />
            <div className="text-xs font-semibold text-[var(--text2)]">Responsabile HR</div>
            <div className="text-xs text-[var(--text3)]">Solo su invito</div>
          </div>
        </div>

        {errore && (
          <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-5 text-sm"
            style={{ background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #DFA0A0' }}>
            <i className="ti ti-alert-circle text-base flex-shrink-0 mt-0.5" />{errore}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['nome', 'cognome'].map(k => (
              <div key={k}>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5 capitalize">{k}</label>
                <input type="text" value={form[k as keyof typeof form]} onChange={set(k)}
                  placeholder={k === 'nome' ? 'Mario' : 'Rossi'}
                  className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Email aziendale</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="mario.rossi@azienda.it"
              className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Reparto / Ruolo</label>
            <input type="text" value={form.reparto} onChange={set('reparto')}
              placeholder="es. Magazzino, IT, Contabilità..."
              className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Almeno 8 caratteri"
                className="w-full px-3 py-2.5 pr-10 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]">
                <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'} text-base`} />
              </button>
            </div>
            {form.password && (
              <div className="mt-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                      style={{ background: i <= strength ? strengthColor : 'var(--border2)' }} />
                  ))}
                </div>
                <div className="text-xs mt-0.5" style={{ color: strengthColor }}>{strengthLabel}</div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Conferma password</label>
            <input type="password" value={form.password2} onChange={set('password2')}
              placeholder="Ripeti la password"
              className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-[var(--r-sm)] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}>
            {loading
              ? <><i className="ti ti-loader-2 animate-spin" />Creazione in corso...</>
              : <><i className="ti ti-user-plus" />Crea profilo</>}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text2)] mt-5">
          Hai già un account?{' '}
          <Link href="/auth/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Accedi</Link>
        </p>
      </div>
    </div>
  )
}
