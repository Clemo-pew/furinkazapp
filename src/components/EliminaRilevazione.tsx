"use client";
import { useState, useTransition } from "react";
import { eliminaMisure } from "@/app/(app)/misure/azioni";
import { eliminaValutazione } from "@/app/(app)/valutazioni/azioni";

const AZIONI = { misure: eliminaMisure, valutazioni: eliminaValutazione };

/** Pulsante con conferma per eliminare le misure o la valutazione di un mese (solo amministratore). */
export function EliminaRilevazione({ tipo, atletaId, mese, testo }: { tipo: keyof typeof AZIONI; atletaId: string; mese: string; testo?: string }) {
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();
  const etichetta = testo ?? (tipo === "misure" ? "Elimina misure del mese" : "Elimina valutazione del mese");
  return (
    <>
      <button type="button" className="btn small danger" disabled={attesa}
        onClick={() => {
          if (!conferma) return setConferma(true);
          avvia(async () => {
            const r = await AZIONI[tipo](atletaId, mese);
            if (r.errore) setErrore(r.errore);
            setConferma(false);
          });
        }}>
        {attesa ? "Elimino…" : conferma ? "Conferma eliminazione" : etichetta}
      </button>
      {conferma && !attesa && <button type="button" className="btn small" onClick={() => setConferma(false)}>Annulla</button>}
      {errore && <span className="errore">{errore}</span>}
    </>
  );
}
