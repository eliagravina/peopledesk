'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cambiaPassword } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

export default function CambiaPasswordPage() {
  const router = useRouter()
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PeopleDesk'

  function strength(p: string) {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.length < 8) { setErrore('Almeno 8 caratteri.'); return }
    if (pwd !== pwd2) { setErrore('Le password non coincidono.'); return }
    setLoading(true); setErrore('')
    try {
      await cambiaPassword(pwd)
      // Segna primo_accesso = false
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('utenti').update({ primo_accesso: false }).eq('id', user.id)
      }
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setErrore(err instanceof Error ? err.message : 'Errore durante il cambio password')
    } finally {
      setLoading(false)
    }
  }

  const s = strength(pwd)
  const sColor = ['', '#9B3232', '#B07D2C', '#2A5C45', '#2A5C45'][s]
  const sLabel = ['', 'Debole', 'Discreta', 'Buona', 'Ottima'][s]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(42,92,69,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(42,92,69,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="animate-slideUp w-full max-w-md mx-4 bg-[var(--surface)] rounded-[var(--r-xl)] p-10 shadow-[var(--shadow-lg)] border border-[var(--border2)] relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <i className="ti ti-building-community text-white text-lg" />
          </div>
          <span className="font-serif text-2xl">{appName}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ background: 'var(--amber-lt)', color: 'var(--amber)', border: '1px solid #E0BF80' }}>
          <i className="ti ti-shield-check text-sm" />Primo accesso rilevato
        </div>

        <h1 className="text-xl font-semibold mb-1">Imposta la tua password</h1>
        <p className="text-sm text-[var(--text3)] mb-5">Per sicurezza devi cambiare la password temporanea assegnata.</p>

        <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-5 text-sm"
          style={{ background: 'var(--amber-lt)', color: 'var(--amber)', border: '1px solid #E8C88A' }}>
          <i className="ti ti-lock text-base flex-shrink-0 mt-0.5" />
          Non potrai accedere finché non imposti una password personale.
        </div>

        {errore && (
          <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-4 text-sm"
            style={{ background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #DFA0A0' }}>
            <i className="ti ti-alert-circle text-base flex-shrink-0 mt-0.5" />{errore}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Nuova password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)}
                placeholder="Almeno 8 caratteri"
                className="w-full px-3 py-2.5 pr-10 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]">
                <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'} text-base`} />
              </button>
            </div>
            {pwd && (
              <div className="mt-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                      style={{ background: i <= s ? sColor : 'var(--border2)' }} />
                  ))}
                </div>
                <div className="text-xs mt-0.5" style={{ color: sColor }}>{sLabel}</div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Conferma nuova password</label>
            <input type="password" value={pwd2} onChange={e => setPwd2(e.target.value)}
              placeholder="Ripeti la password"
              className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-[var(--r-sm)] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}>
            {loading
              ? <><i className="ti ti-loader-2 animate-spin" />Salvataggio...</>
              : <><i className="ti ti-lock-open" />Salva e accedi</>}
          </button>
        </form>
      </div>
    </div>
  )
}
