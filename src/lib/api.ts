import { createClient } from '@/lib/supabase/client'
import type {
  Utente, Richiesta, Incontro, Notifica,
  PostBacheca, Timbratura, TipoRichiesta,
  CategoriaBacheca, StatoTimbratura
} from '@/types'

// ─── AUTH ────────────────────────────────────────────────────────

export async function loginConEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function registraDipendente(params: {
  email: string; password: string
  nome: string; cognome: string; reparto: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nome: params.nome,
        cognome: params.cognome,
        reparto: params.reparto,
        ruolo: 'worker',
      }
    }
  })
  if (error) throw error
  return data
}

export async function cambiaPassword(nuovaPassword: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: nuovaPassword })
  if (error) throw error
}

// ─── UTENTI ──────────────────────────────────────────────────────

export async function getDipendenti(): Promise<Utente[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('utenti')
    .select('*')
    .eq('ruolo', 'worker')
    .order('cognome')
  if (error) throw error
  return data || []
}

export async function aggiornaUtente(id: string, updates: Partial<Utente>) {
  const supabase = createClient()
  const { error } = await supabase.from('utenti').update(updates).eq('id', id)
  if (error) throw error
}

export async function eliminaUtente(id: string) {
  const supabase = createClient()
  // Elimina l'utente da auth (cascata elimina anche da utenti)
  const { error } = await supabase.rpc('elimina_utente', { utente_id: id })
  if (error) throw error
}

// ─── RICHIESTE ───────────────────────────────────────────────────

export async function getRichieste(solo_mie = false): Promise<Richiesta[]> {
  const supabase = createClient()
  let query = supabase
    .from('richieste')
    .select('*, utente:utenti(nome, cognome, av_cls, av_init)')
    .order('created_at', { ascending: false })

  if (solo_mie) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) query = query.eq('utente_id', user.id)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function creaRichiesta(params: {
  tipo: TipoRichiesta; dettaglio: string; note?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { error } = await supabase.from('richieste').insert({
    utente_id: user.id,
    tipo: params.tipo,
    dettaglio: params.dettaglio,
    note: params.note || '',
  })
  if (error) throw error
}

export async function aggiornaStatoRichiesta(
  id: string,
  stato: 'approvato' | 'rifiutato'
) {
  const supabase = createClient()
  const { error } = await supabase.from('richieste').update({ stato }).eq('id', id)
  if (error) throw error
}

// ─── INCONTRI ────────────────────────────────────────────────────

export async function getIncontri(): Promise<Incontro[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('incontri')
    .select(`
      *,
      partecipanti:incontri_partecipanti(
        confermato,
        utente:utenti(id, nome, cognome, av_cls, av_init)
      )
    `)
    .order('data', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getMieiIncontri(): Promise<Incontro[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('incontri')
    .select(`
      *,
      partecipanti:incontri_partecipanti!inner(
        confermato,
        utente:utenti(id, nome, cognome)
      )
    `)
    .eq('incontri_partecipanti.utente_id', user.id)
    .eq('concluso', false)
    .order('data')
  if (error) throw error
  return data || []
}

export async function creaIncontro(params: {
  titolo: string; data: string; orario: string
  luogo: string; note?: string; partecipanti: string[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { data: incontro, error } = await supabase
    .from('incontri')
    .insert({
      titolo: params.titolo,
      data: params.data,
      orario: params.orario,
      luogo: params.luogo,
      note: params.note || '',
      creato_da: user.id,
    })
    .select()
    .single()
  if (error) throw error

  // Aggiungi partecipanti
  const partRows = params.partecipanti.map(uid => ({
    incontro_id: incontro.id,
    utente_id: uid,
    confermato: false,
  }))
  await supabase.from('incontri_partecipanti').insert(partRows)

  // Crea notifiche per ogni partecipante
  const notifiche = params.partecipanti.map(uid => ({
    destinatario_id: uid,
    titolo: `Convocazione: ${params.titolo}`,
    corpo: `Sei stato convocato per il ${params.data} alle ${params.orario} in ${params.luogo}.`,
    incontro_id: incontro.id,
  }))
  await supabase.from('notifiche').insert(notifiche)

  return incontro
}

export async function concludiIncontro(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('incontri').update({ concluso: true }).eq('id', id)
  if (error) throw error
}

export async function confermaPresenza(incontroId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { error: e1 } = await supabase
    .from('incontri_partecipanti')
    .update({ confermato: true })
    .eq('incontro_id', incontroId)
    .eq('utente_id', user.id)
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from('notifiche')
    .update({ confermata: true, letta: true })
    .eq('incontro_id', incontroId)
    .eq('destinatario_id', user.id)
  if (e2) throw e2
}

// ─── NOTIFICHE ───────────────────────────────────────────────────

export async function getMieNotifiche(): Promise<Notifica[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifiche')
    .select('*, incontro:incontri(titolo, data, orario, luogo, note)')
    .eq('destinatario_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function segnaNotificaLetta(id: string) {
  const supabase = createClient()
  await supabase.from('notifiche').update({ letta: true }).eq('id', id)
}

// ─── BACHECA ─────────────────────────────────────────────────────

export async function getBacheca(): Promise<PostBacheca[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bacheca')
    .select('*, autore:utenti(nome, cognome, av_cls, av_init)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function creaPost(params: {
  categoria: CategoriaBacheca; titolo: string
  corpo: string; data_evento?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { error } = await supabase.from('bacheca').insert({
    autore_id: user.id, ...params
  })
  if (error) throw error
}

export async function aggiornaPost(id: string, params: Partial<PostBacheca>) {
  const supabase = createClient()
  const { error } = await supabase.from('bacheca').update(params).eq('id', id)
  if (error) throw error
}

export async function eliminaPost(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('bacheca').delete().eq('id', id)
  if (error) throw error
}

// ─── TIMBRATURE ──────────────────────────────────────────────────

export async function getTimbrature(data?: string): Promise<Timbratura[]> {
  const supabase = createClient()
  let query = supabase
    .from('timbrature')
    .select('*, utente:utenti(nome, cognome, av_cls, av_init)')
    .order('data', { ascending: false })
    .order('fascia')

  if (data) query = query.eq('data', data)

  const { data: rows, error } = await query
  if (error) throw error
  return rows || []
}

export async function getTimbratureRange(dal: string, al: string): Promise<Timbratura[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timbrature')
    .select('*, utente:utenti(id, nome, cognome)')
    .gte('data', dal)
    .lte('data', al)
    .order('data')
    .order('fascia')
  if (error) throw error
  return data || []
}

export async function getMieTimbrature(): Promise<Timbratura[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('timbrature')
    .select('*')
    .eq('utente_id', user.id)
    .order('data', { ascending: false })
    .order('fascia')
    .limit(30)
  if (error) throw error
  return data || []
}

export async function timbra(params: {
  fascia: 1 | 2 | 3
  tipo: 'entrata' | 'uscita'
  stato?: StatoTimbratura
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const oggi = new Date().toISOString().slice(0, 10)
  const orario = new Date().toTimeString().slice(0, 5)

  // Upsert: se esiste la fascia aggiorna, altrimenti inserisce
  const upsertData: Record<string, unknown> = {
    utente_id: user.id,
    data: oggi,
    fascia: params.fascia,
    stato: params.stato || 'presente',
  }
  if (params.tipo === 'entrata') upsertData.entrata = orario
  else upsertData.uscita = orario

  const { error } = await supabase
    .from('timbrature')
    .upsert(upsertData, { onConflict: 'utente_id,data,fascia' })
  if (error) throw error

  return orario
}
