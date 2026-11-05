import Link from "next/link";
import { etichettaSettimana, formatoDurata, giornoSettimana, nomeArgomento, perMese, perSettimana, titoloBreve } from "@/lib/domain/diario";
import { meseEsteso } from "@/lib/domain/date";
import type { Allenamento } from "@/lib/domain/tipi";

interface Props {
  allenamenti: Allenamento[];
  /** id atleta → nome, per l'elenco dei presenti */
  nomi: Record<string, string>;
  staff: boolean;
  /** AAAA-MM: questo mese parte aperto, gli altri chiusi */
  meseCorrente: string;
}

/**
 * Diario per mese → settimana → allenamento. Mesi e allenamenti si aprono al tocco
 * (elementi <details> nativi: funzionano anche senza JavaScript).
 */
export function ElencoDiario({ allenamenti, nomi, staff, meseCorrente }: Props) {
  return (
    <>
      {perMese(allenamenti).map(([mese, lista], i) => {
        const minuti = lista.reduce((t, a) => t + (a.durata_min ?? 0), 0);
        // aperto il mese corrente; se non ci sono allenamenti questo mese, il più recente
        const aperto = mese === meseCorrente || (i === 0 && !allenamenti[0].data.startsWith(meseCorrente));
        return (
          <details className="diario-mese" key={mese} open={aperto}>
            <summary>
              <span className="diario-mese-nome">{meseEsteso(mese)}</span>
              <span className="hint">
                {lista.length} {lista.length === 1 ? "allenamento" : "allenamenti"}{minuti > 0 && ` · ${formatoDurata(minuti)}`}
              </span>
            </summary>
            <div className="diario-settimane">
              {perSettimana(lista).map(([lunedi, settimana]) => (
                <section key={lunedi} className="stack-s">
                  <h3>Settimana {etichettaSettimana(lunedi)}</h3>
                  <div className="list">
                    {settimana.map((a) => (
                      <details className="diario-voce" key={a.id}>
                        <summary>
                          <span className="diario-giorno">{giornoSettimana(a.data)}</span>
                          <span className="diario-titolo">{titoloBreve(a)}</span>
                          {formatoDurata(a.durata_min) && <span className="hint diario-durata">{formatoDurata(a.durata_min)}</span>}
                        </summary>
                        <div className="diario-dettaglio">
                          {!!a.argomenti.length && (
                            <div className="seg">{a.argomenti.map((k) => <span key={k} className="tag-argomento">{nomeArgomento(k)}</span>)}</div>
                          )}
                          {a.descrizione ? <p className="descrizione">{a.descrizione}</p> : <p className="hint">Nessuna descrizione.</p>}
                          <p className="hint">
                            <b>Presenti ({a.presenti.length}):</b>{" "}
                            {a.presenti.length ? a.presenti.map((id) => nomi[id] ?? "Atleta eliminato").sort().join(", ") : "nessuna presenza segnata."}
                          </p>
                          {staff && <div className="bar"><Link className="btn small" href={`/diario/${a.id}`}>Modifica</Link></div>}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </details>
        );
      })}
    </>
  );
}
