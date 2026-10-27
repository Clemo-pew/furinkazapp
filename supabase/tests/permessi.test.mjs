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
ok((await as("A", `select count(*)::int n from misure`)).rows[0].n === 2, "l'atleta vede le misure di tutta la squadra");
ok((await as("A", `select count(*)::int n from incontri`)).rows[0].n === 2, "l'atleta vede tutti gli incontri della squadra");
ok((await as("A", `select count(*)::int n from punti`)).rows[0].n === 2, "l'atleta vede i punti degli incontri");
ok((await as("A", `update misure set valori='{"peso":1}' returning id`)).rows.length === 0, "l'atleta non può modificare le misure di nessuno");
ok((await as("A", `delete from incontri returning id`)).rows.length === 0, "l'atleta non può cancellare incontri");
ok((await as("A", `select count(*)::int n from dojos`)).rows[0].n === 1, "l'atleta vede il proprio dojo");
await throws(() => as("A", `insert into misure (dojo_id, atleta_id, mese) values ($1,$2,'2026-09-01')`, [dojo, a1]), "l'atleta non può scrivere misure");
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
ok((await as("A", `select count(*)::int n from valutazioni`)).rows[0].n === 2, "l'atleta vede le valutazioni di tutta la squadra");
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
