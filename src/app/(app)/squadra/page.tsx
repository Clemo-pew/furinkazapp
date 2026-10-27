import type { Metadata } from "next";
import Link from "next/link";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti, elencoIncontri, misureDi, valutazioniDi } from "@/lib/data/query";
import { media, ultimeDue } from "@/lib/domain/valutazioni";
import { ultimaVariazione } from "@/lib/domain/misure";
import { debolezzaPrincipale, statisticheKumite } from "@/lib/domain/analisi";
import { eta, etichettaMese } from "@/lib/domain/date";
import { Cintura } from "@/components/Cintura";

export const metadata: Metadata = { title: "Squadra" };

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export default async function Squadra() {
  const c = await contestoStaff();
  const atleti = await elencoAtleti(c.dojo.id);
  const ids = atleti.map((a) => a.id);
  const [misure, incontri, valutazioni] = await Promise.all([misureDi(ids), elencoIncontri(c.dojo.id), valutazioniDi(ids).catch(() => [])]);

  return (
    <>
      <div className="testata">
        <h1>Squadra</h1>
        <Link className="btn primary" href="/atleti/nuovo">+ Aggiungi atleta</Link>
      </div>

      {!atleti.length ? (
        <div className="list"><div className="empty">
          <b>Nessun atleta ancora.</b>
          <p className="hint">Aggiungi gli atleti, poi ogni mese inserisci peso e misure e registra gli incontri di kumite in allenamento.</p>
          <Link className="btn" href="/atleti/nuovo">Aggiungi il primo atleta</Link>
        </div></div>
      ) : (
        <>
          <div className="list tbl">
            <table>
              <thead>
                <tr>
                  <th>Atleta</th><th className="r">Valutazione</th><th className="r">Peso</th><th className="r">Ultima misura</th>
                  <th className="r">V-P-S</th><th className="r">Punti fatti / subiti</th><th>Subisce di più</th>
                </tr>
              </thead>
              <tbody>
                {atleti.map((a) => {
                  const mie = misure.filter((m) => m.atleta_id === a.id);
                  const peso = ultimaVariazione(mie, "peso");
                  const ultima = mie.at(-1);
                  const k = statisticheKumite(a.id, incontri);
                  const debolezza = debolezzaPrincipale(k.subiti);
                  const val = ultimeDue(valutazioni.filter((v) => v.atleta_id === a.id));
                  const mediaVal = media(val.ultima?.valori);
                  const mediaPrec = media(val.precedente?.valori);
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link href={`/atleti/${a.id}`}>{a.nome}</Link>
                        <div className="meta"><Cintura grado={a.cintura} />{a.anno_nascita && <span>{eta(a.anno_nascita)} anni</span>}</div>
                      </td>
                      <td className="r num">
                        {mediaVal != null ? fmt(mediaVal) : "—"}
                        {mediaVal != null && mediaPrec != null && mediaVal !== mediaPrec && (
                          <div className={mediaVal > mediaPrec ? "migliora" : "peggiora"}>{mediaVal > mediaPrec ? "+" : ""}{fmt(mediaVal - mediaPrec)}</div>
                        )}
                      </td>
                      <td className="r num">
                        {peso.valore != null ? `${fmt(peso.valore)} kg` : "—"}
                        {peso.delta != null && peso.delta !== 0 && (
                          <div className={peso.delta > 0 ? "up" : "down"}>{peso.delta > 0 ? "+" : ""}{fmt(peso.delta)}</div>
                        )}
                      </td>
                      <td className="r num">{ultima ? etichettaMese(ultima.mese) : "—"}</td>
                      <td className="r num">{k.incontri ? `${k.vinti}-${k.pari}-${k.persi}` : "—"}</td>
                      <td className="r num">{k.incontri ? `${fmt(k.puntiFatti / k.incontri)} / ${fmt(k.puntiSubiti / k.incontri)}` : "—"}</td>
                      <td>{debolezza ? <span className="weak">{debolezza}</span> : <span className="hint">Pochi dati</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">Valutazione è la media dei voti dell'ultimo mese valutato; punti fatti e subiti sono la media per incontro. Apri un atleta per l&apos;andamento fisico e l&apos;analisi completa.</p>
        </>
      )}
    </>
  );
}
