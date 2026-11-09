import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { elencoComunicazioni } from "@/lib/data/query";
import { oggi } from "@/lib/domain/date";
import { dividiBacheca } from "@/lib/domain/bacheca";
import { SchedaComunicazione } from "@/components/SchedaComunicazione";

export const metadata: Metadata = { title: "Bacheca" };

export default async function Bacheca() {
  const c = await contesto();
  const lista = await elencoComunicazioni(c.dojo.id);
  const oggiStr = oggi();

  if (lista === null) {
    return (
      <div className="card">
        <h1>Bacheca</h1>
        <p className="errore">Manca la bacheca nel database.</p>
        <p className="hint">In Supabase apri SQL Editor → New query, incolla il file <span className="num">supabase/migrations/0011_bacheca.sql</span> del repository e premi Run. Poi ricarica questa pagina.</p>
      </div>
    );
  }
  const { attuali, passate } = dividiBacheca(lista, oggiStr);

  return (
    <>
      <div className="testata">
        <h1>Bacheca</h1>
        {c.staff && <Link className="btn primary" href="/bacheca/nuova">+ Nuova comunicazione</Link>}
      </div>
      {!lista.length ? (
        <div className="list"><div className="empty">
          <b>Nessuna comunicazione.</b>
          <p className="hint">{c.staff ? "Pubblica avvisi per tutto il dojo: chiusure, orari, convocazioni. Quelle in evidenza compaiono anche nella Home." : "Qui troverai gli avvisi del dojo."}</p>
        </div></div>
      ) : (
        <>
          {attuali.map((x) => <SchedaComunicazione key={x.id} c={x} staff={c.staff} oggi={oggiStr} />)}
          {passate.length > 0 && (
            <details className="stack-s">
              <summary className="hint" style={{ cursor: "pointer" }}>Comunicazioni passate ({passate.length})</summary>
              <div className="stack" style={{ marginTop: 10 }}>
                {passate.map((x) => <SchedaComunicazione key={x.id} c={x} staff={c.staff} oggi={oggiStr} />)}
              </div>
            </details>
          )}
        </>
      )}
    </>
  );
}
