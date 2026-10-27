import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contesto } from "@/lib/data/contesto";
import { elencoIncontri, leggiAtleta, misureDi } from "@/lib/data/query";
import { MISURE, ultimaVariazione } from "@/lib/domain/misure";
import { analizzaDebolezze, contaPer, mappaColpi, MINIMO_PUNTI_ANALISI, statisticheKumite } from "@/lib/domain/analisi";
import { nomeTecnica, SITUAZIONI } from "@/lib/domain/kumite";
import { eta, etichettaMese } from "@/lib/domain/date";
import type { Situazione } from "@/lib/domain/tipi";
import { Cintura } from "@/components/Cintura";
import { GraficoMisure } from "@/components/GraficoMisure";
import { MappaColpi } from "@/components/MappaColpi";
import { Barre } from "@/components/Barre";
import { ElencoIncontri } from "@/components/ElencoIncontri";

export const metadata: Metadata = { title: "Scheda atleta" };

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export default async function SchedaAtleta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await contesto();
  // I permessi del database impediscono già a un atleta di leggere schede altrui.
  const atleta = await leggiAtleta(id);
  if (!atleta || atleta.dojo_id !== c.dojo.id) notFound();

  const [misure, incontri] = await Promise.all([misureDi([id]), elencoIncontri(c.dojo.id, id)]);
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

      <section className="card">
        <div className="testata">
          <h3>Fisico{ultima && ` · ultima rilevazione ${etichettaMese(ultima.mese)}`}</h3>
          {c.staff && <Link className="btn small" href="/misure">Inserisci misure</Link>}
        </div>
        {!misure.length ? (
          <p className="hint">Nessuna misura ancora.{c.staff && " Inseriscile dalla sezione «Misure del mese»."}</p>
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
