import Link from "next/link";
import { eventoNelGiorno, grigliaMese, infoTipo } from "@/lib/domain/eventi";
import type { Evento } from "@/lib/domain/tipi";

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

/**
 * Calendario mensile. Un giorno con eventi porta all'evento nell'elenco sotto;
 * per lo staff, un giorno libero apre "Nuovo evento" con quella data.
 */
export function Calendario({ mese, eventi, oggi, staff }: { mese: string; eventi: Evento[]; oggi: string; staff: boolean }) {
  const settimane = grigliaMese(mese);
  return (
    <div className="calendario" role="grid" aria-label="Calendario eventi">
      <div className="cal-riga cal-intestazione" role="row">
        {GIORNI.map((g) => <span key={g} role="columnheader">{g}</span>)}
      </div>
      {settimane.map((s) => (
        <div className="cal-riga" role="row" key={s[0].data}>
          {s.map(({ data, delMese }) => {
            const delGiorno = eventi.filter((e) => eventoNelGiorno(e, data));
            const classi = ["cal-giorno", delMese ? "" : "fuori", data === oggi ? "oggi" : "", delGiorno.length ? "con-eventi" : ""].join(" ");
            const contenuto = (
              <>
                <span className="cal-numero">{+data.slice(8)}</span>
                <span className="cal-eventi">
                  {delGiorno.slice(0, 3).map((e) => (
                    <span key={e.id} className="cal-evento" style={{ background: infoTipo(e.tipo).colore }} title={e.titolo}>
                      <span className="cal-evento-nome">{e.titolo}</span>
                    </span>
                  ))}
                  {delGiorno.length > 3 && <span className="cal-altri">+{delGiorno.length - 3}</span>}
                </span>
              </>
            );
            const etichetta = `${+data.slice(8)}${delGiorno.length ? `: ${delGiorno.map((e) => e.titolo).join(", ")}` : ""}`;
            if (delGiorno.length) {
              return <a key={data} role="gridcell" className={classi} href={`#evento-${delGiorno[0].id}`} aria-label={etichetta}>{contenuto}</a>;
            }
            if (staff && delMese) {
              return <Link key={data} role="gridcell" className={classi} href={`/eventi/nuovo?data=${data}`} aria-label={`${etichetta}: aggiungi evento`}>{contenuto}</Link>;
            }
            return <span key={data} role="gridcell" className={classi} aria-label={etichetta}>{contenuto}</span>;
          })}
        </div>
      ))}
    </div>
  );
}
