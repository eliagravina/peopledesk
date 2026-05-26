'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { timbra, getMieTimbrature } from '@/lib/api'
import type { Timbratura } from '@/types'

declare global { interface Window { NDEFReader: unknown } }

type Tab = 'nfc' | 'manuale'
type NFCStatus = 'idle' | 'scanning' | 'success' | 'error' | 'ios' | 'no_browser' | 'no_permission' | 'nfc_off'

export default function TimbraPage() {
  const { utente } = useAuth()
  const [tab, setTab] = useState<Tab>('nfc')
  const [nfcStatus, setNfcStatus] = useState<NFCStatus>('idle')
  const [nfcMsg, setNfcMsg] = useState('Premi il pulsante per avviare la scansione NFC')
  const [orarioRegistrato, setOrarioRegistrato] = useState<string | null>(null)
  const [storico, setStorico] = useState<Timbratura[]>([])
  const [manTipo, setManTipo] = useState<'entrata' | 'uscita'>('entrata')
  const [manFascia, setManFascia] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const oggi = new Date().toISOString().slice(0, 10)

  useEffect(() => { loadStorico() }, [])

  async function loadStorico() {
    try { setStorico(await getMieTimbrature()) } catch { /* ignore */ }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function detectPlatform() {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream
    const isAndroid = /Android/.test(ua)
    const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua)
    const hasNFC = 'NDEFReader' in window
    return { isIOS, isAndroid, isChrome, hasNFC }
  }

  async function startNFC(tipo: 'entrata' | 'uscita') {
    const { isIOS, hasNFC } = detectPlatform()

    if (isIOS) {
      setNfcStatus('ios')
      setNfcMsg('Safari non supporta NFC. Usa il tab Manuale oppure un\'app nativa iOS.')
      return
    }

    if (!hasNFC) {
      setNfcStatus('no_browser')
      setNfcMsg('Apri questa pagina con Chrome su Android (v89+) per usare NFC.')
      return
    }

    setNfcStatus('scanning')
    setNfcMsg('Avvicina il telefono al tag NFC aziendale...')

    try {
      const NDEFReader = (window as unknown as { NDEFReader: new () => { scan: (opts: { signal: AbortSignal }) => Promise<void>; addEventListener: (e: string, cb: (ev: { serialNumber: string }) => void) => void } }).NDEFReader
      const controller = new AbortController()
      const reader = new NDEFReader()
      await reader.scan({ signal: controller.signal })

      reader.addEventListener('reading', async ({ serialNumber }) => {
        controller.abort()
        setNfcStatus('success')
        const fascia = (storico.filter(t => t.data === oggi).length + 1) as 1 | 2 | 3
        try {
          const ot = await timbra({ fascia: Math.min(fascia, 3) as 1|2|3, tipo })
          setOrarioRegistrato(ot)
          setNfcMsg(`✓ ${tipo === 'entrata' ? 'Entrata' : 'Uscita'} registrata alle ${ot} — Tag: ${serialNumber || 'aziendale'}`)
          showToast(`✓ ${tipo === 'entrata' ? 'Entrata' : 'Uscita'} NFC registrata alle ${ot}`)
          loadStorico()
        } catch (e) {
          setNfcStatus('error')
          setNfcMsg('Errore salvataggio timbratura.')
        }
      })
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string }
      if (err.name === 'NotAllowedError') {
        setNfcStatus('no_permission')
        setNfcMsg('Permesso NFC negato. Tocca il lucchetto in Chrome → Permessi → NFC → Consenti.')
      } else if (err.name === 'NotSupportedError') {
        setNfcStatus('nfc_off')
        setNfcMsg('NFC disattivato. Attivalo in Impostazioni → Connessioni → NFC.')
      } else if (err.name !== 'AbortError') {
        setNfcStatus('error')
        setNfcMsg('Errore NFC: ' + (err.message || err.name))
      }
    }
  }

  async function handleManuale() {
    setSaving(true)
    try {
      const ot = await timbra({ fascia: manFascia, tipo: manTipo })
      showToast(`✓ ${manTipo === 'entrata' ? 'Entrata' : 'Uscita'} registrata alle ${ot}`)
      loadStorico()
    } catch (e) {
      showToast('Errore durante la timbratura')
    } finally { setSaving(false) }
  }

  const ringColor = {
    idle: 'var(--border2)', scanning: 'var(--accent)',
    success: 'var(--accent)', error: 'var(--red)',
    ios: 'var(--amber)', no_browser: 'var(--amber)',
    no_permission: 'var(--red)', nfc_off: 'var(--amber)'
  }[nfcStatus]

  const ringIcon = {
    idle: 'ti-wifi', scanning: 'ti-wifi', success: 'ti-check',
    error: 'ti-alert-circle', ios: 'ti-brand-apple',
    no_browser: 'ti-brand-android', no_permission: 'ti-lock', nfc_off: 'ti-wifi-off'
  }[nfcStatus]

  const oggiTimb = storico.filter(t => t.data === oggi)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <PageHeader title="Timbra presenza" subtitle={new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Tabs */}
        <div className="flex mb-6 rounded-[var(--r-sm)] overflow-hidden border max-w-xs" style={{ borderColor: 'var(--border2)' }}>
          {(['nfc', 'manuale'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{ background: tab === t ? 'var(--text)' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--text2)' }}>
              <i className={`ti ${t === 'nfc' ? 'ti-wifi' : 'ti-hand-finger'} mr-1.5`} />
              {t === 'nfc' ? 'NFC' : 'Manuale'}
            </button>
          ))}
        </div>

        {tab === 'nfc' && (
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            {/* Ring */}
            <div className="relative w-44 h-44 rounded-full flex items-center justify-center"
              style={{
                border: `3px solid ${ringColor}`,
                background: 'var(--surface2)',
                boxShadow: nfcStatus === 'scanning' ? `0 0 0 0 rgba(42,92,69,0.25)` : 'none',
                animation: nfcStatus === 'scanning' ? 'nfcPulse 1.8s ease-in-out infinite' : 'none'
              }}>
              {nfcStatus === 'scanning' && [0,1,2].map(i => (
                <div key={i} className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: 'var(--accent)', opacity: 0, animation: `nfcWave 1.8s ease-out ${i * 0.6}s infinite` }} />
              ))}
              <i className={`ti ${ringIcon} text-6xl`} style={{ color: ringColor }} />
            </div>

            <p className="text-sm text-center text-[var(--text2)] max-w-xs">{nfcMsg}</p>

            {/* Riepilogo oggi */}
            {oggiTimb.length > 0 && (
              <div className="flex gap-4">
                {oggiTimb.map((t, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] text-[var(--text3)]">F{i + 1}</div>
                    {t.entrata && <div className="text-sm font-mono font-bold" style={{ color: 'var(--accent)' }}>{t.entrata}</div>}
                    {t.uscita  && <div className="text-sm font-mono font-bold" style={{ color: 'var(--blue)' }}>{t.uscita}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => startNFC('entrata')}
                className="flex items-center gap-2 px-4 py-3 rounded-[var(--r-md)] text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}>
                <i className="ti ti-wifi text-base" />Timbra Entrata
              </button>
              <button onClick={() => startNFC('uscita')}
                className="flex items-center gap-2 px-4 py-3 rounded-[var(--r-md)] text-sm font-medium text-white"
                style={{ background: 'var(--blue)' }}>
                <i className="ti ti-wifi text-base" />Timbra Uscita
              </button>
            </div>
            <p className="text-xs text-[var(--text3)] text-center">Richiede Android + Chrome 89+ con NFC abilitato</p>
          </div>
        )}

        {tab === 'manuale' && (
          <div className="max-w-sm rounded-[var(--r-md)] p-5 space-y-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm">Timbratura manuale</h3>
            <div>
              <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Tipo</label>
              <select value={manTipo} onChange={e => setManTipo(e.target.value as 'entrata' | 'uscita')}
                className="w-full px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border2)', background: 'var(--surface)', color: 'var(--text)' }}>
                <option value="entrata">Entrata</option>
                <option value="uscita">Uscita</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">Fascia oraria</label>
              <select value={manFascia} onChange={e => setManFascia(parseInt(e.target.value) as 1|2|3)}
                className="w-full px-3 py-2 rounded-[var(--r-sm)] border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border2)', background: 'var(--surface)', color: 'var(--text)' }}>
                <option value={1}>1ª fascia (mattina)</option>
                <option value={2}>2ª fascia (pomeriggio)</option>
                <option value={3}>3ª fascia (straordinario)</option>
              </select>
            </div>
            <button onClick={handleManuale} disabled={saving}
              className="w-full py-2.5 rounded-[var(--r-sm)] text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}>
              {saving ? <><i className="ti ti-loader-2 animate-spin" />Salvataggio...</> : <><i className="ti ti-check" />Conferma timbratura</>}
            </button>
          </div>
        )}

        {/* Storico */}
        <div className="mt-8 max-w-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text3)] mb-3">Ultime timbrature</div>
          {storico.length === 0 ? (
            <p className="text-xs text-[var(--text3)]">Nessuna timbratura registrata</p>
          ) : (
            <div className="space-y-2">
              {[...new Set(storico.map(t => t.data))].slice(0, 5).map(data => {
                const dayRecs = storico.filter(t => t.data === data)
                return (
                  <div key={data} className="rounded-[var(--r-sm)] p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium">{data}</span>
                      <span className="pill pill-green text-[10px]">Presente</span>
                    </div>
                    {dayRecs.map((r, i) => (
                      <div key={i} className="flex gap-3 text-xs text-[var(--text3)]">
                        <span className="w-6">F{r.fascia}</span>
                        <span className="font-mono" style={{ color: 'var(--accent)' }}>{r.entrata || '—'}</span>
                        <span>→</span>
                        <span className="font-mono" style={{ color: 'var(--blue)' }}>{r.uscita || '—'}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 px-4 py-2.5 rounded-[var(--r-sm)] text-white text-sm shadow-lg z-50"
          style={{ background: 'var(--text)' }}>{toast}</div>
      )}
    </div>
  )
}
