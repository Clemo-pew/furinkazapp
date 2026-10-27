"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { media, SCALA, VOCI_VALUTAZIONE } from "@/lib/domain/valutazioni";
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
}

/** Riquadro con i voti di un atleta per il mese scelto. */
export function SchedaValutazione({ atleta, mese, valori, note, precedenti, puoEliminare = false }: Props) {
  const [stato, azione, attesa] = useActionState(salvaValutazione, undefined);
  const form = useRef<HTMLFormElement>(null);
  const [correnti, setCorrenti] = useState<Record<string, number>>(valori ?? {});
  const m = media(correnti);

  function leggi() {
    const nuovi: Record<string, number> = {};
    for (const v of VOCI_VALUTAZIONE) {
      const el = form.current?.elements.namedItem(v.chiave) as HTMLInputElement | null;
      const n = Number(el?.value?.replace(",", "."));
      if (el?.value && Number.isFinite(n)) nuovi[v.chiave] = n;
    }
    setCorrenti(nuovi);
  }

  function copiaPrecedenti() {
    if (!precedenti) return;
    for (const v of VOCI_VALUTAZIONE) {
      const el = form.current?.elements.namedItem(v.chiave) as HTMLInputElement | null;
      if (el && !el.value && precedenti[v.chiave] != null) el.value = String(precedenti[v.chiave]);
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
        <label className="campo tutta">Note (facoltative)
          <input id={`${atleta.id}-note`} name="note" defaultValue={note ?? ""} placeholder="Es. migliorato il tempismo sul gyaku-zuki" maxLength={300} />
        </label>
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        <button className="btn small primary" disabled={attesa}>{valori ? "Aggiorna" : "Salva"}</button>
        {precedenti && <button type="button" className="btn small" onClick={copiaPrecedenti}>Parti dai voti precedenti</button>}
        {valori && puoEliminare && <><span className="grow" /><EliminaRilevazione tipo="valutazioni" atletaId={atleta.id} mese={mese} /></>}
      </div>
    </form>
  );
}
