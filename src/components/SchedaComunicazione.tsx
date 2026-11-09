import Link from "next/link";
import { dataIt } from "@/lib/domain/date";
import type { Comunicazione } from "@/lib/domain/tipi";
import { PulsanteEvidenza } from "./PulsanteEvidenza";

/** Una comunicazione della bacheca. Le fissate hanno il bordo e l'etichetta "In evidenza". */
export function SchedaComunicazione({ c, staff, oggi }: { c: Comunicazione; staff: boolean; oggi?: string }) {
  const data = dataIt(c.created_at.slice(0, 10));
  return (
    <article className={`card comunicazione ${c.in_evidenza ? "in-evidenza" : ""}`}>
      <div className="testata">
        <div className="stack-s" style={{ gap: 2, minWidth: 0 }}>
          {c.in_evidenza && <span className="etichetta-evidenza">📌 In evidenza</span>}
          <b className="comunicazione-titolo">{c.titolo}</b>
          <span className="hint">
            {data}{c.autore_nome && ` · ${c.autore_nome}`}
            {c.scade_il && oggi && (c.scade_il >= oggi ? ` · fino al ${dataIt(c.scade_il)}` : ` · scaduta il ${dataIt(c.scade_il)}`)}
          </span>
        </div>
        {staff && (
          <div className="bar">
            <PulsanteEvidenza id={c.id} inEvidenza={c.in_evidenza} />
            <Link className="btn small" href={`/bacheca/${c.id}`}>Modifica</Link>
          </div>
        )}
      </div>
      {c.testo && <p className="descrizione">{c.testo}</p>}
    </article>
  );
}
