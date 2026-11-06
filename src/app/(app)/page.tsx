import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { certificatiMedici, elencoAtleti, elencoEventi } from "@/lib/data/query";
import { oggi } from "@/lib/domain/date";
import { PREAVVISO_EVENTO_GIORNI, promemoria } from "@/lib/domain/eventi";
import { statoCertificato } from "@/lib/domain/certificato";
import { MENU } from "@/lib/navigazione";
import { SchedaEvento } from "@/components/SchedaEvento";
import { Certificato } from "@/components/Certificato";

export const metadata: Metadata = { title: "Home" };

const DESCRIZIONI: Record<string, string> = {
  "/squadra": "Atleti, peso, risultati e punti deboli",
  "/misure": "Misure fisiche del mese",
  "/valutazioni": "Voti tecnici del mese",
  "/kumite": "Incontri registrati punto per punto",
  "/diario": "Cosa abbiamo fatto in allenamento",
  "/kata": "Video di esecuzione dei kata",
  "/eventi": "Calendario di gare, stage ed esami",
  "/impostazioni": "Accessi, ruoli e inviti",
};

export default async function Home() {
  const c = await contesto();
  const oggiStr = oggi();
  const [eventi, certificati, atleti] = await Promise.all([
    elencoEventi(c.dojo.id, oggiStr),
    c.staff || c.atletaId ? certificatiMedici(c.dojo.id, c.staff ? undefined : c.atletaId!) : Promise.resolve([]),
    c.staff ? elencoAtleti(c.dojo.id) : Promise.resolve([]),
  ]);
  const vicini = promemoria(eventi ?? [], oggiStr);

  // certificati: lo staff vede il riepilogo della squadra, l'allievo il proprio se non è in regola
  const stati = atleti.map((a) => statoCertificato(certificati.find((x) => x.atleta_id === a.id)?.scadenza, oggiStr));
  const scaduti = stati.filter((s) => s === "scaduto").length;
  const inScadenza = stati.filter((s) => s === "in_scadenza").length;
  const mioCert = !c.staff ? certificati[0] : undefined;
  const mioStato = !c.staff && c.atletaId ? statoCertificato(mioCert?.scadenza, oggiStr) : "valido";

  const scorciatoie = [
    ...(c.atletaId ? [{ href: `/atleti/${c.atletaId}`, etichetta: "Il mio profilo", descrizione: "Misure, kata, presenze e incontri" }] : []),
    ...MENU.filter((v) => v.ruoli.includes(c.ruolo)).map((v) => ({ ...v, descrizione: DESCRIZIONI[v.href] ?? "" })),
  ];

  return (
    <>
      <h1>{c.nomeUtente ? `Ciao, ${c.nomeUtente.split(" ")[0]}` : "Benvenuto"}</h1>

      <section className="card promemoria">
        <div className="testata">
          <h3>Prossimi {PREAVVISO_EVENTO_GIORNI} giorni</h3>
          <Link className="btn small" href="/eventi">Calendario</Link>
        </div>
        {eventi === null ? (
          <p className="hint">Il calendario eventi non è ancora attivo{c.staff ? ": esegui la migrazione 0010_eventi.sql su Supabase." : "."}</p>
        ) : vicini.length ? (
          <div className="list">
            {vicini.map((e) => <SchedaEvento key={e.id} evento={e} oggi={oggiStr} staff={c.staff} />)}
          </div>
        ) : (
          <p className="hint">Nessun evento nelle prossime due settimane.</p>
        )}
      </section>

      {c.staff && (scaduti > 0 || inScadenza > 0) && (
        <Link href="/squadra" className="card avviso-home">
          <b>Certificati medici</b>
          <span className="bar">
            {scaduti > 0 && <span className="cert cert-scaduto">{scaduti} scadut{scaduti === 1 ? "o" : "i"}</span>}
            {inScadenza > 0 && <span className="cert cert-avviso">{inScadenza} in scadenza</span>}
          </span>
        </Link>
      )}
      {!c.staff && c.atletaId && mioStato !== "valido" && (
        <Link href={`/atleti/${c.atletaId}`} className="card avviso-home">
          <Certificato certificato={mioCert} oggi={oggiStr} />
        </Link>
      )}

      <nav className="scorciatoie" aria-label="Sezioni">
        {scorciatoie.map((s) => (
          <Link key={s.href} href={s.href} className="scorciatoia">
            <b>{s.etichetta}</b>
            {s.descrizione && <span className="hint">{s.descrizione}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}
