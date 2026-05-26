'use client'

import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { creaRichiesta } from '@/lib/api'

interface Msg { role: 'bot' | 'user'; text: string; extras?: React.ReactNode }

type ChatState = 'idle' | 'mal_cod' | 'mal_data' | 'ferie_range' | 'permesso_tipo' | 'permesso_data' | 'permesso_ore' | 'appt_data' | 'appt_ora'

const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DAYS_SHORT = ['Lu','Ma','Me','Gi','Ve','Sa','Do']

export default function WorkerChatPage() {
  const { utente } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [tmpData, setTmpData] = useState<Record<string, string>>({})
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selStart, setSelStart] = useState<Date | null>(null)
  const [selEnd, setSelEnd] = useState<Date | null>(null)
  const [showCal, setShowCal] = useState(false)
  const [calMode, setCalMode] = useState<'single' | 'range'>('single')
  const [calCallback, setCalCallback] = useState<((d: Date, d2?: Date) => void) | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (utente && msgs.length === 0) {
      addBot(`Ciao ${utente.nome}! Sono l'assistente HR. Come posso aiutarti oggi?`, renderMainMenu())
    }
  }, [utente])

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  function addBot(text: string, extras?: React.ReactNode) {
    setMsgs(prev => [...prev, { role: 'bot', text, extras }])
  }
  function addUser(text: string) {
    setMsgs(prev => [...prev, { role: 'user', text }])
  }

  function fmt(d: Date) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  }
  function lbl(d: Date) {
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`
  }

  function openCal(mode: 'single' | 'range', cb: (d: Date, d2?: Date) => void) {
    setCalMode(mode)
    setSelStart(null); setSelEnd(null)
    setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear())
    setCalCallback(() => cb)
    setShowCal(true)
  }

  function handleDayClick(d: Date) {
    if (calMode === 'single') {
      setSelStart(d); setSelEnd(null)
      setTimeout(() => {
        setShowCal(false)
        calCallback?.(d)
      }, 200)
    } else {
      if (!selStart || selEnd) { setSelStart(d); setSelEnd(null) }
      else {
        if (d <= selStart) { setSelStart(d); return }
        setSelEnd(d)
        setTimeout(() => {
          setShowCal(false)
          calCallback?.(selStart, d)
        }, 250)
      }
    }
  }

  function renderMainMenu() {
    const options = [
      { icon: 'ti-virus',       label: '🤒 Segnala malattia', key: 'malattia' },
      { icon: 'ti-tree',        label: '🌴 Richiedi ferie',   key: 'ferie' },
      { icon: 'ti-clock-pause', label: '🕐 Richiedi permesso', key: 'permesso' },
      { icon: 'ti-calendar',    label: '📅 Appuntamento HR',   key: 'appuntamento' },
    ]
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map(o => (
          <button key={o.key} onClick={() => handleOption(o.key)}
            className="px-3 py-1.5 rounded-full text-xs border transition-all hover:bg-[var(--surface2)]"
            style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface)' }}>
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  async function handleOption(key: string) {
    addUser(key === 'malattia' ? '🤒 Segnala malattia' :
            key === 'ferie' ? '🌴 Richiedi ferie' :
            key === 'permesso' ? '🕐 Richiedi permesso' : '📅 Appuntamento HR')

    if (key === 'malattia') {
      setChatState('mal_cod')
      addBot('Inserisci il codice di protocollo rilasciato dal medico.')
    } else if (key === 'ferie') {
      addBot('Seleziona il periodo di ferie: clicca prima la data di inizio, poi quella di fine.')
      openCal('range', (start, end) => {
        if (start && end) {
          addUser(`Ferie: ${lbl(start)} → ${lbl(end)}`)
          addBot(`Richiesta ferie dal ${lbl(start)} al ${lbl(end)} inviata all'HR. Riceverai conferma.`)
          creaRichiesta({ tipo: 'ferie', dettaglio: `${fmt(start)} - ${fmt(end)}`, note: 'Richiesta tramite chat' })
          setChatState('idle')
          setTimeout(() => addBot('Posso aiutarti con altro?', renderMainMenu()), 600)
        }
      })
    } else if (key === 'permesso') {
      setChatState('permesso_tipo')
      const tipi = ['Visita medica','Motivi familiari','Studio / Esame','Legge 104','Altro']
      addBot('Che tipo di permesso vuoi richiedere?',
        <div className="flex flex-wrap gap-2 mt-2">
          {tipi.map(t => (
            <button key={t} onClick={() => {
              addUser(t)
              setTmpData(prev => ({ ...prev, tipo_permesso: t }))
              setChatState('permesso_data')
              addBot(`Seleziona la data del permesso (${t}).`)
              openCal('single', (d) => {
                addUser(`Data: ${lbl(d)}`)
                setTmpData(prev => ({ ...prev, data_permesso: fmt(d), lbl_permesso: lbl(d) }))
                setChatState('permesso_ore')
                addBot('Quante ore di permesso ti servono?')
              })
            }}
              className="px-3 py-1.5 rounded-full text-xs border transition-all hover:bg-[var(--accent-lt)]"
              style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface)' }}>
              {t}
            </button>
          ))}
        </div>
      )
    } else if (key === 'appuntamento') {
      addBot('Seleziona la data per l\'appuntamento con l\'HR.')
      openCal('single', (d) => {
        addUser(`Data: ${lbl(d)}`)
        setChatState('appt_ora')
        const slots = ['09:00','09:30','10:00','10:30','14:00','14:30','15:00','15:30']
        addBot('Scegli l\'orario preferito:',
          <div className="flex flex-wrap gap-2 mt-2">
            {slots.map(s => (
              <button key={s} onClick={() => {
                addUser(`Orario: ${s}`)
                addBot(`Richiesta appuntamento per ${lbl(d)} alle ${s} inviata. Riceverai conferma.`)
                creaRichiesta({ tipo: 'permesso', dettaglio: `Appuntamento HR: ${fmt(d)} ore ${s}`, note: 'Appuntamento richiesto tramite chat' })
                setChatState('idle')
                setTimeout(() => addBot('Posso aiutarti con altro?', renderMainMenu()), 600)
              }}
                className="px-3 py-1.5 rounded-[var(--r-sm)] text-xs border font-mono transition-all hover:bg-[var(--surface2)]"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface)' }}>
                {s}
              </button>
            ))}
          </div>
        )
      })
    }
  }

  async function handleSend() {
    const val = input.trim(); if (!val) return
    setInput('')
    addUser(val)

    if (chatState === 'mal_cod') {
      setTmpData(prev => ({ ...prev, codice: val }))
      setChatState('mal_data')
      addBot('Qual è l\'ultimo giorno di malattia indicato sul certificato?')
      openCal('single', (d) => {
        addUser(`Fino al: ${lbl(d)}`)
        setChatState('idle')
        addBot(`Codice ${val} registrato. Fine malattia: ${lbl(d)}. Responsabile HR notificato.`)
        creaRichiesta({ tipo: 'malattia', dettaglio: `Codice: ${val} — fino al ${fmt(d)}`, note: 'Certificato medico' })
        setTimeout(() => addBot('Posso aiutarti con altro?', renderMainMenu()), 700)
      })
    } else if (chatState === 'permesso_ore') {
      const td = tmpData
      addBot(`Richiesta permesso (${td.tipo_permesso}) per ${td.lbl_permesso}, durata: ${val}. Inviata all'HR.`)
      creaRichiesta({ tipo: 'permesso', dettaglio: `${td.data_permesso} — ${td.tipo_permesso} (${val})`, note: td.tipo_permesso })
      setChatState('idle')
      setTimeout(() => addBot('Posso aiutarti con altro?', renderMainMenu()), 600)
    } else {
      addBot('Usa i pulsanti qui sopra per gestire le tue richieste.', renderMainMenu())
      setChatState('idle')
    }
  }

  // Mini Calendar render
  function renderCalendar() {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const off = firstDay === 0 ? 6 : firstDay - 1
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const prevDim = new Date(calYear, calMonth, 0).getDate()
    const total = Math.ceil((off + dim) / 7) * 7
    const cells = []

    for (let i = 0; i < total; i++) {
      let day: number, mo = calMonth, yr = calYear, isOther = false
      if (i < off) { day = prevDim - off + i + 1; mo = calMonth - 1; isOther = true; if (mo < 0) { mo = 11; yr-- } }
      else if (i >= off + dim) { day = i - off - dim + 1; mo = calMonth + 1; isOther = true; if (mo > 11) { mo = 0; yr++ } }
      else { day = i - off + 1 }

      const cellDate = new Date(yr, mo, day)
      const isPast = cellDate < todayMidnight
      const isToday = cellDate.toDateString() === todayMidnight.toDateString()
      const isSel = selStart && cellDate.toDateString() === selStart.toDateString()
      const isSelE = selEnd && cellDate.toDateString() === selEnd.toDateString()
      const inRange = selStart && selEnd && cellDate > selStart && cellDate < selEnd

      cells.push(
        <button key={i} disabled={isOther || isPast}
          onClick={() => handleDayClick(cellDate)}
          className={[
            'text-xs py-1 rounded-md transition-all text-center',
            isOther || isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--accent-lt)]',
            isToday ? 'font-bold' : '',
            isSel || isSelE ? 'text-white' : isToday ? 'text-[var(--accent)]' : 'text-[var(--text2)]',
            inRange ? 'bg-[var(--accent-lt)] rounded-none' : '',
          ].join(' ')}
          style={isSel || isSelE ? { background: 'var(--accent)' } : {}}>
          {day}
        </button>
      )
    }

    return (
      <div className="mt-2 p-3 rounded-[var(--r-md)] border shadow-[var(--shadow-md)] w-64"
        style={{ background: 'var(--surface)', borderColor: 'var(--border2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y-- }; setCalMonth(m); setCalYear(y) }}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text3)] hover:bg-[var(--surface2)]">
            <i className="ti ti-chevron-left text-sm" />
          </button>
          <span className="text-xs font-semibold">{MONTHS[calMonth]} {calYear}</span>
          <button onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++ }; setCalMonth(m); setCalYear(y) }}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text3)] hover:bg-[var(--surface2)]">
            <i className="ti ti-chevron-right text-sm" />
          </button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => <div key={d} className="text-center text-[9px] font-semibold text-[var(--text3)] py-1">{d}</div>)}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7 gap-0.5">{cells}</div>
        {/* Footer */}
        <div className="mt-2 pt-2 border-t text-[10px] text-center text-[var(--text3)]"
          style={{ borderColor: 'var(--border)' }}>
          {calMode === 'single'
            ? selStart ? `✓ ${lbl(selStart)}` : 'Seleziona una data'
            : !selStart ? 'Seleziona la data di inizio'
            : !selEnd ? `Inizio: ${lbl(selStart)} — ora la fine`
            : `${lbl(selStart)} → ${lbl(selEnd)}`}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="HR Assistant" subtitle="Gestisci ferie, malattia, permessi e appuntamenti" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`av w-7 h-7 text-[10px] shrink-0 mt-0.5 ${m.role === 'bot' ? 'av-teal' : (utente?.av_cls || 'av-blue')}`}>
              {m.role === 'bot' ? 'HR' : (utente?.av_init || '??')}
            </div>
            <div>
              <div className={[
                'px-3 py-2 rounded-2xl text-[13px] leading-relaxed',
                m.role === 'bot'
                  ? 'rounded-tl-sm'
                  : 'text-white rounded-tr-sm',
              ].join(' ')}
                style={m.role === 'bot'
                  ? { background: 'var(--surface2)', color: 'var(--text)' }
                  : { background: 'var(--text)' }}>
                {m.text}
              </div>
              {m.extras && <div>{m.extras}</div>}
              {showCal && i === msgs.length - 1 && m.role === 'bot' && renderCalendar()}
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Scrivi un messaggio..."
          className="flex-1 px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text)' }} />
        <button onClick={handleSend}
          className="w-9 h-9 rounded-[var(--r-sm)] flex items-center justify-center text-white"
          style={{ background: 'var(--accent)' }}>
          <i className="ti ti-send text-base" />
        </button>
      </div>
    </div>
  )
}
