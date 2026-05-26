# PeopleDesk — Portale HR Aziendale

Progetto Next.js 14 + Supabase. Guida completa per installazione, test locale e deploy.

---

## 1. Prerequisiti

- **Node.js 18+** — scarica da https://nodejs.org
- **Account Supabase** — gratuito su https://supabase.com
- **Git** (opzionale ma consigliato)

Verifica che Node sia installato:
```bash
node -v   # deve mostrare v18 o superiore
npm -v
```

---

## 2. Installazione locale (test sul tuo computer)

### 2a. Copia i file del progetto
Decomprimi la cartella `peopledesk` dove vuoi (es. sul Desktop).

### 2b. Installa le dipendenze
```bash
cd peopledesk
npm install
```

### 2c. Configura Supabase

1. Vai su https://supabase.com → **New project**
2. Dai un nome (es. "peopledesk"), scegli la regione più vicina (eu-west per Italia)
3. Aspetta che il progetto si avvii (~2 minuti)
4. Vai su **Settings → API** e copia:
   - `Project URL`  → es. `https://abcxyz.supabase.co`
   - `anon public key` → la chiave lunga che inizia con `eyJ...`

### 2d. Crea il file .env.local
Nella cartella `peopledesk`, crea un file chiamato `.env.local` (non .env.example):
```
NEXT_PUBLIC_SUPABASE_URL=https://IL-TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_NAME=PeopleDesk
```

### 2e. Crea il database
1. In Supabase → **SQL Editor** → **New Query**
2. Copia tutto il contenuto del file `supabase-schema.sql`
3. Incolla nel editor e premi **Run**
4. Deve mostrare "Success" senza errori

### 2f. Crea l'utente HR iniziale
Sempre nell'SQL Editor, esegui questo per creare l'HR (cambia email e password):
```sql
-- Questo crea l'utente tramite la funzione di Supabase Auth
-- Eseguilo dall'Authentication → Users → Add user in Supabase
```
Oppure vai su **Authentication → Users → Add user** e inserisci:
- Email: `hr@tuaazienda.it`
- Password: `Admin2026!`
- Poi aggiorna manualmente la tabella `utenti` per impostare `ruolo = 'hr'`

### 2g. Avvia il server di sviluppo
```bash
npm run dev
```

Apri il browser su: **http://localhost:3000**

---

## 3. Test su smartphone (rete locale)

Per testare su telefono senza pubblicare online:

### Opzione A — stesso Wi-Fi
```bash
npm run dev -- --hostname 0.0.0.0
```
Poi sul telefono apri: `http://[IP-DEL-TUO-PC]:3000`

Trova il tuo IP con:
- Mac/Linux: `ifconfig | grep inet`
- Windows: `ipconfig` → IPv4 Address

### Opzione B — ngrok (tunnel pubblico temporaneo)
```bash
npm install -g ngrok
ngrok http 3000
```
Ngrok ti dà un URL tipo `https://abc123.ngrok.io` accessibile da qualsiasi dispositivo.

---

## 4. Deploy su Vercel (pubblicazione reale)

### 4a. Crea account Vercel
Vai su https://vercel.com → Sign up con GitHub (gratuito)

### 4b. Carica il progetto su GitHub
```bash
git init
git add .
git commit -m "Initial commit"
# Crea repository su github.com, poi:
git remote add origin https://github.com/TUO-UTENTE/peopledesk.git
git push -u origin main
```

### 4c. Connetti a Vercel
1. Su Vercel → **New Project** → importa il repository GitHub
2. Vai su **Settings → Environment Variables** e aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_NAME`
3. Clicca **Deploy**

L'app sarà online su un URL tipo: `https://peopledesk.vercel.app`

### 4d. Dominio personalizzato (opzionale)
In Vercel → **Settings → Domains** → aggiungi `hr.tuaazienda.it`
Il dominio costa ~10€/anno da Aruba o Namecheap.

---

## 5. Struttura del progetto

```
peopledesk/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/          ← Pagina login
│   │   │   ├── registrati/     ← Registrazione dipendente
│   │   │   └── cambia-password/← Primo accesso HR
│   │   ├── dashboard/
│   │   │   ├── hr/             ← Tutte le pagine HR
│   │   │   └── worker/         ← Tutte le pagine lavoratore
│   │   ├── layout.tsx          ← Layout root con provider
│   │   └── globals.css         ← CSS globale + design tokens
│   ├── components/
│   │   ├── layout/Sidebar.tsx  ← Sidebar con nav dinamica
│   │   └── shared/             ← Componenti condivisi
│   ├── hooks/useAuth.tsx       ← Context autenticazione
│   ├── lib/
│   │   ├── api.ts              ← Tutte le chiamate Supabase
│   │   └── supabase/           ← Client browser e server
│   └── types/index.ts          ← TypeScript types
├── supabase-schema.sql         ← Schema DB da eseguire su Supabase
├── .env.example                ← Template variabili d'ambiente
└── package.json
```

---

## 6. Credenziali demo (dopo setup)

| Ruolo | Email | Password |
|-------|-------|----------|
| HR | hr@tuaazienda.it | Admin2026! (da cambiare al primo accesso) |
| Dipendente | (si registra autonomamente) | (scelta al signup) |

---

## 7. Personalizzazione per il cliente

Per cambiare nome app, logo e colori modifica:
- `.env.local` → `NEXT_PUBLIC_APP_NAME=NomeCliente`
- `src/app/globals.css` → variabile `--accent` per il colore principale

---

## Problemi comuni

**`npm install` fallisce** → Verifica Node versione 18+: `node -v`

**Pagina bianca dopo login** → Controlla le env variables nel `.env.local`

**"relation does not exist"** → Lo schema SQL non è stato eseguito su Supabase

**NFC non funziona su iPhone** → Comportamento atteso: Safari non supporta Web NFC API
