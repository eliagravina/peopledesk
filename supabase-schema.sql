-- ═══════════════════════════════════════════════════════════════
-- PeopleDesk — Schema Database Supabase
-- Esegui questo script nell'SQL Editor di Supabase
-- (Supabase Dashboard → SQL Editor → New Query → incolla → Run)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELLA UTENTI ───────────────────────────────────────────
-- Estende auth.users di Supabase con i dati del profilo
CREATE TABLE IF NOT EXISTS public.utenti (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  nome          TEXT NOT NULL,
  cognome       TEXT NOT NULL,
  reparto       TEXT DEFAULT '',
  ruolo         TEXT NOT NULL DEFAULT 'worker' CHECK (ruolo IN ('hr', 'worker')),
  primo_accesso BOOLEAN DEFAULT TRUE,
  av_cls        TEXT DEFAULT 'av-blue',
  av_init       TEXT DEFAULT '??',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. TABELLA RICHIESTE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.richieste (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utente_id  UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('ferie', 'malattia', 'permesso')),
  dettaglio  TEXT NOT NULL,
  note       TEXT DEFAULT '',
  stato      TEXT NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'approvato', 'rifiutato')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. TABELLA INCONTRI ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incontri (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo     TEXT NOT NULL,
  data       DATE NOT NULL,
  orario     TIME NOT NULL,
  luogo      TEXT DEFAULT '',
  note       TEXT DEFAULT '',
  creato_da  UUID NOT NULL REFERENCES public.utenti(id),
  concluso   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. TABELLA INCONTRI PARTECIPANTI ────────────────────────────
CREATE TABLE IF NOT EXISTS public.incontri_partecipanti (
  incontro_id UUID NOT NULL REFERENCES public.incontri(id) ON DELETE CASCADE,
  utente_id   UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  confermato  BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (incontro_id, utente_id)
);

-- ─── 5. TABELLA NOTIFICHE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifiche (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  titolo          TEXT NOT NULL,
  corpo           TEXT NOT NULL,
  incontro_id     UUID REFERENCES public.incontri(id) ON DELETE SET NULL,
  letta           BOOLEAN DEFAULT FALSE,
  confermata      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. TABELLA BACHECA ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bacheca (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autore_id   UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  categoria   TEXT NOT NULL CHECK (categoria IN ('comunicazione', 'chiusura', 'documento', 'evento')),
  titolo      TEXT NOT NULL,
  corpo       TEXT NOT NULL,
  data_evento DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. TABELLA TIMBRATURE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timbrature (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utente_id  UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  fascia     SMALLINT NOT NULL DEFAULT 1 CHECK (fascia IN (1, 2, 3)),
  entrata    TIME,
  uscita     TIME,
  stato      TEXT NOT NULL DEFAULT 'presente' CHECK (stato IN ('presente', 'assente', 'permesso', 'ferie')),
  UNIQUE (utente_id, data, fascia)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Sicurezza per riga
-- Ogni utente vede SOLO i propri dati; HR vede tutto
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.utenti           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.richieste        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incontri         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incontri_partecipanti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifiche        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bacheca          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timbrature       ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se l'utente corrente è HR
CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.utenti
    WHERE id = auth.uid() AND ruolo = 'hr'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── Policy: UTENTI ──────────────────────────────────────────────
CREATE POLICY "Utente vede se stesso" ON public.utenti
  FOR SELECT USING (id = auth.uid() OR public.is_hr());

CREATE POLICY "HR gestisce utenti" ON public.utenti
  FOR ALL USING (public.is_hr());

CREATE POLICY "Utente aggiorna se stesso" ON public.utenti
  FOR UPDATE USING (id = auth.uid());

-- ─── Policy: RICHIESTE ───────────────────────────────────────────
CREATE POLICY "Lavoratore vede proprie richieste" ON public.richieste
  FOR SELECT USING (utente_id = auth.uid() OR public.is_hr());

CREATE POLICY "Lavoratore crea richieste" ON public.richieste
  FOR INSERT WITH CHECK (utente_id = auth.uid());

CREATE POLICY "HR approva/rifiuta richieste" ON public.richieste
  FOR UPDATE USING (public.is_hr());

-- ─── Policy: INCONTRI ────────────────────────────────────────────
CREATE POLICY "Tutti vedono incontri" ON public.incontri
  FOR SELECT USING (TRUE);

CREATE POLICY "Solo HR crea incontri" ON public.incontri
  FOR INSERT WITH CHECK (public.is_hr());

CREATE POLICY "HR modifica incontri" ON public.incontri
  FOR UPDATE USING (public.is_hr());

-- ─── Policy: PARTECIPANTI ────────────────────────────────────────
CREATE POLICY "Partecipante vede le proprie convocazioni" ON public.incontri_partecipanti
  FOR SELECT USING (utente_id = auth.uid() OR public.is_hr());

CREATE POLICY "HR gestisce partecipanti" ON public.incontri_partecipanti
  FOR ALL USING (public.is_hr());

CREATE POLICY "Partecipante conferma presenza" ON public.incontri_partecipanti
  FOR UPDATE USING (utente_id = auth.uid());

-- ─── Policy: NOTIFICHE ───────────────────────────────────────────
CREATE POLICY "Utente vede proprie notifiche" ON public.notifiche
  FOR SELECT USING (destinatario_id = auth.uid() OR public.is_hr());

CREATE POLICY "HR crea notifiche" ON public.notifiche
  FOR INSERT WITH CHECK (public.is_hr());

CREATE POLICY "Utente aggiorna proprie notifiche" ON public.notifiche
  FOR UPDATE USING (destinatario_id = auth.uid() OR public.is_hr());

-- ─── Policy: BACHECA ─────────────────────────────────────────────
CREATE POLICY "Tutti leggono bacheca" ON public.bacheca
  FOR SELECT USING (TRUE);

CREATE POLICY "Solo HR scrive bacheca" ON public.bacheca
  FOR ALL USING (public.is_hr());

-- ─── Policy: TIMBRATURE ──────────────────────────────────────────
CREATE POLICY "Lavoratore vede proprie timbrature" ON public.timbrature
  FOR SELECT USING (utente_id = auth.uid() OR public.is_hr());

CREATE POLICY "Lavoratore inserisce timbratura" ON public.timbrature
  FOR INSERT WITH CHECK (utente_id = auth.uid());

CREATE POLICY "HR gestisce timbrature" ON public.timbrature
  FOR ALL USING (public.is_hr());

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: crea profilo utente automaticamente dopo la registrazione
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.utenti (id, email, nome, cognome, reparto, ruolo, av_init)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Nuovo'),
    COALESCE(NEW.raw_user_meta_data->>'cognome', 'Utente'),
    COALESCE(NEW.raw_user_meta_data->>'reparto', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'worker'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'nome', 'N'), 1) ||
          LEFT(COALESCE(NEW.raw_user_meta_data->>'cognome', 'U'), 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
