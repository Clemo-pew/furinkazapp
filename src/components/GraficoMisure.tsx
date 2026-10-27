"use client";
import { useState } from "react";
import { MISURE, misuraInfo } from "@/lib/domain/misure";
import { etichettaMese } from "@/lib/domain/date";
import type { Misura } from "@/lib/domain/tipi";

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

/** Andamento mensile di una misura, con selettore. */
export function GraficoMisure({ misure }: { misure: Misura[] }) {
  const [chiave, setChiave] = useState<string>("peso");
  const info = misuraInfo(chiave);
  const punti = misure.filter((m) => typeof m.valori?.[chiave] === "number");

  return (
    <div className="stack-s">
      <div className="seg">
        {MISURE.map((m) => (
          <button key={m.chiave} type="button" className="opt" aria-pressed={chiave === m.chiave} onClick={() => setChiave(m.chiave)}>{m.nome}</button>
        ))}
      </div>
      <div className="chart">
        {punti.length < 2 ? (
          <p className="hint">Servono almeno due mesi con questa misura per disegnare l&apos;andamento.</p>
        ) : (
          <Linea valori={punti.map((p) => ({ mese: p.mese, v: p.valori[chiave] }))} unita={info.unita} nome={info.nome} />
        )}
      </div>
    </div>
  );
}

function Linea({ valori, unita, nome }: { valori: { mese: string; v: number }[]; unita: string; nome: string }) {
  const W = 600, H = 220, L = 46, R = 16, T = 18, B = 30;
  const ys = valori.map((p) => p.v);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max((hi - lo) * 0.25, 0.5);
  lo -= pad; hi += pad;
  const x = (i: number) => L + ((W - L - R) * i) / (valori.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const tacche = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const linea = valori.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const ultimo = valori.length - 1;
  const ogni = Math.ceil(valori.length / 8); // evita etichette sovrapposte con molti mesi
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Andamento ${nome}`}>
      {tacche.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="var(--mono)">{fmt(t)}</text>
        </g>
      ))}
      {valori.map((p, i) => (i % ogni === 0 || i === ultimo) && (
        <text key={p.mese} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">{etichettaMese(p.mese)}</text>
      ))}
      <path d={`${linea}L${x(ultimo)},${H - B}L${x(0)},${H - B}Z`} fill="var(--ao)" fillOpacity="0.1" />
      <path d={linea} fill="none" stroke="var(--ao)" strokeWidth="2.5" strokeLinejoin="round" />
      {valori.map((p, i) => (
        <circle key={p.mese} cx={x(i)} cy={y(p.v)} r={i === ultimo ? 5.5 : 3} fill={i === ultimo ? "var(--ao)" : "var(--surface)"} stroke="var(--ao)" strokeWidth="2" />
      ))}
      <text x={Math.min(x(ultimo), W - R - 4)} y={y(ys[ultimo]) - 12} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--ink)">{fmt(ys[ultimo])} {unita}</text>
    </svg>
  );
}
