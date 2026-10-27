"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { generaPassword } from "@/lib/domain/credenziali";
import { nomeRuolo } from "@/lib/domain/ruoli";
import type { StatoAccesso } from "@/lib/data/accessi";
import { creaAccesso, reimpostaPassword, rimuoviAccesso, type Esito } from "./accesso";

/** Riquadro "Accesso all'app" nella scheda atleta (solo amministratore). */
export function AccessoAtleta({ atletaId, stato, nomeUtenteProposto }: { atletaId: string; stato: StatoAccesso; nomeUtenteProposto: string }) {
  const [esitoCrea, crea, attesaCrea] = useActionState(creaAccesso.bind(null, atletaId), undefined);
  const [esitoReset, reset, attesaReset] = useActionState(reimpostaPassword.bind(null, atletaId), undefined);
  const [esitoRimuovi, setEsitoRimuovi] = useState<Esito>(undefined);
  const [conferma, setConferma] = useState(false);
  const [mostraReset, setMostraReset] = useState(false);
  const [attesaRimuovi, avvia] = useTransition();
  // generata nel browser dopo il caricamento (non sul server), così ogni volta è diversa
  const [password, setPassword] = useState("");
  const [passwordReset, setPasswordReset] = useState("");
  useEffect(() => { setPassword(generaPassword()); setPasswordReset(generaPassword()); }, []);

  if (!stato.disponibile) {
    return (
      <section className="card" id="accesso">
        <h3>Accesso all&apos;app</h3>
        <p className="hint">
          Per creare gli accessi degli atleti manca la chiave segreta di Supabase su Vercel
          (variabile <span className="num">SUPABASE_SERVICE_ROLE_KEY</span>). La guida è nel README, alla sezione «Accessi degli atleti».
        </p>
      </section>
    );
  }

  const credenziali = esitoCrea?.credenziali ?? esitoReset?.credenziali;

  return (
    <section className="card" id="accesso">
      <h3>Accesso all&apos;app</h3>

      {credenziali && <Credenziali {...credenziali} />}

      {!stato.collegato ? (
        <form action={crea} className="stack-s">
          <p className="hint">Crea le credenziali e comunicale tu all&apos;atleta. Non potrà modificare nulla. Con «Allievo+» vede anche i voti delle valutazioni.</p>
          <div className="griglia">
            <label className="campo">Nome utente o email
              <input id="login" name="login" defaultValue={nomeUtenteProposto} autoComplete="off" autoCapitalize="none" spellCheck={false} required />
            </label>
            <label className="campo">Ruolo
              <select id="ruolo-accesso" name="ruolo" defaultValue="atleta">
                <option value="atleta">Allievo (senza voti)</option>
                <option value="atleta_plus">Allievo+ (vede le valutazioni)</option>
              </select>
            </label>
            <label className="campo">Password
              <input id="password-nuova" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" minLength={8} required style={{ fontFamily: "var(--mono)" }} />
            </label>
          </div>
          {esitoCrea?.errore && <p className="errore" role="alert">{esitoCrea.errore}</p>}
          <div className="bar"><button className="btn primary" disabled={attesaCrea}>{attesaCrea ? "Creo…" : "Crea accesso"}</button></div>
        </form>
      ) : (
        <div className="stack-s">
          <p>
            Entra con <b className="num">{stato.login ?? "—"}</b>
            {stato.ruolo && <> come <b>{nomeRuolo(stato.ruolo)}</b> <span className="hint">(si cambia da Impostazioni)</span></>}
          </p>
          {esitoRimuovi?.errore && <p className="errore" role="alert">{esitoRimuovi.errore}</p>}
          {esitoRimuovi?.ok && <p className="ok">{esitoRimuovi.ok}</p>}
          {mostraReset ? (
            <form action={reset} className="bar">
              <input id="password-reset" name="password" value={passwordReset} onChange={(e) => setPasswordReset(e.target.value)} aria-label="Nuova password" minLength={8} required
                className="grow" style={{ width: "auto", minWidth: 160, fontFamily: "var(--mono)" }} />
              <button className="btn primary" disabled={attesaReset}>Imposta password</button>
              <button type="button" className="btn" onClick={() => setMostraReset(false)}>Annulla</button>
              {esitoReset?.errore && <p className="errore" role="alert">{esitoReset.errore}</p>}
            </form>
          ) : (
            <div className="bar">
              <button type="button" className="btn small" onClick={() => setMostraReset(true)}>Reimposta password</button>
              <button type="button" className="btn small danger" disabled={attesaRimuovi}
                onClick={() => (conferma ? avvia(async () => setEsitoRimuovi(await rimuoviAccesso(atletaId))) : setConferma(true))}>
                {conferma ? "Conferma: togli accesso" : "Togli accesso"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Credenziali({ login, password }: { login: string; password: string }) {
  const [copiato, setCopiato] = useState(false);
  const testo = `FurinkazApp\nNome utente: ${login}\nPassword: ${password}`;
  return (
    <div className="stack-s" style={{ background: "var(--soft)", padding: 12, borderRadius: 10 }}>
      <p className="ok">Credenziali pronte da comunicare all&apos;atleta:</p>
      <div className="num" style={{ whiteSpace: "pre-wrap", userSelect: "all" }}>{`Nome utente: ${login}\nPassword: ${password}`}</div>
      <div className="bar">
        <button type="button" className="btn small" onClick={() => navigator.clipboard?.writeText(testo).then(() => setCopiato(true), () => {})}>
          {copiato ? "Copiate" : "Copia"}
        </button>
        <span className="hint">Annotale ora: per sicurezza la password non verrà più mostrata.</span>
      </div>
    </div>
  );
}
