import Link from "next/link";
import { dateEvento, infoTipo, quandoEvento } from "@/lib/domain/eventi";
import type { Evento } from "@/lib/domain/tipi";

/** Un evento in elenco: si apre al tocco per i dettagli. Usato in Eventi e nella home. */
export function SchedaEvento({ evento, oggi, staff, aperto = false }: { evento: Evento; oggi: string; staff: boolean; aperto?: boolean }) {
  const tipo = infoTipo(evento.tipo);
  const quando = quandoEvento(evento, oggi);
  const dettagli = evento.luogo || evento.descrizione || evento.link || staff;
  return (
    <details className="evento" id={`evento-${evento.id}`} open={aperto} style={{ borderLeftColor: tipo.colore }}>
      <summary>
        <span className="evento-testo">
          <b>{evento.titolo}</b>
          <span className="hint">{dateEvento(evento)}{evento.luogo && ` · ${evento.luogo}`}</span>
        </span>
        <span className="evento-quando">
          <span className="evento-tipo" style={{ color: tipo.colore }}>{tipo.nome}</span>
          <span className={quando === "Oggi" || quando === "In corso" || quando === "Domani" ? "evento-vicino" : "hint"}>{quando}</span>
        </span>
      </summary>
      {dettagli && (
        <div className="evento-dettaglio">
          {evento.descrizione && <p className="descrizione">{evento.descrizione}</p>}
          {evento.link && <a href={evento.link} target="_blank" rel="noopener noreferrer">Apri il link ↗</a>}
          {staff && <div className="bar"><Link className="btn small" href={`/eventi/${evento.id}`}>Modifica</Link></div>}
        </div>
      )}
    </details>
  );
}
