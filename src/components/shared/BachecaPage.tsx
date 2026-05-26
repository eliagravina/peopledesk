'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getBacheca, creaPost, aggiornaPost, eliminaPost } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { PostBacheca, CategoriaBacheca } from '@/types'

const CAT_CFG: Record<CategoriaBacheca | 'tutti', { icon: string; color: string; label: string; bg: string }> = {
  tutti:         { icon: 'ti-layout-list', color: 'var(--text2)',  label: 'Tutti',        bg: 'var(--surface2)' },
  comunicazione: { icon: 'ti-speakerphone', color: 'var(--blue)',  label: 'Comunicazione', bg: 'var(--blue-lt)'  },
  chiusura:      { icon: 'ti-building-off', color: 'var(--red)',   label: 'Chiusura',      bg: 'var(--red-lt)'   },
  documento:     { icon: 'ti-file-text',    color: 'var(--gold)',  label: 'Documento',     bg: 'var(--gold-lt)'  },
  evento:        { icon: 'ti-confetti',     color: 'var(--accent)',label: 'Evento',        bg: 'var(--accent-lt)'},
}

const STRIPE_COLORS: Record<CategoriaBacheca, string> = {
  comunicazione: 'var(--blue)', chiusura: 'var(--red)',
  documento: 'var(--gold)', evento: 'var(--accent)',
}

