'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getMieNotifiche, segnaNotificaLetta, confermaPresenza } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Notifica } from '@/types'

export default function NotifichePage() {
  const [notifiche, setNotifiche] = useState<Notifica[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setNotifiche(await getMieNotifiche()) }
    finally { setLoading(false) }
  }

  async function handleConferma(n: Notifica) {
    if (!n.incontro_id) return
    await confermaPresenza(n.incontro_id)
    setNotifiche(prev => prev.map(x => x.id === n.id ? { ...x, confermata: true, letta: true } : x))
    setTimeout(() => router.push('/dashboard/worker/appuntamenti'), 600)
  }

  async function handleLetta(id: string) {
    await segnaNotificaLetta(id)
    setNotifiche(prev => prev.map(x => x.id === id ? { ...x, letta: true } : x))
  }

  const unread = notifiche.filter(n => !n.letta).length

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="Notifiche" subtitle={unread > 0 ? `${unread} non lette` : 'Tutte lette'} />

      <div className="flex-1 overflow-y-auto p-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <i className="ti ti-loader-2 animate-spin text-2xl text-[var(--text3)]" />
          </div>
        )}

        {!loading && notifiche.length === 0 && (
          <div className="text-center py-16">
            <i className="ti ti-bell-off text-4xl text-[var(--text3)] opacity-40 block mb-2" />
            <p className="text-sm text-[var(--text3)]">Nessuna notifica</p>
          </div>
        )}

        <div className="space-y-3 max-w-2xl">
          {notifiche.map(n => (
            <div key={n.id}
              className="rounded-[var(--r-md)] p-4 border"
              style={{
                background: n.confermata ? 'var(--surface2)' : 'var(--blue-lt)',
                borderColor: n.confermata ? 'var(--border)' : '#B5D4F4',
              }}
              onClick={() => !n.letta && handleLetta(n.id)}>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: n.confermata ? 'var(--text3)' : 'var(--blue)' }} />
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1"
                    style={{ color: n.confermata ? 'var(--text)' : 'var(--blue)' }}>
                    {n.titolo}
                  </div>
                  <div className="text-xs leading-relaxed mb-2"
                    style={{ color: n.confermata ? 'var(--text2)' : 'var(--blue)' }}>
                    {n.corpo}
                  </div>

                  {n.incontro && (
                    <div className="rounded-[var(--r-sm)] p-3 mb-3 space-y-1.5"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      {[
                        { icon: 'ti-calendar', label: 'Data', val: n.incontro.data },
                        { icon: 'ti-clock',    label: 'Orario', val: n.incontro.orario },
                        { icon: 'ti-map-pin',  label: 'Luogo', val: n.incontro.luogo },
                        n.incontro.note ? { icon: 'ti-notes', label: 'Note', val: n.incontro.note } : null,
                      ].filter(Boolean).map(row => row && (
                        <div key={row.label} className="flex gap-2 text-xs">
                          <i className={`ti ${row.icon} text-sm text-[var(--text3)]`} />
                          <span className="text-[var(--text3)] min-w-[50px]">{row.label}</span>
                          <span className="font-medium text-[var(--text)]">{row.val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!n.confermata && n.incontro_id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleConferma(n)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-medium text-white"
                        style={{ background: 'var(--accent)' }}>
                        <i className="ti ti-check text-sm" />Confermo la presenza
                      </button>
                      <button onClick={() => router.push('/dashboard/worker/appuntamenti')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] text-xs border"
                        style={{ borderColor: '#9DB8E8', color: 'var(--blue)', background: 'var(--surface)' }}>
                        <i className="ti ti-calendar text-sm" />Vedi appuntamento
                      </button>
                    </div>
                  ) : n.confermata ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: 'var(--accent)' }}>
                      <i className="ti ti-circle-check text-sm" />Presenza confermata
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
