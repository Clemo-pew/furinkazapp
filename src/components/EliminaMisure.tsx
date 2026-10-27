"use client";
import { useState, useTransition } from "react";
import { eliminaMisure } from "@/app/(app)/misure/azioni";

/** Pulsante con conferma per eliminare le misure di un mese (solo amministratore). */
export function EliminaMisure({ atletaId, mese, testo = "Elimina misure del mese" }: { atletaId: string; mese: string; testo?: string }) {
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();
  return (
    <>
      <button type="button" className="btn small danger" disabled={attesa}
        onClick={() => {
          if (!conferma) return setConferma(true);
          avvia(async () => {
            const r = await eliminaMisure(atletaId, mese);
            if (r.errore) setErrore(r.errore);
            setConferma(false);
          });
        }}>
        {attesa ? "Elimino…" : conferma ? "Conferma eliminazione" : testo}
      </button>
      {conferma && !attesa && <button type="button" className="btn small" onClick={() => setConferma(false)}>Annulla</button>}
      {errore && <span className="errore">{errore}</span>}
    </>
  );
}
