import { risultato } from "@/lib/domain/kumite";
import { dataIt } from "@/lib/domain/date";
import type { Incontro } from "@/lib/domain/tipi";
import { ElencoPunti } from "./ElencoPunti";
import { EliminaIncontro } from "./EliminaIncontro";

/** Elenco di incontri apribili per vedere i punti. Lo staff può eliminarli. */
export function ElencoIncontri({ incontri, staff }: { incontri: Incontro[]; staff: boolean }) {
  if (!incontri.length) return null;
  return (
    <div className="list">
      {incontri.map((inc) => {
        const r = risultato(inc.punti);
        return (
          <details className="bout" key={inc.id}>
            <summary>
              <span className={`n t-aka ${r.vincitore === "aka" ? "w" : ""}`}>{inc.aka_nome}</span>
              <span className="sc">{r.aka} – {r.ao}</span>
              <span className={`n dx t-ao ${r.vincitore === "ao" ? "w" : ""}`}>{inc.ao_nome}</span>
              <span className="d">
                {dataIt(inc.data)} · {inc.tipo === "gara" ? "gara" : "allenamento"} · {inc.punti.length} punti
                {r.perSenshu && " · vinto per senshu"}{!r.vincitore && " · pari"}
              </span>
            </summary>
            <div className="bdet">
              <ElencoPunti punti={inc.punti} />
              {inc.note && <p className="hint">{inc.note}</p>}
              {staff && <div className="bar"><span className="grow" /><EliminaIncontro id={inc.id} /></div>}
            </div>
          </details>
        );
      })}
    </div>
  );
}
