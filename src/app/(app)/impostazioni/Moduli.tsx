"use client";
import { useActionState, useState, useTransition } from "react";
import { cambiaRuolo, creaInvito, rinominaDojo } from "./azioni";

export function FormNomeDojo({ nome }: { nome: string }) {
  const [stato, azione, attesa] = useActionState(rinominaDojo, undefined);
  return (
    <form action={azione} className="bar">
      <input id="nome-dojo" name="nome" defaultValue={nome} aria-label="Nome della società" className="grow" style={{ width: "auto", minWidth: 200 }} />
      <button className="btn" disabled={attesa}>Salva</button>
      {stato?.errore && <p className="errore">{stato.errore}</p>}
      {stato?.ok && <p className="ok">{stato.ok}</p>}
    </form>
  );
}

export function FormInvito({ admin, atleti }: { admin: boolean; atleti: { id: string; nome: string }[] }) {
  const [stato, azione, attesa] = useActionState(creaInvito, undefined);
  const [ruolo, setRuolo] = useState("atleta");
  const [copiato, setCopiato] = useState(false);

  return (
    <form action={azione} className="stack-s">
      <div className="griglia">
        <label className="campo">Ruolo
          <select id="ruolo" name="ruolo" value={ruolo} onChange={(e) => setRuolo(e.target.value)}>
            <option value="atleta">Atleta</option>
            {admin && <option value="istruttore">Istruttore</option>}
            {admin && <option value="admin">Amministratore</option>}
          </select>
        </label>
        {ruolo === "atleta" && (
          <label className="campo">Scheda atleta
            <select id="atleta_id" name="atleta_id" required defaultValue="">
              <option value="" disabled>Scegli…</option>
              {atleti.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </label>
        )}
      </div>
      {ruolo === "atleta" && !atleti.length && <p className="hint">Tutti gli atleti hanno già un account collegato, oppure non ne hai ancora aggiunti.</p>}
      <div className="bar"><button className="btn primary" disabled={attesa}>Genera codice</button></div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      {stato?.ok && (
        <div className="bar" style={{ background: "var(--soft)", padding: 12, borderRadius: 10 }}>
          <span className="grow">Codice: <b className="num" style={{ fontSize: "1.2rem", letterSpacing: ".1em" }}>{stato.ok}</b></span>
          <button type="button" className="btn small" onClick={() => {
            navigator.clipboard?.writeText(stato.ok!).then(() => setCopiato(true), () => {});
          }}>{copiato ? "Copiato" : "Copia"}</button>
        </div>
      )}
    </form>
  );
}

export function PulsanteElimina({ azione, testo }: { azione: () => Promise<void>; testo: string }) {
  const [conferma, setConferma] = useState(false);
  const [attesa, avvia] = useTransition();
  return (
    <button type="button" className="btn small danger" disabled={attesa}
      onClick={() => (conferma ? avvia(() => azione()) : setConferma(true))}>
      {conferma ? "Conferma" : testo}
    </button>
  );
}

const ETICHETTE_RUOLO = { admin: "Amministratore", istruttore: "Istruttore", atleta: "Atleta" } as const;

/** Selettore del ruolo di una persona (solo amministratore). "Atleta" solo per chi ha una scheda collegata. */
export function SceltaRuolo({ userId, ruolo, haScheda }: { userId: string; ruolo: keyof typeof ETICHETTE_RUOLO; haScheda: boolean }) {
  const [stato, azione, attesa] = useActionState(cambiaRuolo.bind(null, userId), undefined);
  const [scelto, setScelto] = useState(ruolo);
  return (
    <form action={azione} className="bar" style={{ flexWrap: "nowrap" }}>
      <select id={`ruolo-${userId}`} name="ruolo" aria-label="Ruolo" value={scelto} onChange={(e) => setScelto(e.target.value as typeof ruolo)} style={{ width: "auto" }}>
        {(Object.keys(ETICHETTE_RUOLO) as (keyof typeof ETICHETTE_RUOLO)[])
          .filter((r) => r !== "atleta" || haScheda)
          .map((r) => <option key={r} value={r}>{ETICHETTE_RUOLO[r]}</option>)}
      </select>
      {scelto !== ruolo && <button className="btn small primary" disabled={attesa}>Salva</button>}
      {stato?.errore && <span className="errore">{stato.errore}</span>}
    </form>
  );
}
