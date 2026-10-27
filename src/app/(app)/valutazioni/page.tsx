import type { Metadata } from "next";
import Link from "next/link";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti, valutazioniDi } from "@/lib/data/query";
import { meseCorrente, meseEsteso, primoDelMese } from "@/lib/domain/date";
import { SCALA } from "@/lib/domain/valutazioni";
import type { Valutazione } from "@/lib/domain/tipi";
import { SceltaMese } from "@/components/SceltaMese";
import { SchedaValutazione } from "./SchedaValutazione";

export const metadata: Metadata = { title: "Valutazioni" };

export default async function Valutazioni({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const c = await contestoStaff();
  const richiesto = (await searchParams).mese;
  const mese = richiesto && /^\d{4}-\d{2}$/.test(richiesto) ? richiesto : meseCorrente();
  const giorno = primoDelMese(mese);
  const atleti = await elencoAtleti(c.dojo.id);

  let valutazioni: Valutazione[] = [];
  let tabellaMancante = false;
  try {
    valutazioni = await valutazioniDi(atleti.map((a) => a.id));
  } catch {
    tabellaMancante = true;
  }

  if (!atleti.length) {
    return (
      <div className="list"><div className="empty">
        <b>Prima aggiungi gli atleti.</b>
        <Link className="btn" href="/atleti/nuovo">Aggiungi atleta</Link>
      </div></div>
    );
  }
  if (tabellaMancante) {
    return (
      <div className="card">
        <h1>Valutazioni</h1>
        <p className="errore">Manca la tabella delle valutazioni nel database.</p>
        <p className="hint">In Supabase apri SQL Editor → New query, incolla il file <span className="num">supabase/migrations/0002_valutazioni.sql</span> del repository e premi Run. Poi ricarica questa pagina.</p>
      </div>
    );
  }

  const fatti = atleti.filter((a) => valutazioni.some((v) => v.atleta_id === a.id && v.mese === giorno)).length;

  return (
    <>
      <div className="card">
        <div className="testata">
          <div className="stack-s">
            <h1>Valutazioni · <span style={{ textTransform: "capitalize" }}>{meseEsteso(mese)}</span></h1>
            <p className="hint">{fatti} di {atleti.length} atleti valutati. Voti da {SCALA.min} a {SCALA.max}, anche mezzi voti. Lascia vuoto ciò che non hai valutato.</p>
          </div>
          <SceltaMese mese={mese} percorso="/valutazioni" />
        </div>
      </div>
      {atleti.map((a) => {
        const mie = valutazioni.filter((v) => v.atleta_id === a.id);
        const corrente = mie.find((v) => v.mese === giorno);
        const precedente = mie.filter((v) => v.mese < giorno).at(-1);
        return (
          <SchedaValutazione key={`${a.id}-${mese}`} atleta={{ id: a.id, nome: a.nome }} mese={mese}
            valori={corrente?.valori ?? null} note={corrente?.note ?? null} precedenti={precedente?.valori ?? null} />
        );
      })}
    </>
  );
}