export default function BachecaPage({ isHR = false }: { isHR?: boolean }) {
  const { utente } = useAuth()
  const [posts, setPosts] = useState<PostBacheca[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<CategoriaBacheca | 'tutti'>('tutti')
  const [showModal, setShowModal] = useState(false)
  const [editPost, setEditPost] = useState<PostBacheca | null>(null)
  const [form, setForm] = useState({ categoria: 'comunicazione' as CategoriaBacheca, titolo: '', corpo: '', data_evento: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setPosts(await getBacheca()) }
    finally { setLoading(false) }
  }

  function openNew() {
    setEditPost(null)
    setForm({ categoria: 'comunicazione', titolo: '', corpo: '', data_evento: '' })
    setShowModal(true)
  }

  function openEdit(p: PostBacheca) {
    setEditPost(p)
    setForm({ categoria: p.categoria, titolo: p.titolo, corpo: p.corpo, data_evento: p.data_evento || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titolo || !form.corpo) return
    setSaving(true)
    try {
      if (editPost) {
        await aggiornaPost(editPost.id, form)
      } else {
        await creaPost({ ...form, data_evento: form.data_evento || undefined })
      }
      setShowModal(false)
      load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo post?')) return
    await eliminaPost(id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const counts: Record<string, number> = { tutti: posts.length }
  posts.forEach(p => { counts[p.categoria] = (counts[p.categoria] || 0) + 1 })

  const filtered = filtro === 'tutti' ? posts : posts.filter(p => p.cat === filtro || p.categoria === filtro)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader
        title="Bacheca aziendale"
        subtitle="Comunicazioni, chiusure e documenti"
        action={isHR ? (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <i className="ti ti-plus text-sm" />Nuovo post
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Filtri card-style */}
        <div className="flex gap-2 flex-wrap mb-5">
          {(Object.keys(CAT_CFG) as (CategoriaBacheca | 'tutti')[]).map(k => {
            const cfg = CAT_CFG[k]
            const active = filtro === k
            const count = counts[k] || 0
            return (
              <button key={k} onClick={() => setFiltro(k)}
                className="relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-[var(--r-md)] border-[1.5px] transition-all"
                style={{
                  borderColor: active ? cfg.color : 'var(--border2)',
                  background: active ? cfg.color : 'var(--surface)',
                  minWidth: '68px',
                }}>
                {count > 0 && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : cfg.bg, color: active ? '#fff' : cfg.color }}>
                    {count}
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: active ? 'rgba(255,255,255,0.2)' : cfg.bg }}>
                  <i className={`ti ${cfg.icon} text-base`} style={{ color: active ? '#fff' : cfg.color }} />
                </div>
                <span className="text-[10.5px] font-medium whitespace-nowrap"
                  style={{ color: active ? '#fff' : 'var(--text2)' }}>
                  {cfg.label}
                </span>
              </button>
            )
          })}
        </div>

        {loading && <div className="flex justify-center py-16"><i className="ti ti-loader-2 animate-spin text-2xl text-[var(--text3)]" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <i className="ti ti-news text-3xl text-[var(--text3)] opacity-40 block mb-2" />
            <p className="text-sm text-[var(--text3)]">Nessun post in questa categoria</p>
          </div>
        )}

        <div className="space-y-3 max-w-2xl">
          {filtered.map(p => {
            const cat = (p.categoria || (p as { cat?: CategoriaBacheca }).cat || 'comunicazione') as CategoriaBacheca
            const cfg = CAT_CFG[cat] || CAT_CFG.comunicazione
            const stripeColor = STRIPE_COLORS[cat] || cfg.color
            const authorName = p.autore ? `${p.autore.nome} ${p.autore.cognome}` : 'HR'
            const authorInit = p.autore ? `${p.autore.nome[0]}${p.autore.cognome[0]}` : 'HR'
            const dataStr = p.data_evento
              ? new Date(p.data_evento).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
              : null
            const ts = new Date(p.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={p.id} className="flex border rounded-[var(--r-md)] overflow-hidden transition-all hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="w-1 shrink-0" style={{ background: stripeColor }} />
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      <i className={`ti ${cfg.icon} text-xs`} />{cfg.label}
                    </span>
                    {dataStr && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border"
                        style={{ background: 'var(--surface2)', color: 'var(--text3)', borderColor: 'var(--border)' }}>
                        <i className="ti ti-calendar-event text-xs" />{dataStr}
                      </span>
                    )}
                    {isHR && (
                      <div className="ml-auto flex gap-1">
                        <button onClick={() => openEdit(p)}
                          className="w-7 h-7 rounded-[var(--r-sm)] border flex items-center justify-center transition-colors hover:bg-[var(--surface2)]"
                          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                          <i className="ti ti-pencil text-sm" />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="w-7 h-7 rounded-[var(--r-sm)] border flex items-center justify-center transition-colors hover:bg-[var(--red-lt)]"
                          style={{ borderColor: 'var(--border2)', color: 'var(--red)' }}>
                          <i className="ti ti-trash text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{p.titolo}</h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text2)' }}>{p.corpo}</p>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
                      <div className={`av w-5 h-5 text-[8px] ${p.autore?.av_cls || 'av-teal'}`}>{authorInit}</div>
                      {authorName}
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{ts}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal nuovo/modifica post */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--r-xl)] p-8 shadow-[var(--shadow-lg)] border border-[var(--border2)] animate-slideUp">
            <h2 className="text-lg font-semibold mb-1">{editPost ? 'Modifica post' : 'Nuovo post bacheca'}</h2>
            <p className="text-xs text-[var(--text3)] mb-5">Il post sarà visibile a tutti i dipendenti</p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--text2)] mb-2">Categoria</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(CAT_CFG).filter(k => k !== 'tutti') as CategoriaBacheca[]).map(k => {
                  const cfg = CAT_CFG[k]
                  const sel = form.categoria === k
                  return (
                    <button key={k} onClick={() => setForm(f => ({ ...f, categoria: k }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border-[1.5px] transition-all"
                      style={{ borderColor: sel ? cfg.color : 'var(--border2)', background: sel ? `${cfg.color}18` : 'var(--surface)', color: sel ? cfg.color : 'var(--text2)' }}>
                      <i className={`ti ${cfg.icon} text-xs`} />{cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Titolo *</label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }}
                  placeholder="es. Chiusura aziendale 15 agosto" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Contenuto *</label>
                <textarea value={form.corpo} onChange={e => setForm(f => ({ ...f, corpo: e.target.value }))} rows={4}
                  className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border text-sm resize-y focus:outline-none focus:border-[var(--accent)] transition-colors"
                  style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }}
                  placeholder="Testo del comunicato..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Data evento (opzionale)</label>
                <input type="date" value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving || !form.titolo || !form.corpo}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--r-sm)] text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {saving ? <><i className="ti ti-loader-2 animate-spin" />Salvataggio...</> : <><i className="ti ti-send" />Pubblica</>}
              </button>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-[var(--r-sm)] text-sm border"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface)' }}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
