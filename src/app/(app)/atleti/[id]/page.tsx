import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contesto } from "@/lib/data/contesto";
import { elencoIncontri, leggiAtleta, misureDi, valutazioniDi } from "@/lib/data/query";
import { statoAccesso } from "@/lib/data/accessi";
import { media, ultimeDue, VOCI_VALUTAZIONE, SCALA } from "@/lib/domain/valutazioni";
import { proponiNomeUtente } from "@/lib/domain/credenziali";
import { MISURE, ultimaVariazione } from "@/lib/domain/misure";
import { analizzaDebolezze, contaPer, mappaColpi, MINIMO_PUNTI_ANALISI, statisticheKumite } from "@/lib/domain/analisi";
import { nomeTecnica, SITUAZIONI } from "@/lib/domain/kumite";
import { eta, etichettaMese } from "@/lib/domain/date";
import type { Situazione } from "@/lib/domain/tipi";
import { Cintura } from "@/components/Cintura";
import { GraficoMisure } from "@/components/GraficoMisure";
import { EliminaMisure } from "@/components/EliminaMisure";
import { MappaColpi } from "@/components/MappaColpi";
import { Barre } from "@/components/Barre";
import { ElencoIncontri } from "@/components/ElencoIncontri";
import { Radar } from "@/components/Radar";
import { AccessoAtleta } from "./AccessoAtleta";

