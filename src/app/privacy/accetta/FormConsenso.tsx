"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { accettaPrivacy } from "./azioni";

interface Props {
  haScheda: boolean;
  attuale: { consensoSalute: boolean; accettatoDa: "interessato" | "genitore"; nomeGenitore: string | null } | null;
}

export function FormConsenso({ haScheda, attuale }: Props) {
  const [stato, azione, attesa] = useActionState(accettaPrivacy, undefined);
  const [chi, setChi] = useState<"interessato" | "genitore">(attuale?.accettatoDa ?? "interessato");

  return (
    <form action={azione} className="stack">
      {haScheda && (
        <fieldset className="stack-s consenso-gruppo">
          <legend><b>Chi sta accettando?</b></legend>
          <label className="consenso-scelta">
            <input type="radio" name="accettato_da" value="interessato" checked={chi === "interessato"} onChange={() => setChi("interessato")} />
            <span>Sono l&apos;atleta e ho almeno 18 anni</span>
          </label>
          <label className="consenso-scelta">
            <input type="radio" name="accettato_da" value="genitore" checked={chi === "genitore"} onChange={() => setChi("genitore")} />
            <span>Sono il genitore o tutore dell&apos;atleta minorenne</span>
          </label>
          {chi === "genitore" && (
            <label className="campo">Nome e cognome del genitore o tutore
              <input id="nome_genitore" name="nome_genitore" required autoComplete="name" defaultValue={attuale?.nomeGenitore ?? ""} />
            </label>
          )}
        </fieldset>
      )}
      {!haScheda && <input type="hidden" name="accettato_da" value="interessato" />}

      <label className="consenso-scelta consenso-obbligatorio">
        <input type="checkbox" name="letto" required defaultChecked={Boolean(attuale)} />
        <span>
          Ho letto l&apos;<Link href="/privacy" target="_blank">informativa sulla privacy</Link>.
          <span className="hint"> Obbligatorio per usare l&apos;app.</span>
        </span>
      </label>

      {haScheda && (
        <label className="consenso-scelta">
          <input type="checkbox" name="consenso_salute" defaultChecked={attuale?.consensoSalute ?? false} />
          <span>
            Acconsento al trattamento delle <b>misure fisiche</b> (peso, massa grassa, circonferenze) e della <b>data di scadenza del certificato medico</b>,
            che possono riguardare la salute.
            <span className="hint"> Facoltativo: senza questo consenso non potrai inserire le tue misure. Puoi cambiarlo quando vuoi da questa pagina.</span>
          </span>
        </label>
      )}

      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <button className="btn primary" disabled={attesa}>{attesa ? "Salvo…" : attuale ? "Salva le mie scelte" : "Accetta e continua"}</button>
    </form>
  );
}
