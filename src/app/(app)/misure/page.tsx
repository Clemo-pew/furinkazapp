import type { Metadata } from "next";
import Link from "next/link";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti, misureDelDojo } from "@/lib/data/query";
import { meseCorrente, meseEsteso, primoDelMese } from "@/lib/domain/date";
import { MISURE, valorePrecedente } from "@/lib/domain/misure";
import { SceltaMese } from "@/components/SceltaMese";
import { SchedaMisure } from "./SchedaMisure";

export const metadata: Metadata = { title: "Misure del mese" };

export default async function MisureDelMese({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const c = await contestoStaff();
  const richiesto = (await searchParams).mese;
  const mese = richiesto && /^\d{4}-\d{2}$/.test(richiesto) ? richiesto : meseCorrente();
  const giorno = primoDelMese(mese);
  const [atleti, misure] = await Promise.all([elencoAtleti(c.dojo.id), misureDelDojo(c.dojo.id)]);
  const fatti = atleti.filter((a) => misure.some((m) => m.atleta_id === a.id && m.mese === giorno)).length;

  if (!atleti.length) {
    return (
      <div className="list"><div className="empty">
        <b>Prima aggiungi gli atleti.</b>
        <Link className="btn" href="/atleti/nuovo">Aggiungi atleta</Link>
      </div></div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="testata">
          <div className="stack-s">
            <h1 style={{ textTransform: "capitalize" }}>{meseEsteso(mese)}</h1>
            <p className="hint">{fatti} di {atleti.length} atleti misurati. Lascia vuoto ciò che non hai rilevato.</p>
          </div>
          <SceltaMese mese={mese} />
        </div>
      </div>
      {atleti.map((a) => {
        const mie = misure.filter((m) => m.atleta_id === a.id);
        const corrente = mie.find((m) => m.mese === giorno);
        const precedenti = Object.fromEntries(MISURE.map((m) => [m.chiave, valorePrecedente(mie, m.chiave, giorno)]));
        return (
          <SchedaMisure key={`${a.id}-${mese}-${corrente?.id ?? "nuovo"}`} atleta={{ id: a.id, nome: a.nome }} mese={mese}
            valori={corrente?.valori ?? null} precedenti={precedenti} puoEliminare={c.ruolo === "admin"} />
        );
      })}
    </>
  );
}
