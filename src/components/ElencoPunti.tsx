import { NOMI_PUNTEGGIO, PARTI, SITUAZIONI, ZONE, nomeTecnica } from "@/lib/domain/kumite";
import type { Punto } from "@/lib/domain/tipi";

/** Elenco dei punti di un incontro. Se `onElimina` è presente mostra il tasto per toglierli (registrazione). */
export function ElencoPunti({ punti, onElimina }: { punti: Omit<Punto, "ordine">[]; onElimina?: (i: number) => void }) {
  if (!punti.length) return <p className="hint">Nessun punto ancora.</p>;
  return (
    <div>
      {punti.map((p, i) => (
        <div className="ev" key={i}>
          <span className={`dot ${p.lato}`} />
          <span>
            <b>{p.lato.toUpperCase()}</b> · {nomeTecnica(p.tecnica)}{p.zona !== "terra" ? ` ${ZONE[p.zona].toLowerCase()}` : ""} ·{" "}
            <span className="num">{NOMI_PUNTEGGIO[p.valore]} {p.valore}</span>
            <br />
            <span className="hint">
              {p.zona !== "terra" && `lato ${PARTI[p.parte].toLowerCase()} · `}{SITUAZIONI[p.situazione].toLowerCase()}{i === 0 && " · senshu"}
            </span>
          </span>
          {onElimina ? <button type="button" className="x" onClick={() => onElimina(i)} aria-label="Elimina punto">×</button> : <span />}
        </div>
      ))}
    </div>
  );
}
