"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { impostaVideoKata, ripristinaVideoKata } from "./azioni";

/** Controlli dello staff per cambiare o ripristinare il video di un kata. */
export function GestioneVideo({ kata, haVideo, personalizzato, haPredefinito }: { kata: string; haVideo: boolean; personalizzato: boolean; haPredefinito: boolean }) {
  const [aperto, setAperto] = useState(false);
  const [stato, azione, attesa] = useActionState(impostaVideoKata.bind(null, kata), undefined);
  const [errore, setErrore] = useState<string | null>(null);
  const [ripristino, avvia] = useTransition();

  useEffect(() => { if (stato?.ok) setAperto(false); }, [stato]);

  if (!aperto) {
    return (
      <div className="bar">
        <button type="button" className="btn small" onClick={() => setAperto(true)}>{haVideo ? "Cambia video" : "Aggiungi video"}</button>
        {personalizzato && (
          <button type="button" className="btn small" disabled={ripristino}
            onClick={() => avvia(async () => { const r = await ripristinaVideoKata(kata); setErrore(r.errore ?? null); })}>
            {haPredefinito ? "Ripristina video originale" : "Togli video"}
          </button>
        )}
        {errore && <span className="errore">{errore}</span>}
      </div>
    );
  }
  return (
    <form action={azione} className="stack-s">
      <input id={`link-${kata}`} name="link" required placeholder="Incolla il link YouTube del video" autoComplete="off" autoFocus />
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        <button className="btn small primary" disabled={attesa}>Salva</button>
        <button type="button" className="btn small" onClick={() => setAperto(false)}>Annulla</button>
      </div>
    </form>
  );
}
