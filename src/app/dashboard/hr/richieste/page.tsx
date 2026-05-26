'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getRichieste, aggiornaStatoRichiesta } from '@/lib/api'
import type { Richiesta, TipoRichiesta } from '@/types'
import clsx from 'clsx'

const TIPO_CFG: Record<TipoRichiesta, { icon: string; color: string; label: string; bg: string }> = {
  ferie:    { icon: 'ti-tree',        color: 'var(--accent)', label: 'Ferie',    bg: 'var(--accent-lt)' },
  malattia: { icon: 'ti-virus',       color: 'var(--red)',    label: 'Malattia', bg: 'var(--red-lt)'    },
  permesso: { icon: 'ti-clock-pause', color: 'var(--amber)',  label: 'Permesso', bg: 'var(--amber-lt)'  },
}

const AV_COLORS = ['av-blue', 'av-coral', 'av-amber', 'av-purple', 'av-green']
type Filtro = 'tutti' | 'pending' | TipoRichiesta

export default function RichiesteHRPage() {
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('tutti')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setRichieste(await getRichieste()) }
    finally { setLoading(false) }
  }

  async function handleApprova(id: string, ok: boolean) {
    setProcessingId(id)
    try {
      await aggiornaStatoRichiesta(id, ok ? 'approvato' : 'rifiutato')
      setRichieste(prev => prev.map(r => r.id === id ? { ...r, stato: ok ? 'approvato' : 'rifiutato' } : r))
    } finally { setProcessingId(null) }
  }

  const pending = richieste.filter(r => r.stato === 'pending').length

  const filtered = richieste.filter(r => {
    if (filtro === 'tutti') return true
    if (filtro === 'pending') return r.stato === 'pending'
    return r.tipo === filtro
  })

  const filtri: { k: Filtro; label: string; icon: string; count?: number }[] = [
    { k: 'tutti',    label: 'Tutte',    icon: 'ti-list',        count: richieste.length },
    { k: 'pending',  label: 'In attesa', icon: 'ti-clock',      count: pending },
    { k: 'ferie',    label: 'Ferie',    icon: 'ti-tree' },
    { k: 'malattia', label: 'Malattia', icon: 'ti-virus' },
    { k: 'permesso', label: 'Permessi', icon: 'ti-clock-pause' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader
        title="Richieste"
        subtitle={`${pending} in attesa di approvazione`}
      />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Filtri */}
        <div className="flex gap-2 flex-wrap mb-5">
          {filtri.map(f => (
            <button key={f.k} onClick={() => setFiltro(f.k)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all',
                filtro === f.k
                  ? 'text-white border-transparent'
                  : 'border-[var(--border2)] bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--surface2)]'
              )}
              style={filtro === f.k ? { background: 'var(--text)' } : {}}>
              <i className={`ti ${f.icon} text-sm`} />
              {f.label}
              {f.count !== undefined && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filtro === f.k ? 'bg-white/20 text-white' : 'bg-[var(--amber-lt)] text-[var(--amber)]'
                )}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <i className="ti ti-loader-2 animate-spin text-2xl text-[var(--text3)]" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <i className="ti ti-inbox text-4xl text-[var(--text3)] opacity-40 block mb-2" />
            <p className="text-sm text-[var(--text3)]">Nessuna richiesta in questa categoria</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((r, i) => {
            const cfg = TIPO_CFG[r.tipo]
            const avCls = AV_COLORS[i % AV_COLORS.length]
            const processing = processingId === r.id
            const nomeCompleto = r.utente ? `${r.utente.nome} ${r.utente.cognome}` : 'Dipendente'
            const initials = r.utente
              ? (r.utente.nome[0] + r.utente.cognome[0]).toUpperCase()
              : '??'

            return (
              <div key={r.id} className="border rounded-[var(--r-md)] overflow-hidden"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

                {/* Barra tipo */}
                <div className="flex items-center gap-2 px-4 py-2 text-sm"
                  style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}>
                  <i className={`ti ${cfg.icon} text-sm`} style={{ color: cfg.color }} />
                  <span className="font-semibold text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className={clsx(
                    'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    r.stato === 'pending'   ? 'bg-[var(--amber-lt)] text-[var(--amber)]' :
                    r.stato === 'approvato' ? 'bg-[var(--accent-lt)] text-[var(--accent)]' :
                                             'bg-[var(--surface2)] text-[var(--text3)]'
                  )}>
                    {r.stato === 'pending' ? 'In attesa' : r.stato === 'approvato' ? 'Approvato' : 'Rifiutato'}
                  </span>
                </div>

                {/* Corpo */}
                <div className="flex items-start gap-3 p-4 flex-wrap">
                  <div className={clsx('av w-9 h-9 text-xs shrink-0', avCls)}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{nomeCompleto}</div>
                    <div className="text-xs mt-0.5 text-[var(--text2)]">{r.dettaglio}</div>
                    {r.note && (
                      <div className="flex items-center gap-1.5 text-xs mt-1.5 text-[var(--text3)]">
                        <i className="ti ti-notes text-sm" />
                        <span>{r.note}</span>
                      </div>
                    )}
                  </div>
                  {r.stato === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprova(r.id, true)} disabled={processing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-medium text-white disabled:opacity-50 transition-colors"
                        style={{ background: 'var(--accent)' }}>
                        {processing ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-check" />}
                        Approva
                      </button>
                      <button onClick={() => handleApprova(r.id, false)} disabled={processing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-medium border disabled:opacity-50 transition-colors"
                        style={{ color: 'var(--red)', borderColor: 'var(--border2)', background: 'var(--surface)' }}>
                        <i className="ti ti-x" />
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
