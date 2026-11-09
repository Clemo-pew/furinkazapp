"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { Comunicazione } from "@/lib/domain/tipi";
import { eliminaComunicazione, salvaComunicazione } from "./azioni";

export function FormComunicazione({ comunicazione }: { comunicazione?: Comunicazione }) {
  const [stato, azione, attesa] = useActionState(salvaComunicazione, undefined);
  const [conferma, setConferma] = useState(false);
  const [eliminando, avvia] = useTransition();
  return (
    <form action={azione} className="card">
      {comunicazione && <input type="hidden" name="id" value={comunicazione.id} />}
      <div className="griglia">
        <label className="campo tutta">Titolo
          <input id="titolo" name="titolo" required maxLength={140} defaultValue={comunicazione?.titolo} placeholder="Es. Lunedì palestra chiusa" />
        </label>
        <label className="campo tutta">Testo
          <textarea id="testo" name="testo" rows={7} defaultValue={comunicazione?.testo ?? ""}
            placeholder={"Es.\nLunedì 1 dicembre la palestra resta chiusa per manutenzione.\nL'allenamento è spostato a martedì alle 18:30."} />
        </label>
        <label className="bar tutta" style={{ fontSize: ".95rem" }}>
          <input id="in_evidenza" name="in_evidenza" type="checkbox" defaultChecked={comunicazione?.in_evidenza ?? true} style={{ width: "auto" }} />
          <span><b>In evidenza</b> <span className="hint">· fissata in cima alla bacheca e mostrata nella Home</span></span>
        </label>
        <label className="campo">Visibile in Home fino al (facoltativo)
          <input id="scade_il" name="scade_il" type="date" defaultValue={comunicazione?.scade_il ?? ""} />
        </label>
        <p className="hint" style={{ alignSelf: "end" }}>Dopo questa data passa tra le comunicazioni passate.</p>
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        {comunicazione && (
          <button type="button" className="btn danger" disabled={eliminando}
            onClick={() => (conferma ? avvia(() => eliminaComunicazione(comunicazione.id)) : setConferma(true))}>
            {conferma ? "Conferma eliminazione" : "Elimina"}
          </button>
        )}
        <span className="grow" />
        <Link className="btn" href="/bacheca">Annulla</Link>
        <button className="btn primary" disabled={attesa}>{attesa ? "Pubblico…" : comunicazione ? "Salva" : "Pubblica"}</button>
      </div>
    </form>
  );
}
