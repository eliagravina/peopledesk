'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTimbrature, getTimbratureRange, getDipendenti } from '@/lib/api'
import type { Timbratura, Utente } from '@/types'

function calcOre(ent?: string, usc?: string) {
  if (!ent || !usc) return '—'
  const [eh, em] = ent.split(':').map(Number)
  const [uh, um] = usc.split(':').map(Number)
  const mins = (uh * 60 + um) - (eh * 60 + em)
  if (mins <= 0) return '—'
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}

const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DOW = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']

export default function TimbraturePage() {
  const [tab, setTab] = useState<'giornaliero' | 'foglio'>('giornaliero')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [timbrature, setTimbrature] = useState<Timbratura[]>([])
  const [dipendenti, setDipendenti] = useState<Utente[]>([])
  const [loading, setLoading] = useState(false)
  const [dal, setDal] = useState('')
  const [al, setAl] = useState(new Date().toISOString().slice(0, 10))
  const [foglioData, setFoglioData] = useState<Timbratura[]>([])
  const [foglioLoading, setFoglioLoading] = useState(false)

  // Init dal = lunedì settimana corrente
  useEffect(() => {
    const oggi = new Date()
    const lunedi = new Date(oggi)
    lunedi.setDate(oggi.getDate() - ((oggi.getDay() || 7) - 1))
    setDal(lunedi.toISOString().slice(0, 10))
    loadGiornaliero(selectedDate)
    getDipendenti().then(setDipendenti)
  }, [])

  async function loadGiornaliero(date: string) {
    setLoading(true)
    try { setTimbrature(await getTimbrature(date)) }
    finally { setLoading(false) }
  }

  async function loadFoglio() {
    if (!dal || !al) return
    setFoglioLoading(true)
    try { setFoglioData(await getTimbratureRange(dal, al)) }
    finally { setFoglioLoading(false) }
  }

  function getDays(from: string, to: string): string[] {
    const days: string[] = []
    const cur = new Date(from + 'T00:00:00')
    const end = new Date(to + 'T00:00:00')
    while (cur <= end && days.length < 60) {
      days.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }

  function exportXLS() {
    const days = getDays(dal, al)
    const headers1 = ['Dipendente', 'Matricola']
    const headers2 = ['', '']
    days.forEach(d => {
      const dt = new Date(d + 'T00:00:00')
      const lbl = `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()} ${DOW[dt.getDay()]}`
      for (let f = 1; f <= 3; f++) { headers1.push(`${lbl} F${f}`, ''); headers2.push('Entrata', 'Uscita') }
    })
    const rows: (string | number)[][] = [headers1, headers2]
    dipendenti.forEach((dip, idx) => {
      const nome = `${dip.nome} ${dip.cognome}`
      const row: (string | number)[] = [nome, `MAT${String(idx+1).padStart(4,'0')}`]
      days.forEach(d => {
        const recsDay = foglioData.filter(t => t.utente_id === dip.id && t.data === d)
        for (let f = 0; f < 3; f++) {
          const rec = recsDay.find(r => r.fascia === f + 1)
          row.push(rec?.entrata || '', rec?.uscita || '')
        }
      })
      rows.push(row)
    })

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>'
    rows.forEach((row, ri) => {
      html += '<tr>'
      row.forEach(cell => { html += `<${ri < 2 ? 'th' : 'td'}>${String(cell).replace(/</g,'&lt;')}</${ri < 2 ? 'th' : 'td'}>` })
      html += '</tr>'
    })
    html += '</table></body></html>'
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `presenze_${dal}_${al}.xlsx`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const allWorkers = dipendenti.map(d => ({ id: d.id, nome: `${d.nome} ${d.cognome}` }))
  const presenti  = timbrature.filter(t => t.stato === 'presente').length
  const assenti   = allWorkers.filter(w => !timbrature.find(t => t.utente_id === w.id)).length

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="Timbrature" subtitle="Registro presenze giornaliero e foglio storico"
        action={tab === 'foglio' && foglioData.length > 0 ? (
          <button onClick={exportXLS}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-medium border transition-colors hover:bg-[var(--surface2)]"
            style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
            <i className="ti ti-file-spreadsheet text-sm" />Esporta .xlsx
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Tab switcher */}
        <div className="flex gap-0 mb-5 rounded-[var(--r-sm)] border overflow-hidden w-fit" style={{ borderColor: 'var(--border2)' }}>
          {[{ k: 'giornaliero', lbl: 'Vista giornaliera', icon: 'ti-calendar' }, { k: 'foglio', lbl: 'Foglio presenze', icon: 'ti-table' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors"
              style={{ background: tab === t.k ? 'var(--text)' : 'var(--surface)', color: tab === t.k ? '#fff' : 'var(--text2)' }}>
              <i className={`ti ${t.icon} text-sm`} />{t.lbl}
            </button>
          ))}
        </div>

        {/* ── VISTA GIORNALIERA ── */}
        {tab === 'giornaliero' && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); loadGiornaliero(e.target.value) }}
                className="px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[{ lbl: 'Presenti', v: presenti, col: 'var(--accent)' }, { lbl: 'Assenti', v: assenti, col: 'var(--red)' },
                { lbl: 'In permesso', v: timbrature.filter(t=>t.stato==='permesso').length, col: 'var(--amber)' },
                { lbl: 'Totale attesi', v: dipendenti.length, col: 'var(--text2)' }].map(s => (
                <div key={s.lbl} className="rounded-[var(--r-md)] p-3 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
                  <div className="text-xs text-[var(--text3)] mb-1">{s.lbl}</div>
                  <div className="text-2xl font-bold" style={{ color: s.col }}>{s.v}</div>
                </div>
              ))}
            </div>

            {loading ? <div className="flex justify-center py-8"><i className="ti ti-loader-2 animate-spin text-xl text-[var(--text3)]" /></div> : (
              <div className="overflow-x-auto rounded-[var(--r-md)] border" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                      {['Dipendente','Fascia','Entrata','Uscita','Ore','Stato'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timbrature.map((t, i) => (
                      <tr key={t.id} className="hover:bg-[var(--surface2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2.5 text-sm font-medium">{t.utente ? `${t.utente.nome} ${t.utente.cognome}` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-[var(--text3)]">F{t.fascia}</td>
                        <td className="px-3 py-2.5 text-xs font-mono font-medium" style={{ color: 'var(--accent)' }}>{t.entrata || '—'}</td>
                        <td className="px-3 py-2.5 text-xs font-mono font-medium" style={{ color: 'var(--blue)' }}>{t.uscita || '—'}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-[var(--text2)]">{calcOre(t.entrata, t.uscita)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`pill text-[10px] ${{ presente: 'pill-green', assente: 'pill-red', permesso: 'pill-amber', ferie: 'pill-blue' }[t.stato] || 'pill-gray'}`}>
                            {{ presente: 'Presente', assente: 'Assente', permesso: 'Permesso', ferie: 'Ferie' }[t.stato] || t.stato}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {timbrature.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text3)]">Nessuna timbratura per questa data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── FOGLIO PRESENZE ── */}
        {tab === 'foglio' && (
          <>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text2)]">Dal</label>
                <input type="date" value={dal} onChange={e => setDal(e.target.value)}
                  className="px-3 py-2 rounded-[var(--r-sm)] border text-sm" style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text2)]">Al</label>
                <input type="date" value={al} onChange={e => setAl(e.target.value)}
                  className="px-3 py-2 rounded-[var(--r-sm)] border text-sm" style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
              </div>
              <button onClick={loadFoglio} disabled={foglioLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {foglioLoading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-search" />}
                Genera foglio
              </button>
            </div>

            {foglioLoading && <div className="flex justify-center py-8"><i className="ti ti-loader-2 animate-spin text-xl text-[var(--text3)]" /></div>}

            {!foglioLoading && foglioData.length > 0 && (() => {
              const days = getDays(dal, al)
              return (
                <div className="overflow-x-auto rounded-[var(--r-md)] border" style={{ borderColor: 'var(--border)' }}>
                  <table className="border-collapse" style={{ minWidth: `${140 + days.length * 6 * 40}px` }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <th rowSpan={2} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider sticky left-0 z-10 min-w-[140px]"
                          style={{ color: 'var(--text3)', background: 'var(--surface2)', borderRight: '2px solid var(--border2)', borderBottom: '1px solid var(--border)' }}>
                          Dipendente<br /><span className="font-normal normal-case">Matricola</span>
                        </th>
                        {days.map(d => {
                          const dt = new Date(d + 'T00:00:00')
                          const isFest = dt.getDay() === 0 || dt.getDay() === 6
                          return (
                            <th key={d} colSpan={6} className="px-1 py-2 text-center text-[10px] font-semibold"
                              style={{ color: isFest ? 'var(--red)' : 'var(--text)', borderLeft: '2px solid var(--border2)', borderBottom: '1px solid var(--border)', minWidth: '40px' }}>
                              <div>{dt.getDate()}/{dt.getMonth()+1}</div>
                              <div className="font-normal" style={{ color: 'var(--text3)' }}>{DOW[dt.getDay()]}</div>
                            </th>
                          )
                        })}
                      </tr>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {days.flatMap(d => [1,2,3].flatMap(f => ['E','U'].map(eu => (
                          <th key={`${d}-f${f}-${eu}`} className="px-1 py-1 text-center text-[9px]"
                            style={{ color: 'var(--text3)', borderLeft: eu==='E'?'2px solid var(--border2)':'none', borderBottom: '1px solid var(--border)', minWidth: '36px' }}>
                            <span style={{ fontSize: '8px', display: 'block', color: 'var(--text3)' }}>F{f}</span>{eu}
                          </th>
                        ))))}
                      </tr>
                    </thead>
                    <tbody>
                      {dipendenti.map((dip, idx) => {
                        const nome = `${dip.nome} ${dip.cognome}`
                        return (
                          <tr key={dip.id} className="hover:bg-[var(--surface2)] transition-colors"
                            style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="px-3 py-2 text-xs font-medium sticky left-0 z-10"
                              style={{ background: 'var(--surface)', borderRight: '2px solid var(--border2)', minWidth: '140px' }}>
                              {nome}
                              <span className="block font-mono text-[9px]" style={{ color: 'var(--text3)' }}>MAT{String(idx+1).padStart(4,'0')}</span>
                            </td>
                            {days.flatMap(d => {
                              const dt = new Date(d + 'T00:00:00')
                              const isFest = dt.getDay() === 0 || dt.getDay() === 6
                              const recsDay = foglioData.filter(t => t.utente_id === dip.id && t.data === d)
                              return [1,2,3].flatMap(f => {
                                const rec = recsDay.find(r => r.fascia === f)
                                return ['entrata','uscita'].map(eu => (
                                  <td key={`${d}-f${f}-${eu}`} className="px-1 py-2 text-center text-[10px] font-mono"
                                    style={{
                                      borderLeft: eu==='entrata'?'2px solid var(--border2)':'none',
                                      background: isFest ? 'var(--surface2)' : 'var(--surface)',
                                      color: eu==='entrata'?'var(--accent)':'var(--blue)'
                                    }}>
                                    {isFest ? '' : (rec?.[eu as 'entrata'|'uscita'] || '')}
                                  </td>
                                ))
                              })
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
