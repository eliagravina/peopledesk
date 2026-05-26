'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getDipendenti, aggiornaUtente, eliminaUtente } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import type { Utente } from '@/types'

const AV_COLORS = ['av-blue','av-coral','av-amber','av-purple','av-green']

export default function DipendentiPage() {
  const [dips, setDips] = useState<Utente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDel, setShowDel] = useState<Utente | null>(null)
  const [editDip, setEditDip] = useState<Utente | null>(null)
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', reparto: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setDips(await getDipendenti()) }
    finally { setLoading(false) }
  }

  function openNew() {
    setEditDip(null)
    setForm({ nome: '', cognome: '', email: '', reparto: '', password: '' })
    setErrore('')
    setShowModal(true)
  }

  function openEdit(d: Utente) {
    setEditDip(d)
    setForm({ nome: d.nome, cognome: d.cognome, email: d.email, reparto: d.reparto, password: '' })
    setErrore('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nome || !form.cognome || !form.email || !form.reparto) { setErrore('Compila tutti i campi.'); return }
    setSaving(true); setErrore('')
    try {
      if (editDip) {
        const avInit = (form.nome[0] + form.cognome[0]).toUpperCase()
        await aggiornaUtente(editDip.id, { nome: form.nome, cognome: form.cognome, email: form.email, reparto: form.reparto, av_init: avInit })
      } else {
        if (form.password.length < 8) { setErrore('Password di almeno 8 caratteri.'); setSaving(false); return }
        const supabase = createClient()
        const avCls = AV_COLORS[dips.length % AV_COLORS.length]
        const avInit = (form.nome[0] + form.cognome[0]).toUpperCase()
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { nome: form.nome, cognome: form.cognome, reparto: form.reparto, ruolo: 'worker', av_cls: avCls, av_init: avInit } }
        })
        if (error) throw error
      }
      setShowModal(false)
      load()
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally { setSaving(false) }
  }

  async function handleDelete(d: Utente) {
    setSaving(true)
    try {
      await eliminaUtente(d.id)
      setShowDel(null)
      load()
    } finally { setSaving(false) }
  }

  const filtered = dips.filter(d => {
    const q = search.toLowerCase()
    return !q || `${d.nome} ${d.cognome} ${d.email} ${d.reparto}`.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="Gestione dipendenti" subtitle={`${dips.length} profili registrati`}
        action={
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <i className="ti ti-user-plus text-sm" />Aggiungi
          </button>
        } />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Search */}
        <div className="relative mb-4 max-w-xs">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)] text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca dipendente..."
            className="w-full pl-9 pr-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
        </div>

        {loading && <div className="flex justify-center py-16"><i className="ti ti-loader-2 animate-spin text-2xl text-[var(--text3)]" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <i className="ti ti-users text-4xl text-[var(--text3)] opacity-40 block mb-2" />
            <p className="text-sm text-[var(--text3)]">
              {dips.length === 0 ? 'Nessun dipendente registrato' : 'Nessun risultato per la ricerca'}
            </p>
          </div>
        )}

        <div className="border rounded-[var(--r-md)] overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {filtered.length > 0 && (
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  {['Dipendente','Email','Reparto','Azioni'].map((h, i) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text3)', textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    className="hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`av w-8 h-8 text-[11px] shrink-0 ${d.av_cls || AV_COLORS[i % AV_COLORS.length]}`}>
                          {d.av_init || (d.nome[0] + d.cognome[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{d.nome} {d.cognome}</div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                            MAT{String(i + 1).padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>{d.email}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text2)' }}>{d.reparto || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => openEdit(d)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--r-sm)] text-xs border transition-colors hover:bg-[var(--surface2)]"
                          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                          <i className="ti ti-pencil text-xs" />Modifica
                        </button>
                        <button onClick={() => setShowDel(d)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--r-sm)] text-xs border transition-colors hover:bg-[var(--red-lt)]"
                          style={{ borderColor: 'var(--border2)', color: 'var(--red)' }}>
                          <i className="ti ti-trash text-xs" />Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal aggiungi/modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--r-xl)] p-8 shadow-[var(--shadow-lg)] border border-[var(--border2)] animate-slideUp">
            <h2 className="text-lg font-semibold mb-1">{editDip ? 'Modifica dipendente' : 'Aggiungi dipendente'}</h2>
            <p className="text-xs text-[var(--text3)] mb-5">{editDip ? 'Modifica i dati del profilo' : 'Il dipendente potrà accedere con queste credenziali'}</p>
            {errore && <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-4 text-xs" style={{ background: 'var(--red-lt)', color: 'var(--red)' }}><i className="ti ti-alert-circle" />{errore}</div>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {['nome','cognome'].map(k => (
                <div key={k}>
                  <label className="block text-xs font-medium text-[var(--text2)] mb-1.5 capitalize">{k}</label>
                  <input value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                    style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-4">
              {[{ k: 'email', lbl: 'Email aziendale', type: 'email', readonly: !!editDip }, { k: 'reparto', lbl: 'Reparto / Ruolo', type: 'text', readonly: false }].map(({ k, lbl, type, readonly }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">{lbl}</label>
                  <input type={type} value={form[k as keyof typeof form]} readOnly={readonly}
                    onChange={e => !readonly && setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                    style={{ borderColor: 'var(--border2)', background: readonly ? 'var(--surface2)' : 'var(--surface2)', color: 'var(--text)', opacity: readonly ? 0.6 : 1 }} />
                </div>
              ))}
              {!editDip && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Password temporanea</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Almeno 8 caratteri"
                    className="w-full px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                    style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--r-sm)] text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {saving ? <><i className="ti ti-loader-2 animate-spin" />Salvataggio...</> : <><i className="ti ti-check" />{editDip ? 'Salva modifiche' : 'Aggiungi profilo'}</>}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-[var(--r-sm)] text-sm border" style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal elimina */}
      {showDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-[var(--r-xl)] p-8 shadow-[var(--shadow-lg)] border border-[var(--border2)] animate-slideUp">
            <h2 className="text-lg font-semibold mb-1">Elimina profilo</h2>
            <p className="text-xs text-[var(--text3)] mb-4">Questa azione è irreversibile.</p>
            <div className="flex items-start gap-2 p-3 rounded-[var(--r-sm)] mb-5 text-sm" style={{ background: 'var(--red-lt)', color: 'var(--red)' }}>
              <i className="ti ti-alert-triangle mt-0.5" />
              Stai per eliminare il profilo di <strong className="ml-1">{showDel.nome} {showDel.cognome}</strong>.
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(showDel)} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--r-sm)] text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--red)' }}>
                <i className="ti ti-trash" />Elimina definitivamente
              </button>
              <button onClick={() => setShowDel(null)} className="px-4 py-2.5 rounded-[var(--r-sm)] text-sm border" style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
