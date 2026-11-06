"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { TIPI_EVENTO } from "@/lib/domain/eventi";
import type { Evento } from "@/lib/domain/tipi";
import { eliminaEvento, salvaEvento } from "./azioni";

export function FormEvento({ evento, dataPredefinita }: { evento?: Evento; dataPredefinita: string }) {
  const [stato, azione, attesa] = useActionState(salvaEvento, undefined);
  const [piuGiorni, setPiuGiorni] = useState(Boolean(evento?.data_fine));
  const [conferma, setConferma] = useState(false);
  const [eliminando, avvia] = useTransition();

  return (
    <form action={azione} className="card">
      {evento && <input type="hidden" name="id" value={evento.id} />}
      <div className="griglia">
        <label className="campo tutta">Nome dell&apos;evento
          <input id="titolo" name="titolo" required maxLength={120} defaultValue={evento?.titolo} placeholder="Es. Campionato regionale Sicilia" />
        </label>
        <label className="campo">Tipo
          <select id="tipo" name="tipo" defaultValue={evento?.tipo ?? "gara"}>
            {TIPI_EVENTO.map((t) => <option key={t.chiave} value={t.chiave}>{t.nome}</option>)}
          </select>
        </label>
        <label className="campo">{piuGiorni ? "Dal" : "Data"}
          <input id="data_inizio" name="data_inizio" type="date" required defaultValue={evento?.data_inizio ?? dataPredefinita} />
        </label>
        {piuGiorni && (
          <label className="campo">Al<input id="data_fine" name="data_fine" type="date" defaultValue={evento?.data_fine ?? ""} /></label>
        )}
        <label className="campo">Ora (facoltativa)<input id="ora" name="ora" type="time" defaultValue={evento?.ora ?? ""} /></label>
        <label className="bar tutta" style={{ fontSize: ".9rem" }}>
          <input id="piu-giorni" type="checkbox" checked={piuGiorni} onChange={(e) => setPiuGiorni(e.target.checked)} style={{ width: "auto" }} />
          Dura più giorni
        </label>
        <label className="campo tutta">Luogo<input id="luogo" name="luogo" maxLength={160} defaultValue={evento?.luogo ?? ""} placeholder="Es. PalaUnipa, Palermo" /></label>
        <label className="campo tutta">Link (facoltativo)
          <input id="link" name="link" type="url" inputMode="url" maxLength={500} defaultValue={evento?.link ?? ""} placeholder="Bando, iscrizioni, programma…" />
        </label>
        <label className="campo tutta">Dettagli
          <textarea id="descrizione" name="descrizione" rows={5} defaultValue={evento?.descrizione ?? ""}
            placeholder={"Es.\nCategorie: esordienti, cadetti, juniores\nIscrizioni entro il 10/11\nRitrovo in palestra alle 7:30"} />
        </label>
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        {evento && (
          <button type="button" className="btn danger" disabled={eliminando}
            onClick={() => (conferma ? avvia(() => eliminaEvento(evento.id)) : setConferma(true))}>
            {conferma ? "Conferma eliminazione" : "Elimina"}
          </button>
        )}
        <span className="grow" />
        <Link className="btn" href="/eventi">Annulla</Link>
        <button className="btn primary" disabled={attesa}>{attesa ? "Salvo…" : "Salva evento"}</button>
      </div>
    </form>
  );
}
