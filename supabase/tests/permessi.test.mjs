import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

const db = new PGlite({ extensions: { pgcrypto } });
const dir = new URL("../migrations/", import.meta.url);
const sql = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort().map(f => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
`);
await db.exec(sql);
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant all on all tables in schema public to authenticated;
`);

const U = { C: "00000000-0000-0000-0000-00000000000c", I: "00000000-0000-0000-0000-00000000000a",
            A: "00000000-0000-0000-0000-0000000000a1", X: "00000000-0000-0000-0000-0000000000ff" };
for (const [k, id] of Object.entries(U)) await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, $2)`, [id, { nome: "Utente " + k }]);

let fails = 0;
const as = async (u, q, params = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${U[u]}', false); set role authenticated;`);
  try { return await db.query(q, params); } finally { await db.exec("reset role"); }
};
const ok = (cond, msg) => { console.log((cond ? "OK   " : "FAIL ") + msg); if (!cond) fails++; };
const throws = async (fn, msg) => { try { await fn(); ok(false, msg + " (non ha dato errore)"); } catch (e) { ok(true, msg + " → " + e.message.split("\n")[0]); } };

const dojo = (await as("C", `select public.crea_dojo('Karate Palermo') as id`)).rows[0].id;
ok(!!dojo, "il coach crea il dojo");
const a1 = (await as("C", `insert into atleti (dojo_id, nome, sesso, anno_nascita, cintura) values ($1,'Luca','M',2009,4) returning id`, [dojo])).rows[0].id;
const a2 = (await as("C", `insert into atleti (dojo_id, nome, sesso, anno_nascita, cintura) values ($1,'Marco','M',2008,5) returning id`, [dojo])).rows[0].id;
await as("C", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-10-01','{"peso":63.2}'), ($1,$3,'2026-10-01','{"peso":70}')`, [dojo, a1, a2]);
await throws(() => as("C", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-10-15','{}')`, [dojo, a1]), "il mese deve essere il primo giorno");

const inc = (await as("C", `select public.salva_incontro($1) as id`, [{ dojo_id: dojo, data: "2026-10-20", aka_atleta_id: a1, aka_nome: "Luca", ao_atleta_id: a2, ao_nome: "Marco",
  punti: [{ lato: "ao", tecnica: "mawashi", zona: "jodan", parte: "sx", situazione: "contrattacco", valore: 3 }, { lato: "aka", tecnica: "gyaku", zona: "chudan", parte: "c", situazione: "attacco", valore: 1 }] }])).rows[0].id;
ok((await as("C", `select count(*)::int n from punti where incontro_id=$1`, [inc])).rows[0].n === 2, "incontro salvato con 2 punti");
await as("C", `select public.salva_incontro($1)`, [{ dojo_id: dojo, aka_atleta_id: a2, aka_nome: "Marco", ao_nome: "Esterno Rossi", punti: [] }]);

const codA = (await as("C", `insert into inviti (dojo_id, ruolo, atleta_id) values ($1,'atleta',$2) returning codice`, [dojo, a1])).rows[0].codice;
ok(/^[A-Z2-9]{8}$/.test(codA), "codice invito generato: " + codA);
await as("A", `select public.accetta_invito($1)`, [codA.toLowerCase()]);
await throws(() => as("X", `select public.accetta_invito($1)`, [codA]), "un codice già usato non vale più");

// atleta
ok((await as("A", `select count(*)::int n from atleti`)).rows[0].n === 2, "l'atleta vede tutti gli atleti della squadra");
ok((await as("A", `select atleta_id from misure`)).rows.every((r) => r.atleta_id === a1), "l'atleta vede solo le proprie misure");
ok((await as("A", `select count(*)::int n from misure where atleta_id=$1`, [a2])).rows[0].n === 0, "l'atleta non vede le misure degli altri");
ok((await as("A", `select count(*)::int n from incontri`)).rows[0].n === 2, "l'atleta vede tutti gli incontri della squadra");
ok((await as("A", `select count(*)::int n from punti`)).rows[0].n === 2, "l'atleta vede i punti degli incontri");
ok((await as("A", `update misure set valori='{"peso":1}' where atleta_id=$1 returning id`, [a2])).rows.length === 0, "l'atleta non può modificare le misure degli altri");
ok((await as("A", `delete from incontri returning id`)).rows.length === 0, "l'atleta non può cancellare incontri");
ok((await as("A", `select count(*)::int n from dojos`)).rows[0].n === 1, "l'atleta vede il proprio dojo");
await throws(() => as("A", `insert into misure (dojo_id, atleta_id, mese) values ($1,$2,'2026-09-01')`, [dojo, a2]), "l'atleta non può scrivere misure di altri");
ok((await as("A", `update atleti set cintura=10 where id=$1 returning id`, [a1])).rows.length === 0, "l'atleta non può modificare la propria scheda");
ok((await as("A", `select count(*)::int n from inviti`)).rows[0].n === 0, "l'atleta non vede gli inviti");

// istruttore
const codI = (await as("C", `insert into inviti (dojo_id, ruolo) values ($1,'istruttore') returning codice`, [dojo])).rows[0].codice;
await as("I", `select public.accetta_invito($1)`, [codI]);
ok((await as("I", `select count(*)::int n from atleti`)).rows[0].n === 2, "l'istruttore vede tutti gli atleti");
await throws(() => as("I", `insert into inviti (dojo_id, ruolo) values ($1,'istruttore')`, [dojo]), "l'istruttore non può invitare altri istruttori");
ok((await as("I", `insert into inviti (dojo_id, ruolo, atleta_id) values ($1,'atleta',$2) returning codice`, [dojo, a2])).rows.length === 1, "l'istruttore può invitare un atleta");
ok((await as("I", `delete from membri where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "l'istruttore non può rimuovere membri");

// valutazioni
await as("C", `insert into valutazioni (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-10-01','{"velocita":7}'), ($1,$3,'2026-10-01','{"velocita":9}')`, [dojo, a1, a2]);
ok((await as("A", `select count(*)::int n from valutazioni`)).rows[0].n === 0, "l'Allievo non vede nessuna valutazione, nemmeno le proprie");
await throws(() => as("A", `insert into valutazioni (dojo_id, atleta_id, mese) values ($1,$2,'2026-09-01')`, [dojo, a1]), "l'atleta non può scrivere valutazioni");
ok((await as("A", `update valutazioni set valori='{"velocita":10}' returning id`)).rows.length === 0, "l'atleta non può alzarsi i voti");
ok((await as("I", `select count(*)::int n from valutazioni`)).rows[0].n === 2, "l'istruttore vede tutte le valutazioni");
ok((await as("X", `select count(*)::int n from valutazioni where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede valutazioni");

// l'istruttore modifica misure e valutazioni
ok((await as("I", `update misure set valori='{"peso":64}' where atleta_id=$1 returning id`, [a1])).rows.length === 1, "l'istruttore può modificare le misure");
ok((await as("I", `update valutazioni set valori='{"velocita":8}' where atleta_id=$1 returning id`, [a1])).rows.length === 1, "l'istruttore può modificare le valutazioni");
ok((await as("I", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-09-01','{"peso":62}') returning id`, [dojo, a1])).rows.length === 1, "l'istruttore può inserire misure");

// cambio ruolo
ok((await as("I", `update membri set ruolo='admin' where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "l'istruttore non può cambiare i ruoli");
ok((await as("A", `update membri set ruolo='admin' where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "l'atleta non può promuoversi");
ok((await as("C", `update membri set ruolo='admin' where user_id=$1 returning user_id`, [U.C])).rows.length === 0, "l'amministratore non cambia il proprio ruolo (resta sempre almeno un admin)");
ok((await as("C", `update membri set ruolo='istruttore' where dojo_id=$1 and user_id=$2 returning user_id`, [dojo, U.A])).rows.length === 1, "l'amministratore promuove un atleta a istruttore");
ok((await as("A", `insert into valutazioni (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-09-01','{"tecnica":6}') returning id`, [dojo, a2])).rows.length === 1, "da istruttore può inserire valutazioni");
ok((await as("A", `select atleta_id from membri where user_id=$1`, [U.A])).rows[0].atleta_id === a1, "da istruttore resta collegato alla sua scheda atleta");
ok((await as("C", `update membri set ruolo='atleta' where dojo_id=$1 and user_id=$2 returning user_id`, [dojo, U.A])).rows.length === 1, "l'amministratore lo riporta ad atleta");
await throws(() => as("C", `update membri set ruolo='atleta' where dojo_id=$1 and user_id=$2`, [dojo, U.I]), "un istruttore senza scheda non può diventare atleta");

// Allievo e Allievo+
ok((await as("A", `select count(*)::int n from valutazioni`)).rows[0].n === 0, "da Allievo non vede le valutazioni");
ok((await as("I", `update membri set ruolo='atleta_plus' where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "l'istruttore non può dare Allievo+");
ok((await as("C", `update membri set ruolo='atleta_plus' where dojo_id=$1 and user_id=$2 returning user_id`, [dojo, U.A])).rows.length === 1, "l'amministratore passa l'allievo ad Allievo+");
ok((await as("A", `select count(*)::int n from valutazioni`)).rows[0].n === 3, "l'Allievo+ vede le valutazioni di tutta la squadra");
ok((await as("A", `select count(*)::int n from misure where atleta_id=$1`, [a2])).rows[0].n === 0, "anche l'Allievo+ non vede le misure degli altri");
ok((await as("I", `select count(*)::int n from misure`)).rows[0].n === 3, "l'istruttore vede le misure di tutti");
await throws(() => as("A", `insert into valutazioni (dojo_id, atleta_id, mese) values ($1,$2,'2026-08-01')`, [dojo, a1]), "l'Allievo+ non può scrivere valutazioni");
ok((await as("A", `update valutazioni set valori='{"velocita":10}' returning id`)).rows.length === 0, "l'Allievo+ non può cambiare i voti");
ok((await as("A", `update membri set ruolo='admin' where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "l'Allievo+ non può promuoversi");
await throws(() => as("C", `update membri set ruolo='atleta_plus' where dojo_id=$1 and user_id=$2`, [dojo, U.I]), "un istruttore senza scheda non può diventare Allievo+");
await throws(() => as("C", `insert into inviti (dojo_id, ruolo) values ($1,'atleta_plus')`, [dojo]), "un invito Allievo+ richiede una scheda");
ok((await as("C", `insert into inviti (dojo_id, ruolo, atleta_id) values ($1,'atleta_plus',$2) returning codice`, [dojo, a2])).rows.length === 1, "l'amministratore può invitare un Allievo+");
await throws(() => as("I", `insert into inviti (dojo_id, ruolo, atleta_id) values ($1,'atleta_plus',$2)`, [dojo, a2]), "l'istruttore non può invitare un Allievo+");
ok((await as("C", `update membri set ruolo='atleta' where dojo_id=$1 and user_id=$2 returning user_id`, [dojo, U.A])).rows.length === 1, "l'amministratore lo riporta ad Allievo");
ok((await as("A", `select count(*)::int n from valutazioni`)).rows[0].n === 0, "tornato Allievo non vede più le valutazioni");

// diario allenamenti
const all1 = (await as("I", `select public.salva_allenamento($1) as id`, [{ dojo_id: dojo, data: "2026-10-20", durata_min: "90", argomenti: ["kihon", "kumite"], descrizione: "Riscaldamento, kihon in linea, randori", presenti: [a1, a2] }])).rows[0].id;
ok((await as("C", `select count(*)::int n from presenze where allenamento_id=$1`, [all1])).rows[0].n === 2, "l'istruttore registra un allenamento con 2 presenti");
ok((await as("C", `select argomenti from allenamenti where id=$1`, [all1])).rows[0].argomenti.join() === "kihon,kumite", "argomenti salvati");
await as("C", `select public.salva_allenamento($1)`, [{ id: all1, dojo_id: dojo, data: "2026-10-20", durata_min: "", argomenti: ["kata"], descrizione: "Corretto", presenti: [a2] }]);
const all1r = (await as("C", `select durata_min, descrizione from allenamenti where id=$1`, [all1])).rows[0];
ok(all1r.durata_min === null && all1r.descrizione === "Corretto", "la modifica aggiorna l'allenamento");
ok((await as("C", `select count(*)::int n from presenze where allenamento_id=$1`, [all1])).rows[0].n === 1, "la modifica aggiorna le presenze");
ok((await as("A", `select count(*)::int n from allenamenti`)).rows[0].n === 1, "l'atleta legge il diario");
ok((await as("A", `select count(*)::int n from presenze`)).rows[0].n === 1, "l'atleta vede le presenze");
await throws(() => as("A", `select public.salva_allenamento($1)`, [{ dojo_id: dojo, descrizione: "x", presenti: [] }]), "l'atleta non può scrivere nel diario");
ok((await as("A", `delete from allenamenti returning id`)).rows.length === 0, "l'atleta non può cancellare allenamenti");

// kata
ok((await as("I", `insert into kata_conosciuti (atleta_id, dojo_id, kata, dal) values ($1,$2,'heian_shodan','2025-09-01'), ($1,$2,'heian_nidan',null) returning kata`, [a1, dojo])).rows.length === 2, "l'istruttore segna i kata conosciuti");
await throws(() => as("I", `insert into kata_conosciuti (atleta_id, dojo_id, kata) values ($1,$2,'Heian Shodan!')`, [a1, dojo]), "le chiavi dei kata sono controllate");
ok((await as("A", `select count(*)::int n from kata_conosciuti`)).rows[0].n === 2, "l'atleta vede i kata conosciuti");
await throws(() => as("A", `insert into kata_conosciuti (atleta_id, dojo_id, kata) values ($1,$2,'tekki_shodan')`, [a1, dojo]), "l'atleta non può aggiungersi kata");
ok((await as("I", `update valutazioni set kata='{"heian_shodan":7.5}' where atleta_id=$1 and mese='2026-10-01' returning kata`, [a1])).rows[0].kata.heian_shodan === 7.5, "l'istruttore vota i kata nella valutazione");
ok((await as("A", `update valutazioni set kata='{"heian_shodan":10}' returning id`)).rows.length === 0, "l'atleta non può cambiare i voti dei kata");
ok((await as("X", `select count(*)::int n from kata_conosciuti where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede i kata");

// video dei kata
ok((await as("I", `insert into kata_video (dojo_id, kata, youtube_id) values ($1,'tekki_shodan','AbCdEfGhI_-') returning kata`, [dojo])).rows.length === 1, "l'istruttore imposta il video di un kata");
await throws(() => as("I", `insert into kata_video (dojo_id, kata, youtube_id) values ($1,'jion','non-valido')`, [dojo]), "l'ID del video è controllato");
ok((await as("A", `select count(*)::int n from kata_video`)).rows[0].n === 1, "l'allievo vede i video");
await throws(() => as("A", `insert into kata_video (dojo_id, kata, youtube_id) values ($1,'jion','AbCdEfGhI_-')`, [dojo]), "l'allievo non può cambiare i video");
ok((await as("X", `select count(*)::int n from kata_video where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede i video del dojo");

// l'allievo inserisce le proprie misure
ok((await as("A", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-07-01','{"peso":62.5}') returning id`, [dojo, a1])).rows.length === 1, "l'allievo inserisce le proprie misure");
ok((await as("A", `update misure set valori='{"peso":62.8}' where atleta_id=$1 and mese='2026-07-01' returning id`, [a1])).rows.length === 1, "l'allievo corregge le proprie misure");
await throws(() => as("A", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-07-01','{"peso":1}')`, [dojo, a2]), "l'allievo non inserisce misure di altri");
ok((await as("A", `update misure set valori='{"peso":1}' where atleta_id=$1 returning id`, [a2])).rows.length === 0, "l'allievo non modifica misure di altri");
await throws(() => as("A", `update misure set atleta_id=$1 where atleta_id=$2 and mese='2026-07-01'`, [a2, a1]), "l'allievo non sposta le proprie misure su un altro atleta");
ok((await as("A", `delete from misure where atleta_id=$1 returning id`, [a1])).rows.length === 0, "l'allievo non può eliminare misure");
await throws(() => as("A", `insert into valutazioni (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-07-01','{"tecnica":10}')`, [dojo, a1]), "l'allievo continua a non poter scrivere valutazioni");
await throws(() => as("X", `insert into misure (dojo_id, atleta_id, mese, valori) values ($1,$2,'2026-06-01','{}')`, [dojo, a1]), "un estraneo non inserisce misure");

// certificato medico
ok((await as("I", `insert into certificati_medici (atleta_id, dojo_id, tipo, scadenza) values ($1,$3,'agonistico','2027-03-31'), ($2,$3,'non_agonistico','2026-12-15') returning atleta_id`, [a1, a2, dojo])).rows.length === 2, "l'istruttore inserisce i certificati");
await throws(() => as("I", `insert into certificati_medici (atleta_id, dojo_id, tipo, scadenza) values ($1,$2,'sportivo','2027-01-01') on conflict (atleta_id) do update set tipo=excluded.tipo`, [a1, dojo]), "il tipo di certificato è controllato");
ok((await as("A", `select atleta_id from certificati_medici`)).rows.map((r) => r.atleta_id).join() === a1, "l'allievo vede solo il proprio certificato");
ok((await as("A", `update certificati_medici set scadenza='2030-01-01' where atleta_id=$1 returning atleta_id`, [a1])).rows.length === 0, "l'allievo non modifica il proprio certificato");
await throws(() => as("A", `insert into certificati_medici (atleta_id, dojo_id, tipo, scadenza) values ($1,$2,'agonistico','2030-01-01')`, [a2, dojo]), "l'allievo non inserisce certificati");
ok((await as("C", `select count(*)::int n from certificati_medici`)).rows[0].n === 2, "l'amministratore vede tutti i certificati");
ok((await as("X", `select count(*)::int n from certificati_medici where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede i certificati");

// eventi
const ev = (await as("I", `insert into eventi (dojo_id, titolo, tipo, data_inizio, data_fine, ora, luogo, link) values ($1,'Campionato regionale','gara','2026-11-15','2026-11-16','09:30','PalaUnipa','https://fijlkam.it') returning id`, [dojo])).rows[0]?.id;
ok(!!ev, "l'istruttore crea un evento");
await throws(() => as("I", `insert into eventi (dojo_id, titolo, data_inizio, data_fine) values ($1,'x','2026-11-15','2026-11-10')`, [dojo]), "la fine non può precedere l'inizio");
await throws(() => as("I", `insert into eventi (dojo_id, titolo, data_inizio, ora) values ($1,'x','2026-11-15','25:00')`, [dojo]), "l'ora è controllata");
await throws(() => as("I", `insert into eventi (dojo_id, titolo, data_inizio, link) values ($1,'x','2026-11-15','javascript:alert(1)')`, [dojo]), "il link deve essere http/https");
ok((await as("A", `select count(*)::int n from eventi`)).rows[0].n === 1, "l'allievo vede gli eventi");
await throws(() => as("A", `insert into eventi (dojo_id, titolo, data_inizio) values ($1,'Festa','2026-12-20')`, [dojo]), "l'allievo non crea eventi");
ok((await as("A", `update eventi set titolo='x' returning id`)).rows.length === 0, "l'allievo non modifica eventi");
ok((await as("A", `delete from eventi returning id`)).rows.length === 0, "l'allievo non elimina eventi");
ok((await as("X", `select count(*)::int n from eventi where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede gli eventi");

// bacheca
ok((await as("I", `insert into comunicazioni (dojo_id, titolo, testo, in_evidenza, scade_il) values ($1,'Palestra chiusa','Lunedì 1 dicembre la palestra resta chiusa.',true,'2026-12-02') returning id`, [dojo])).rows.length === 1, "l'istruttore pubblica una comunicazione");
ok((await as("A", `select count(*)::int n from comunicazioni`)).rows[0].n === 1, "l'allievo legge la bacheca");
await throws(() => as("A", `insert into comunicazioni (dojo_id, titolo) values ($1,'Ciao')`, [dojo]), "l'allievo non pubblica in bacheca");
ok((await as("A", `update comunicazioni set in_evidenza=false returning id`)).rows.length === 0, "l'allievo non modifica le comunicazioni");
ok((await as("A", `delete from comunicazioni returning id`)).rows.length === 0, "l'allievo non elimina le comunicazioni");
await throws(() => as("I", `insert into comunicazioni (dojo_id, titolo) values ($1,'   ')`, [dojo]), "il titolo è obbligatorio");
ok((await as("X", `select count(*)::int n from comunicazioni where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non legge la bacheca");

// note dell'allenatore riservate
ok((await as("C", `insert into note_atleti (atleta_id, dojo_id, note) values ($1,$2,'Distorsione caviglia, a riposo 2 settimane') returning atleta_id`, [a2, dojo])).rows.length === 1, "l'amministratore scrive una nota sull'atleta");
ok((await as("I", `select count(*)::int n from note_atleti`)).rows[0].n === 1, "l'istruttore legge le note");
ok((await as("A", `select count(*)::int n from note_atleti`)).rows[0].n === 0, "l'allievo non legge le note, nemmeno le proprie");
await throws(() => as("A", `insert into note_atleti (atleta_id, dojo_id, note) values ($1,$2,'x')`, [a1, dojo]), "l'allievo non scrive note");

// consensi privacy
ok((await as("A", `insert into consensi_privacy (dojo_id, versione, letto, consenso_salute, accettato_da, nome_genitore) values ($1,'v1',true,true,'genitore','Maria Ferrara') returning user_id`, [dojo])).rows[0].user_id === U.A, "l'allievo registra il proprio consenso");
await throws(() => as("A", `insert into consensi_privacy (user_id, dojo_id, versione, letto, accettato_da) values ($1,$2,'v1',true,'interessato')`, [U.I, dojo]), "non si registra il consenso per conto di un altro utente");
await throws(() => as("I", `insert into consensi_privacy (dojo_id, versione, letto, accettato_da) values ($1,'v1',false,'interessato')`, [dojo]), "la lettura dell'informativa è obbligatoria");
await throws(() => as("I", `insert into consensi_privacy (dojo_id, versione, letto, accettato_da) values ($1,'v1',true,'genitore')`, [dojo]), "se accetta un genitore serve il suo nome");
ok((await as("A", `update consensi_privacy set consenso_salute=false where versione='v1' returning user_id`)).rows.length === 1, "l'allievo può revocare il consenso");
ok((await as("C", `select count(*)::int n from consensi_privacy where user_id=$1`, [U.A])).rows[0].n === 1, "l'amministratore vede i consensi del dojo");
ok((await as("C", `update consensi_privacy set consenso_salute=true where user_id=$1 returning user_id`, [U.A])).rows.length === 0, "lo staff non può cambiare il consenso di un altro");
ok((await as("X", `select count(*)::int n from consensi_privacy where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede i consensi");

// altra società: i dati restano separati
const dojo2 = (await as("X", `select public.crea_dojo('Altro Dojo') as id`)).rows[0].id;
await as("X", `insert into atleti (dojo_id, nome, sesso) values ($1,'Esterno','M')`, [dojo2]);
ok((await as("A", `select count(*)::int n from atleti where dojo_id=$1`, [dojo2])).rows[0].n === 0, "un atleta non vede gli atleti di un'altra società");
ok((await as("X", `select count(*)::int n from atleti where dojo_id=$1`, [dojo])).rows[0].n === 0, "un'altra società non vede i nostri atleti");

// estraneo
ok((await as("X", `select count(*)::int n from atleti where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede atleti");
ok((await as("X", `select count(*)::int n from incontri where dojo_id=$1`, [dojo])).rows[0].n === 0, "un estraneo non vede incontri");
await throws(() => as("X", `insert into atleti (dojo_id, nome, sesso) values ($1,'Hacker','M')`, [dojo]), "un estraneo non può aggiungere atleti");
await throws(() => as("X", `select public.salva_incontro($1)`, [{ dojo_id: dojo, aka_nome: "a", ao_nome: "b", punti: [] }]), "un estraneo non può salvare incontri");

// cancellazione atleta
await as("C", `delete from atleti where id=$1`, [a1]);
const r = (await as("C", `select aka_atleta_id, aka_nome from incontri where id=$1`, [inc])).rows[0];
ok(r.aka_atleta_id === null && r.aka_nome === "Luca", "eliminando un atleta gli incontri restano con il nome");
ok((await as("C", `select count(*)::int n from membri where user_id=$1`, [U.A])).rows[0].n === 0, "eliminando un atleta si toglie anche il suo accesso");

console.log(fails ? `\n${fails} controlli falliti` : "\nTutti i controlli superati");
process.exit(fails ? 1 : 0);
