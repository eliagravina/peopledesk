'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getMieiIncontri } from '@/lib/api'
import type { Incontro } from '@/types'

export default function AppuntamentiPage() {
  const [incontri, setIncontri] = useState<Incontro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    try { setIncontri(await getMieiIncontri()) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="I miei appuntamenti" subtitle="Fissi fino alla data dell'incontro" />
      <div className="flex-1 overflow-y-auto p-5">
        {loading && <div className="flex justify-center py-16"><i className="ti ti-loader-2 animate-spin text-2xl text-[var(--text3)]" /></div>}

        {!loading && incontri.length === 0 && (
          <div className="text-center py-16">
            <i className="ti ti-calendar-off text-4xl text-[var(--text3)] opacity-40 block mb-2" />
            <p className="text-sm text-[var(--text3)]">Nessun appuntamento in programma</p>
          </div>
        )}

        {incontri.length > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] text-sm"
            style={{ background: 'var(--amber-lt)', color: 'var(--amber)' }}>
            <i className="ti ti-pin text-base" />
            {incontri.length} appuntament{incontri.length === 1 ? 'o fisso' : 'i fissi'} fino alla data
          </div>
        )}

        <div className="space-y-3 max-w-2xl">
          {incontri.map(m => {
            const myPart = m.partecipanti?.find(() => true)
            const confermato = myPart?.confermato ?? false
            return (
              <div key={m.id} className="border-l-[3px] rounded-[var(--r-md)] p-4"
                style={{ borderLeftColor: 'var(--accent)', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid var(--accent)` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-sm">{m.titolo}</h3>
                  <span className={`pill shrink-0 ${confermato ? 'pill-green' : 'pill-amber'}`}>
                    {confermato ? 'Confermato' : 'In attesa'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text3)] mb-3">
                  <span><i className="ti ti-calendar mr-1" />{m.data}</span>
                  <span><i className="ti ti-clock mr-1" />{m.orario}</span>
                  <span><i className="ti ti-map-pin mr-1" />{m.luogo}</span>
                </div>
                <div className="text-xs text-[var(--text3)]">
                  <i className="ti ti-user mr-1" />Organizzato dal responsabile HR
                </div>
                {m.note && <div className="text-xs text-[var(--text3)] mt-1"><i className="ti ti-notes mr-1" />{m.note}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
