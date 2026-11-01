import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { certificatiMedici, elencoAtleti, elencoIncontri, misureDelDojo, valutazioniDelDojo } from "@/lib/data/query";
import { Certificato } from "@/components/Certificato";
import { statoCertificato } from "@/lib/domain/certificato";
import { oggi } from "@/lib/domain/date";
import { media, ultimeDue } from "@/lib/domain/valutazioni";
import { ultimaVariazione } from "@/lib/domain/misure";
import { debolezzaPrincipale, statisticheKumite } from "@/lib/domain/analisi";
import { eta, etichettaMese } from "@/lib/domain/date";
import { Cintura } from "@/components/Cintura";
import { CRITERI, criterioValido, ordinaAtleti, versoPredefinito, type Verso } from "@/lib/domain/ordinamento";

export const metadata: Metadata = { title: "Squadra" };

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export default async function Squadra({ searchParams }: { searchParams: Promise<{ ordine?: string; verso?: string }> }) {
  const c = await contesto();
  const sp = await searchParams;
  const criterio = criterioValido(sp.ordine) ? sp.ordine : "nome";
  const verso: Verso = sp.verso === "asc" || sp.verso === "desc" ? sp.verso : versoPredefinito(criterio);
  // tutte le letture partono insieme
  const [atleti, misure, incontri, valutazioni, certificati] = await Promise.all([
    elencoAtleti(c.dojo.id),
    misureDelDojo(c.dojo.id),
    elencoIncontri(c.dojo.id),
    c.vedeValutazioni ? valutazioniDelDojo(c.dojo.id).catch(() => []) : Promise.resolve([]),
    c.staff ? certificatiMedici(c.dojo.id) : Promise.resolve([]),
  ]);
  const oggiStr = oggi();
  const certPer = new Map(certificati.map((x) => [x.atleta_id, x]));
  const statiCert = atleti.map((a) => statoCertificato(certPer.get(a.id)?.scadenza, oggiStr));
  const nScaduti = statiCert.filter((s) => s === "scaduto").length;
  const nInScadenza = statiCert.filter((s) => s === "in_scadenza").length;
  const nMancanti = statiCert.filter((s) => s === "mancante").length;
  const ordinati = ordinaAtleti(atleti, criterio, verso);

  return (
    <>
      <div className="testata">
        <h1>Squadra</h1>
        {c.staff && <Link className="btn primary" href="/atleti/nuovo">+ Aggiungi atleta</Link>}
      </div>

      {!atleti.length ? (
        <div className="list"><div className="empty">
          <b>Nessun atleta ancora.</b>
          <p className="hint">{c.staff ? "Aggiungi gli atleti, poi ogni mese inserisci misure e valutazioni e registra gli incontri di kumite in allenamento." : "La squadra è ancora vuota."}</p>
          {c.staff && <Link className="btn" href="/atleti/nuovo">Aggiungi il primo atleta</Link>}
        </div></div>
      ) : (
        <>
          {c.staff && (nScaduti > 0 || nInScadenza > 0 || nMancanti > 0) && (
            <div className="card" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 14px" }}>
              <b>Certificati medici</b>
              {nScaduti > 0 && <span className="cert cert-scaduto">{nScaduti} scadut{nScaduti === 1 ? "o" : "i"}</span>}
              {nInScadenza > 0 && <span className="cert cert-avviso">{nInScadenza} in scadenza entro 30 giorni</span>}
              {nMancanti > 0 && <span className="cert cert-mancante">{nMancanti} non inserit{nMancanti === 1 ? "o" : "i"}</span>}
            </div>
          )}
          <nav className="bar" aria-label="Ordina atleti">
            <span className="hint">Ordina per</span>
            {CRITERI.map((k) => {
              const attivo = k.chiave === criterio;
              const prossimo: Verso = attivo ? (verso === "asc" ? "desc" : "asc") : versoPredefinito(k.chiave);
              return (
                <Link key={k.chiave} href={`/squadra?ordine=${k.chiave}&verso=${prossimo}`} scroll={false} replace
                  className="opt" aria-current={attivo ? "true" : undefined} style={{ textDecoration: "none" }}
                  title={attivo ? "Tocca di nuovo per invertire" : undefined}>
                  {k.nome}{attivo && (verso === "asc" ? " ↑" : " ↓")}
                </Link>
              );
            })}
          </nav>
          <div className="list tbl">
            <table>
              <thead>
                <tr>
                  <th>Atleta</th>{c.vedeValutazioni && <th className="r">Valutazione</th>}<th className="r">Peso</th><th className="r">Ultima misura</th>
                  <th className="r">V-P-S</th><th className="r">Punti fatti / subiti</th><th>Subisce di più</th>
                </tr>
              </thead>
              <tbody>
                {ordinati.map((a) => {
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
                        {c.staff && <Certificato certificato={certPer.get(a.id)} oggi={oggiStr} compatto />}
                      </td>
                      {c.vedeValutazioni && <td className="r num">
                        {mediaVal != null ? fmt(mediaVal) : "—"}
                        {mediaVal != null && mediaPrec != null && mediaVal !== mediaPrec && (
                          <div className={mediaVal > mediaPrec ? "migliora" : "peggiora"}>{mediaVal > mediaPrec ? "+" : ""}{fmt(mediaVal - mediaPrec)}</div>
                        )}
                      </td>}
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
          <p className="hint">{c.vedeValutazioni && "Valutazione è la media dei voti dell'ultimo mese valutato; "}Punti fatti e subiti sono la media per incontro. Apri un atleta per l&apos;andamento fisico e l&apos;analisi completa.</p>
        </>
      )}
    </>
  );
}
