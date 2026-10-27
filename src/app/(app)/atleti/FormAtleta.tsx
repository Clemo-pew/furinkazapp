"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CINTURE } from "@/lib/domain/cinture";
import type { Atleta } from "@/lib/domain/tipi";
import { eliminaAtleta, salvaAtleta } from "./azioni";

export function FormAtleta({ atleta }: { atleta?: Atleta }) {
  const [stato, azione, attesa] = useActionState(salvaAtleta, undefined);
  const [conferma, setConferma] = useState(false);
  const [eliminando, avvia] = useTransition();

  return (
    <form action={azione} className="card">
      {atleta && <input type="hidden" name="id" value={atleta.id} />}
      <div className="griglia">
        <label className="campo tutta">Nome e cognome<input id="nome" name="nome" required maxLength={80} defaultValue={atleta?.nome} /></label>
        <label className="campo">Sesso
          <select id="sesso" name="sesso" defaultValue={atleta?.sesso ?? "M"}><option value="M">Maschile</option><option value="F">Femminile</option></select>
        </label>
        <label className="campo">Anno di nascita<input id="anno_nascita" name="anno_nascita" type="number" min={1920} max={2100} defaultValue={atleta?.anno_nascita ?? ""} /></label>
        <label className="campo">Cintura
          <select id="cintura" name="cintura" defaultValue={atleta?.cintura ?? 0}>
            {CINTURE.map((c, i) => <option key={c.nome} value={i}>{c.nome}</option>)}
          </select>
        </label>
        <label className="campo tutta">Note<textarea id="note" name="note" rows={3} defaultValue={atleta?.note ?? ""} placeholder="Infortuni, obiettivi, categoria di gara…" /></label>
        {atleta && (
          <label className="bar tutta" style={{ fontSize: ".9rem" }}>
            <input id="archiviato" type="checkbox" name="archiviato" defaultChecked={atleta.archiviato} style={{ width: "auto" }} />
            Archiviato (non si allena più: sparisce dagli elenchi ma i dati restano)
          </label>
        )}
      </div>
      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        {atleta && (
          <button type="button" className="btn danger" disabled={eliminando}
            onClick={() => (conferma ? avvia(() => eliminaAtleta(atleta.id)) : setConferma(true))}>
            {conferma ? "Conferma: elimina atleta e misure" : "Elimina"}
          </button>
        )}
        <span className="grow" />
        <Link className="btn" href={atleta ? `/atleti/${atleta.id}` : "/squadra"}>Annulla</Link>
        <button className="btn primary" disabled={attesa}>Salva</button>
      </div>
    </form>
  );
}
