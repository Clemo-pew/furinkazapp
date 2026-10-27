"use client";
import Link from "next/link";
import { useActionState, useRef } from "react";
import { MISURE } from "@/lib/domain/misure";
import { salvaMisure } from "./azioni";
import { EliminaRilevazione } from "@/components/EliminaRilevazione";

interface Props {
  atleta: { id: string; nome: string };
  mese: string;
  valori: Record<string, number> | null;
  precedenti: Record<string, number | undefined>;
  /** Solo l'amministratore può eliminare una rilevazione. */
  puoEliminare?: boolean;
}

/** Riquadro con le misure di un atleta per il mese scelto. */
export function SchedaMisure({ atleta, mese, valori, precedenti, puoEliminare = false }: Props) {
  const [stato, azione, attesa] = useActionState(salvaMisure, undefined);
  const form = useRef<HTMLFormElement>(null);
  const haPrecedenti = Object.values(precedenti).some((v) => v != null);

  function copiaPrecedenti() {
    for (const m of MISURE) {
      const el = form.current?.elements.namedItem(m.chiave) as HTMLInputElement | null;
      const v = precedenti[m.chiave];
      if (el && !el.value && v != null) el.value = String(v);
    }
  }

  return (
    <form ref={form} action={azione} className="card">
      <input type="hidden" name="atleta_id" value={atleta.id} />
      <input type="hidden" name="mese" value={mese} />
      <div className="testata">
        <Link href={`/atleti/${atleta.id}`}><b>{atleta.nome}</b></Link>
        {(stato?.ok || (valori && !stato)) && <span className="ok">Salvato</span>}
      </div>
      <div className="griglia" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
        {MISURE.map((m) => (
          <label className="campo" key={m.chiave}>{m.nome} ({m.unita})
            <input id={`${atleta.id}-${m.chiave}`} name={m.chiave} type="number" inputMode="decimal" step="any" min={0}
              defaultValue={valori?.[m.chiave] ?? ""} placeholder={precedenti[m.chiave]?.toString() ?? ""}
              style={{ fontFamily: "var(--mono)" }} />
          </label>
        ))}
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        <button className="btn small primary" disabled={attesa}>{valori ? "Aggiorna" : "Salva"}</button>
        {haPrecedenti && <button type="button" className="btn small" onClick={copiaPrecedenti}>Copia valori precedenti</button>}
        {valori && puoEliminare && <><span className="grow" /><EliminaRilevazione tipo="misure" atletaId={atleta.id} mese={mese} /></>}
      </div>
    </form>
  );
}