export const metadata: Metadata = { title: "Scheda atleta" };

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export default async function SchedaAtleta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound(); // solo identificativi validi arrivano alle query
  const c = await contesto();
  // I permessi del database impediscono già a un atleta di leggere schede altrui.
  // tutte le letture partono insieme
  const [atleta, misure, incontri, valutazioni, accesso] = await Promise.all([
    leggiAtleta(id),
    misureDi([id]),
    elencoIncontri(c.dojo.id, id),
    valutazioniDi([id]).catch(() => []), // tabella non ancora creata: la sezione resta vuota
    c.ruolo === "admin" ? statoAccesso(c.dojo.id, id) : Promise.resolve(null),
  ]);
  if (!atleta || atleta.dojo_id !== c.dojo.id) notFound();
  const { ultima: valUltima, precedente: valPrecedente } = ultimeDue(valutazioni);
  const mediaUltima = media(valUltima?.valori);
  const mediaPrecedente = media(valPrecedente?.valori);
  const k = statisticheKumite(id, incontri);
  const deb = analizzaDebolezze(k.subiti);
  const prima = misure[0], ultima = misure.at(-1);
  const pesoTot = prima && ultima && prima !== ultima && prima.valori.peso != null && ultima.valori.peso != null
    ? ultima.valori.peso - prima.valori.peso : null;

  return (
    <>
      <div className="testata">
        <div className="stack-s">
          <h1>{atleta.nome}</h1>
          <div className="meta">
            <Cintura grado={atleta.cintura} />
            <span>{atleta.sesso === "M" ? "Maschile" : "Femminile"}</span>
            {atleta.anno_nascita && <span>{eta(atleta.anno_nascita)} anni ({atleta.anno_nascita})</span>}
            {atleta.archiviato && <span>archiviato</span>}
          </div>
        </div>
        {c.staff && <Link className="btn small" href={`/atleti/${id}/modifica`}>Modifica dati</Link>}
      </div>
      {atleta.note && c.staff && <p className="hint">{atleta.note}</p>}

      {accesso && <AccessoAtleta atletaId={id} stato={accesso} nomeUtenteProposto={proponiNomeUtente(atleta.nome)} />}

      <section className="card">
        <div className="testata">
          <h3>Valutazioni{valUltima && ` · ${etichettaMese(valUltima.mese)}`}</h3>
          {c.staff && <Link className="btn small" href="/valutazioni">Inserisci valutazioni</Link>}
        </div>
        {!valUltima ? (
          <p className="hint">Nessuna valutazione ancora.{c.staff && " Inseriscila dalla sezione Valutazioni."}</p>
        ) : (
          <div className="due" style={{ alignItems: "center" }}>
            <Radar attuale={valUltima.valori} precedente={valPrecedente?.valori} />
            <div className="stack-s">
              <div className="stat">
                <span>Media</span>
                <b>{mediaUltima != null ? fmt(mediaUltima) : "—"}<span className="hint"> / {SCALA.max}</span></b>
                <small className={mediaUltima != null && mediaPrecedente != null ? (mediaUltima >= mediaPrecedente ? "migliora" : "peggiora") : ""}>
                  {mediaUltima != null && mediaPrecedente != null
                    ? `${mediaUltima - mediaPrecedente >= 0 ? "+" : ""}${fmt(mediaUltima - mediaPrecedente)} da ${etichettaMese(valPrecedente!.mese)}`
                    : "\u00a0"}
                </small>
              </div>
              {VOCI_VALUTAZIONE.map((v) => {
                const val = valUltima.valori[v.chiave];
                const prec = valPrecedente?.valori[v.chiave];
                const d = val != null && prec != null ? val - prec : null;
                return (
                  <div className="brow" key={v.chiave} style={{ gridTemplateColumns: "minmax(0,9.5rem) 1fr 3.2rem" }}>
                    <span>{v.nome}</span>
                    <div className="track"><i style={{ width: `${((val ?? 0) / SCALA.max) * 100}%`, background: "var(--brand)" }} /></div>
                    <span className="num" style={{ color: "var(--ink)" }}>
                      {val != null ? fmt(val) : "—"}
                      {d ? <span className={d > 0 ? "migliora" : "peggiora"}> {d > 0 ? "▲" : "▼"}</span> : null}
                    </span>
                  </div>
                );
              })}
              {valPrecedente && <p className="hint">Tratteggio nel grafico: valutazione di {etichettaMese(valPrecedente.mese)}.</p>}
              {valUltima.note && <p className="hint">«{valUltima.note}»</p>}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="testata">
          <h3>Fisico{ultima && ` · ultima rilevazione ${etichettaMese(ultima.mese)}`}</h3>
          {c.staff && <Link className="btn small" href="/misure">Inserisci misure</Link>}
        </div>
        {!misure.length ? (
          <p className="hint">Nessuna misura ancora.{c.staff && " Inseriscile dalla sezione Misure."}</p>
        ) : (
          <>
            <div className="stats">
              {MISURE.map((m) => {
                const v = ultimaVariazione(misure, m.chiave);
                return (
                  <div className="stat" key={m.chiave}>
                    <span>{m.nome}</span>
                    <b>{v.valore != null ? `${fmt(v.valore)} ${m.unita}` : "—"}</b>
                    <small className={v.delta ? (v.delta > 0 ? "up" : "down") : ""}>
                      {v.delta != null ? `${v.delta > 0 ? "+" : ""}${fmt(v.delta)} dalla precedente` : " "}
                    </small>
                  </div>
                );
              })}
            </div>
            <GraficoMisure misure={misure} />
            <details>
              <summary className="hint" style={{ cursor: "pointer" }}>Storico delle rilevazioni ({misure.length})</summary>
              <div className="tbl" style={{ marginTop: 8 }}>
                <table style={{ minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th>Mese</th>
                      {MISURE.map((m) => <th key={m.chiave} className="r">{m.nome} <span style={{ textTransform: "none" }}>({m.unita})</span></th>)}
                      {c.ruolo === "admin" && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {[...misure].reverse().map((r) => (
                      <tr key={r.id}>
                        <td className="num">{etichettaMese(r.mese)}</td>
                        {MISURE.map((m) => <td key={m.chiave} className="r num">{r.valori[m.chiave] != null ? fmt(r.valori[m.chiave]) : "—"}</td>)}
                        {c.ruolo === "admin" && <td className="r"><div className="bar" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}><EliminaMisure atletaId={id} mese={r.mese} testo="Elimina" /></div></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            {pesoTot != null && prima && ultima && (
              <p className="hint">Da {etichettaMese(prima.mese)} a {etichettaMese(ultima.mese)}: peso {pesoTot > 0 ? "+" : ""}{fmt(pesoTot)} kg.</p>
            )}
          </>
        )}
      </section>

      {!k.incontri ? (
        <section className="card">
          <h3>Kumite</h3>
          <p className="hint">Nessun incontro registrato.{c.staff && " Registralo dalla sezione Kumite."}</p>
        </section>
      ) : (
        <>
          <section className="card">
            <h3>Kumite · {k.incontri} incontri</h3>
            <div className="stats">
              <div className="stat"><span>Vinti · pari · persi</span><b>{k.vinti} · {k.pari} · {k.persi}</b></div>
              <div className="stat"><span>Punti fatti</span><b>{k.puntiFatti}</b><small>{fmt(k.puntiFatti / k.incontri)} a incontro</small></div>
              <div className="stat"><span>Punti subiti</span><b style={{ color: "var(--bad)" }}>{k.puntiSubiti}</b><small>{fmt(k.puntiSubiti / k.incontri)} a incontro</small></div>
            </div>

            {deb ? (
              <div className="verdict">
                <h3 style={{ color: "var(--bad)" }}>Punti deboli</h3>
                <p>
                  Subisce soprattutto <b>{deb.tecnica.nome}</b> ({deb.tecnica.percentuale}% dei punti subiti)
                  {deb.zona && <>, in zona <b>{deb.zona.nome}</b> ({deb.zona.percentuale}%)</>}.
                </p>
                <p>Viene colpito più spesso <b>{deb.situazione.nome.toLowerCase()}</b> ({deb.situazione.percentuale}%). {deb.situazione.consiglio}</p>
              </div>
            ) : (
              <p className="hint">Servono almeno {MINIMO_PUNTI_ANALISI} punti subiti per individuare una tendenza.</p>
            )}

            <div className="due">
              <div className="stack-s">
                <h3>Dove viene colpito</h3>
                <div className="heat">
                  <MappaColpi conteggi={mappaColpi(k.subiti)} />
                  <div className="stack-s" style={{ flex: 1, minWidth: 150, fontSize: ".84rem" }}>
                    {contaPer(k.subiti, (p) => p.situazione).map(([s, n]) => (
                      <div className="bar" key={s}><span className="grow">{SITUAZIONI[s as Situazione]}</span><span className="num">{n}</span></div>
                    ))}
                    <p className="hint">SX e DX sono i lati del corpo dell&apos;atleta.</p>
                  </div>
                </div>
              </div>
              <div className="stack">
                <div className="stack-s"><h3>Tecniche subite</h3><Barre righe={contaPer(k.subiti, (p) => nomeTecnica(p.tecnica))} colore="var(--bad)" /></div>
                <div className="stack-s"><h3>Tecniche con cui segna</h3><Barre righe={contaPer(k.fatti, (p) => nomeTecnica(p.tecnica))} colore="var(--good)" /></div>
              </div>
            </div>
          </section>
          <ElencoIncontri incontri={incontri} staff={c.staff} />
        </>
      )}
    </>
  );
}
