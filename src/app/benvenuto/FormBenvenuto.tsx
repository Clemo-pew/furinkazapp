"use client";
import { useActionState, useState } from "react";
import { creaDojo, usaCodice } from "./azioni";

export function FormBenvenuto() {
  const [scelta, setScelta] = useState<"codice" | "dojo">("codice");
  const [statoCodice, azioneCodice, attesaCodice] = useActionState(usaCodice, undefined);
  const [statoDojo, azioneDojo, attesaDojo] = useActionState(creaDojo, undefined);

  return (
    <div className="stack">
      <h1>Benvenuto</h1>
      <div className="seg">
        <button type="button" className="opt" aria-pressed={scelta === "codice"} onClick={() => setScelta("codice")}>Ho un codice invito</button>
        <button type="button" className="opt" aria-pressed={scelta === "dojo"} onClick={() => setScelta("dojo")}>Sono l&apos;allenatore, creo la società</button>
      </div>
      {scelta === "codice" ? (
        <form action={azioneCodice} className="stack">
          <p className="hint">Il codice te lo dà l&apos;allenatore dalla sezione Impostazioni.</p>
          <label className="campo">Codice invito
            <input id="codice" name="codice" required autoComplete="off" placeholder="Es. K7MP2QXA" style={{ textTransform: "uppercase", fontFamily: "var(--mono)" }} />
          </label>
          {statoCodice?.errore && <p className="errore" role="alert">{statoCodice.errore}</p>}
          <button className="btn primary" disabled={attesaCodice}>Entra</button>
        </form>
      ) : (
        <form action={azioneDojo} className="stack">
          <p className="hint">Diventi amministratore: potrai aggiungere atleti e invitare istruttori e atleti.</p>
          <label className="campo">Nome della società<input id="nome-dojo" name="nome" required maxLength={80} placeholder="Es. Karate Club Palermo" /></label>
          {statoDojo?.errore && <p className="errore" role="alert">{statoDojo.errore}</p>}
          <button className="btn primary" disabled={attesaDojo}>Crea società</button>
        </form>
      )}
    </div>
  );
}
