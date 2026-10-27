# Registro Dojo

App per allenatori di karate: misure fisiche mensili degli atleti e analisi degli incontri di kumite
(dove ogni atleta subisce più punti, con quale tecnica e in quale situazione).

- **Allenatore e istruttori**: gestiscono atleti, misure, incontri e inviti.
- **Atleti**: entrano con un codice invito e vedono solo la propria scheda.

Tecnologie: [Next.js](https://nextjs.org) (pubblicata su [Vercel](https://vercel.com)) e
[Supabase](https://supabase.com) (database e accesso con email e password).

---

## Messa online (circa 15 minuti, una volta sola)

### 1. Database su Supabase
1. Crea un account gratuito su supabase.com e poi **New project**.
   Scegli la regione *Central EU (Frankfurt)* e annota la password del database.
2. Quando il progetto è pronto apri **SQL Editor → New query**, incolla tutto il contenuto di
   `supabase/migrations/0001_schema_iniziale.sql` e premi **Run**. Deve comparire *Success*.
3. Apri **Project Settings → API** e copia i valori **Project URL** e **anon public key**
   (nei progetti nuovi si chiama *publishable key*): servono al punto 3.

### 2. Codice su GitHub
1. Crea un repository su github.com, ad esempio `registro-dojo`, anche privato.
2. Clicca **uploading an existing file** e trascina **il contenuto** della cartella del progetto
   (non la cartella stessa), poi **Commit changes**.

### 3. Pubblicazione su Vercel
1. Su vercel.com accedi con GitHub, poi **Add New → Project** e scegli `registro-dojo`.
2. Apri **Environment Variables** e aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL` = il Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la anon / publishable key
3. Premi **Deploy**. Alla fine ricevi un indirizzo tipo `registro-dojo.vercel.app`.

### 4. Disattivare le email di conferma
L'app non invia email. In Supabase → **Authentication → Sign In / Providers → Email**
disattiva **Confirm email** e salva. Così chi crea l'account entra subito.

È sicuro: chi si registra senza un codice invito non vede nessun dato,
perché può solo creare una società nuova e vuota.

### 5. Primo accesso
Apri l'app, **Crea account**, poi scegli **Sono l'allenatore, creo la società**.
Da **Impostazioni** generi i codici invito per istruttori e atleti.

### Se qualcuno dimentica la password
Senza email non c'è il recupero automatico. In Supabase → **Authentication → Users**
elimina l'utente, poi dall'app genera un nuovo codice invito: la persona crea un nuovo account
e lo inserisce. I dati dell'atleta (misure, incontri) restano, perché sono legati alla sua scheda
e non all'account.

### Limiti del piano gratuito da ricordare
- Dopo **7 giorni senza attività** Supabase mette in pausa il progetto (succede ad esempio ad agosto).
  I dati restano: lo riattivi dal pannello di Supabase con **Restore project**.
- Il piano gratuito **non ha backup automatici**.

---

## Lavorare sul codice in locale

Serve [Node.js](https://nodejs.org) 20 o più recente.

```bash
npm install
cp .env.example .env.local     # inserisci URL e chiave di Supabase
npm run dev                    # apri http://localhost:3000
```

| Comando | Cosa fa |
|---|---|
| `npm run dev` | avvia l'app in locale |
| `npm run build` | controlla che l'app si compili come su Vercel |
| `npm test` | prova la logica (punteggio WKF, statistiche, analisi debolezze, misure) |
| `npm run test:db` | esegue lo schema su un Postgres locale e verifica i permessi di ogni ruolo |

Ogni volta che carichi modifiche su GitHub, Vercel ripubblica l'app da solo.

---

## Come è organizzato il progetto

```
supabase/
  migrations/          schema del database, un file per ogni modifica (0001, 0002, …)
  tests/               verifica automatica dei permessi
src/
  app/                 pagine (ogni cartella è un indirizzo)
    accedi/            accesso e registrazione
    benvenuto/         primo accesso: crea società o inserisci codice invito
    (app)/             tutte le pagine dopo l'accesso, con menu comune
      squadra/         tabella riassuntiva
      atleti/          scheda atleta, nuovo, modifica
      misure/          misure del mese
      kumite/          elenco incontri e registrazione punto per punto
      impostazioni/    nome società, inviti, persone con accesso
  components/          pezzi riusabili (grafico, mappa del corpo, barre, elenchi)
  lib/
    domain/            regole del karate e calcoli, senza database (testabili)
      cinture.ts       gradi e colori
      misure.ts        elenco delle misure fisiche
      kumite.ts        tecniche, zone, punteggio WKF, senshu
      analisi.ts       statistiche e punti deboli
    data/              letture dal database (query.ts) e utente/ruolo corrente (contesto.ts)
    supabase/          collegamento a Supabase
    navigazione.ts     voci del menu e ruoli che le vedono
```

Tre principi tengono il progetto facile da estendere:

1. **Le regole stanno in `lib/domain`**: nessun accesso al database, quindi si provano con `npm test`
   e si riusano in ogni pagina.
2. **I permessi stanno nel database** (Row Level Security in `0001_schema_iniziale.sql`):
   anche un errore nell'interfaccia non può mostrare dati di altri atleti o di altre società.
3. **Ogni dato appartiene a un dojo** (`dojo_id`): l'app è già pronta per più società.

---

## Aggiungere funzioni

### Una nuova misura fisica (es. salto in lungo da fermo)
Aggiungi una riga in `src/lib/domain/misure.ts`:
```ts
{ chiave: "salto", nome: "Salto da fermo", unita: "cm", passo: 1 },
```
Compare subito nel modulo mensile, nella scheda atleta e nel grafico. Non serve toccare il database.

### Una nuova tecnica di kumite
Aggiungi una riga in `TECNICHE` dentro `src/lib/domain/kumite.ts`. Non rinominare le chiavi già usate:
sono salvate negli incontri registrati.

### Una nuova sezione (es. presenze agli allenamenti)
1. **Database**: crea `supabase/migrations/0002_presenze.sql` con la nuova tabella, la colonna `dojo_id`
   e le regole di accesso, copiando lo schema di quelle per `misure`. Eseguilo nel SQL Editor di Supabase.
   Non modificare mai un file di migrazione già eseguito.
2. **Tipi**: aggiungi il tipo in `src/lib/domain/tipi.ts`.
3. **Letture**: aggiungi la funzione in `src/lib/data/query.ts`.
4. **Pagina**: crea `src/app/(app)/presenze/page.tsx`, con le azioni di salvataggio in `azioni.ts`
   accanto alla pagina.
5. **Menu**: aggiungi la voce in `src/lib/navigazione.ts` indicando i ruoli che la vedono.
6. Aggiungi i controlli dei permessi in `supabase/tests/permessi.test.mjs` e lancia `npm run test:db`.

### Idee già previste dallo schema
- **Gare**: gli incontri hanno già il campo `tipo` (allenamento / gara).
- **Più società**: l'utente può appartenere a più dojo e `contesto.ts` legge il dojo scelto
  dal cookie `dojo_attivo`; manca solo il selettore nell'intestazione.
- **Note sull'atleta** e **archiviazione** di chi non si allena più sono già presenti.
