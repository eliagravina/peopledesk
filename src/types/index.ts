// ─── Database Types ───────────────────────────────────────────────

export type Ruolo = 'hr' | 'worker'
export type StatoRichiesta = 'pending' | 'approvato' | 'rifiutato'
export type TipoRichiesta = 'ferie' | 'malattia' | 'permesso'
export type StatoTimbratura = 'presente' | 'assente' | 'permesso' | 'ferie'
export type CategoriaBacheca = 'comunicazione' | 'chiusura' | 'documento' | 'evento'

export interface Utente {
  id: string
  email: string
  nome: string
  cognome: string
  reparto: string
  ruolo: Ruolo
  primo_accesso: boolean
  av_cls: string
  av_init: string
  created_at: string
}

export interface Richiesta {
  id: string
  utente_id: string
  tipo: TipoRichiesta
  dettaglio: string
  note?: string
  stato: StatoRichiesta
  created_at: string
  utente?: Utente
}

export interface Incontro {
  id: string
  titolo: string
  data: string       // YYYY-MM-DD
  orario: string     // HH:MM
  luogo: string
  note?: string
  creato_da: string
  concluso: boolean
  created_at: string
  partecipanti?: IncontroPartecipante[]
}

export interface IncontroPartecipante {
  incontro_id: string
  utente_id: string
  confermato: boolean
  utente?: Utente
}

export interface Notifica {
  id: string
  destinatario_id: string
  titolo: string
  corpo: string
  incontro_id?: string
  letta: boolean
  confermata: boolean
  created_at: string
  incontro?: Incontro
}

export interface PostBacheca {
  id: string
  autore_id: string
  categoria: CategoriaBacheca
  titolo: string
  corpo: string
  data_evento?: string
  created_at: string
  autore?: Utente
}

export interface Timbratura {
  id: string
  utente_id: string
  data: string        // YYYY-MM-DD
  fascia: 1 | 2 | 3
  entrata?: string    // HH:MM
  uscita?: string     // HH:MM
  stato: StatoTimbratura
  utente?: Utente
}

// ─── UI Types ────────────────────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  icon: string
  badge?: number
  badgeColor?: string
}

export interface AuthState {
  user: Utente | null
  loading: boolean
}
