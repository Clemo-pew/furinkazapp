"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { media, SCALA, VOCI_VALUTAZIONE } from "@/lib/domain/valutazioni";
import { mediaKata, nomeKata } from "@/lib/domain/kata";
import { salvaValutazione } from "./azioni";
import { EliminaRilevazione } from "@/components/EliminaRilevazione";

interface Props {
  atleta: { id: string; nome: string };
  mese: string;
  valori: Record<string, number> | null;
  note: string | null;
  precedenti: Record<string, number> | null;
  /** Solo l'amministratore può eliminare una valutazione. */
  puoEliminare?: boolean;
  /** Kata conosciuti dall'atleta, in ordine di apprendimento. */
  kataConosciuti?: string[];
  votiKata?: Record<string, number> | null;
  votiKataPrecedenti?: Record<string, number> | null;
}

/** Riquadro con i voti di un atleta per il mese scelto. */
export function SchedaValutazione({ atleta, mese, valori, note, precedenti, puoEliminare = false, kataConosciuti = [], votiKata = null, votiKataPrecedenti = null }: Props) {
  const [stato, azione, attesa] = useActionState(salvaValutazione, undefined);
  const form = useRef<HTMLFormElement>(null);
  const [correnti, setCorrenti] = useState<Record<string, number>>(valori ?? {});
  const m = media(correnti);
  const [kataCorrenti, setKataCorrenti] = useState<Record<string, number>>(votiKata ?? {});
  const mk = mediaKata(kataCorrenti);

  function leggi() {
    const nuovi: Record<string, number> = {};
    for (const v of VOCI_VALUTAZIONE) {
      const el = form.current?.elements.namedItem(v.chiave) as HTMLInputElement | null;
      const n = Number(el?.value?.replace(",", "."));
      if (el?.value && Number.isFinite(n)) nuovi[v.chiave] = n;
    }
    setCorrenti(nuovi);
    const kata: Record<string, number> = {};
    for (const k of kataConosciuti) {
      const el = form.current?.elements.namedItem(`kata_${k}`) as HTMLInputElement | null;
      const n = Number(el?.value?.replace(",", "."));
      if (el?.value && Number.isFinite(n)) kata[k] = n;
    }
    setKataCorrenti(kata);
  }

  function copiaPrecedenti() {
    if (!precedenti && !votiKataPrecedenti) return;
    for (const v of VOCI_VALUTAZIONE) {
      const el = form.current?.elements.namedItem(v.chiave) as HTMLInputElement | null;
      if (el && !el.value && precedenti?.[v.chiave] != null) el.value = String(precedenti![v.chiave]);
    }
    for (const k of kataConosciuti) {
      const el = form.current?.elements.namedItem(`kata_${k}`) as HTMLInputElement | null;
      if (el && !el.value && votiKataPrecedenti?.[k] != null) el.value = String(votiKataPrecedenti[k]);
    }
    leggi();
  }

  return (
    <form ref={form} action={azione} className="card" onInput={leggi}>
      <input type="hidden" name="atleta_id" value={atleta.id} />
      <input type="hidden" name="mese" value={mese} />
      <div className="testata">
        <Link href={`/atleti/${atleta.id}`}><b>{atleta.nome}</b></Link>
        <div className="bar">
          {m != null && <span className="chip">Media <span className="num">{String(m).replace(".", ",")}</span></span>}
          {mk != null && <span className="chip">Kata <span className="num">{String(mk).replace(".", ",")}</span></span>}
          {(stato?.ok || (valori && !stato)) && <span className="ok">Salvato</span>}
        </div>
      </div>
      <div className="griglia" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8 }}>
        {VOCI_VALUTAZIONE.map((v) => (
          <label className="campo" key={v.chiave}>{v.nome}
            <input id={`${atleta.id}-${v.chiave}`} name={v.chiave} type="number" inputMode="decimal"
              min={SCALA.min} max={SCALA.max} step={0.5}
              defaultValue={valori?.[v.chiave] ?? ""} placeholder={precedenti?.[v.chiave]?.toString() ?? `${SCALA.min}–${SCALA.max}`}
              style={{ fontFamily: "var(--mono)" }} />
          </label>
        ))}
        {kataConosciuti.length > 0 && (
          <div className="tutta stack-s" style={{ marginTop: 4 }}>
            <h3>Kata</h3>
            <div className="griglia" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {kataConosciuti.map((k) => (
                <label className="campo" key={k}>{nomeKata(k)}
                  <input id={`${atleta.id}-kata-${k}`} name={`kata_${k}`} type="number" inputMode="decimal"
                    min={SCALA.min} max={SCALA.max} step={0.5}
                    defaultValue={votiKata?.[k] ?? ""} placeholder={votiKataPrecedenti?.[k]?.toString() ?? `${SCALA.min}–${SCALA.max}`}
                    style={{ fontFamily: "var(--mono)" }} />
                </label>
              ))}
            </div>
          </div>
        )}
        <label className="campo tutta">Note (facoltative)
          <input id={`${atleta.id}-note`} name="note" defaultValue={note ?? ""} placeholder="Es. migliorato il tempismo sul gyaku-zuki" maxLength={300} />
        </label>
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        <button className="btn small primary" disabled={attesa}>{valori ? "Aggiorna" : "Salva"}</button>
        {(precedenti || votiKataPrecedenti) && <button type="button" className="btn small" onClick={copiaPrecedenti}>Parti dai voti precedenti</button>}
        {valori && puoEliminare && <><span className="grow" /><EliminaRilevazione tipo="valutazioni" atletaId={atleta.id} mese={mese} /></>}
      </div>
    </form>
  );
}
