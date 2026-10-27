"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { GRUPPI_KATA, KATA, nomeKata, ordinaKata } from "@/lib/domain/kata";
import { etichettaMese } from "@/lib/domain/date";
import type { KataConosciuto } from "@/lib/domain/tipi";
import { salvaKataConosciuti } from "./kata";

interface Props {
  atletaId: string;
  conosciuti: KataConosciuto[];
  /** Voti di ogni kata, dal più vecchio al più recente. */
  storici: Record<string, { mese: string; voto: number }[]>;
  staff: boolean;
  /** Falso per gli Allievi: vedono i kata conosciuti ma non i voti. */
  mostraVoti: boolean;
}

const fmt = (v: number) => String(v).replace(".", ",");

/** Riquadro "Kata" della scheda atleta: kata conosciuti con voti, e modifica per lo staff. */
export function KataAtleta({ atletaId, conosciuti, storici, staff, mostraVoti }: Props) {
  const [modifica, setModifica] = useState(false);
  const [scelti, setScelti] = useState<Map<string, string | null>>(new Map(conosciuti.map((k) => [k.kata, k.dal])));
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();
  const elenco = ordinaKata(conosciuti.map((k) => k.kata));

  const cambia = (k: string) => setScelti((m) => { const n = new Map(m); if (n.has(k)) n.delete(k); else n.set(k, null); return n; });
  const salva = () => avvia(async () => {
    setErrore(null);
    const r = await salvaKataConosciuti(atletaId, [...scelti].map(([kata, d]) => ({ kata, dal: d })));
    if (r.errore) setErrore(r.errore);
    else setModifica(false);
  });

  return (
    <section className="card" id="kata">
      <div className="testata">
        <h3>Kata · Shotokan · {conosciuti.length} conosciuti</h3>
        {staff && !modifica && (
          <div className="bar">
            <Link className="btn small" href="/valutazioni">Valuta</Link>
            <button type="button" className="btn small" onClick={() => setModifica(true)}>Modifica kata conosciuti</button>
          </div>
        )}
      </div>

      {modifica ? (
        <div className="stack">
          <p className="hint">Tocca i kata che l&apos;atleta conosce.</p>
          {GRUPPI_KATA.map((g) => (
            <div className="stack-s" key={g}>
              <h3>{g}</h3>
              <div className="seg">
                {KATA.filter((k) => k.gruppo === g).map((k) => (
                  <button key={k.chiave} type="button" className="opt" aria-pressed={scelti.has(k.chiave)} onClick={() => cambia(k.chiave)}>{k.nome}</button>
                ))}
              </div>
            </div>
          ))}
          {errore && <p className="errore" role="alert">{errore}</p>}
          <div className="bar">
            <button type="button" className="btn" onClick={() => { setModifica(false); setScelti(new Map(conosciuti.map((k) => [k.kata, k.dal]))); }}>Annulla</button>
            <button type="button" className="btn primary" disabled={attesa} onClick={salva}>{attesa ? "Salvo…" : "Salva"}</button>
          </div>
        </div>
      ) : !elenco.length ? (
        <p className="hint">Nessun kata segnato.{staff && " Usa «Modifica kata conosciuti» per indicare quelli che l'atleta conosce."}</p>
      ) : (
        <div className="list">
          {elenco.map((k) => {
            const s = storici[k] ?? [];
            const ultimo = s.at(-1), prec = s.at(-2);
            const d = ultimo && prec ? ultimo.voto - prec.voto : 0;
            return (
              <div className="bar" key={k} style={{ padding: "10px 14px", borderTop: "1px solid var(--line)" }}>
                <span className="grow" style={{ minWidth: 140 }}>
                  <b>{nomeKata(k)}</b> <Link href={`/kata#${k}`} className="hint" style={{ textDecoration: "none" }}>▶ video</Link>
                  {mostraVoti && s.length > 1 && (
                    <>
                      <br />
                      <span className="hint">Voti: {s.slice(-4).map((x) => fmt(x.voto)).join(" → ")}</span>
                    </>
                  )}
                </span>
                {mostraVoti && <span className="num" style={{ textAlign: "right" }}>
                  {ultimo ? (
                    <>
                      <b style={{ fontSize: "1.1rem" }}>{fmt(ultimo.voto)}</b>
                      {d !== 0 && <span className={d > 0 ? "migliora" : "peggiora"}> {d > 0 ? "▲" : "▼"}</span>}
                      <br /><span className="hint">{etichettaMese(ultimo.mese)}</span>
                    </>
                  ) : <span className="hint">da valutare</span>}
                </span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
