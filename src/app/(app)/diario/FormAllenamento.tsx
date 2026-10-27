"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { ARGOMENTI, DURATA_PREDEFINITA } from "@/lib/domain/diario";
import type { Allenamento } from "@/lib/domain/tipi";
import { eliminaAllenamento, salvaAllenamento } from "./azioni";

interface Props {
  allenamento?: Allenamento;
  atleti: { id: string; nome: string }[];
  oggi: string;
}

export function FormAllenamento({ allenamento, atleti, oggi }: Props) {
  const [stato, azione, attesa] = useActionState(salvaAllenamento, undefined);
  const [argomenti, setArgomenti] = useState<string[]>(allenamento?.argomenti ?? []);
  const [presenti, setPresenti] = useState<Set<string>>(new Set(allenamento?.presenti ?? []));
  const [conferma, setConferma] = useState(false);
  const [eliminando, avvia] = useTransition();

  const cambiaArgomento = (k: string) =>
    setArgomenti((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const cambiaPresente = (id: string) =>
    setPresenti((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <form action={azione} className="stack">
      {allenamento && <input type="hidden" name="id" value={allenamento.id} />}
      {argomenti.map((a) => <input key={a} type="hidden" name="argomenti" value={a} />)}
      {[...presenti].map((p) => <input key={p} type="hidden" name="presenti" value={p} />)}

      <section className="card">
        <div className="griglia">
          <label className="campo">Data<input id="data" name="data" type="date" required defaultValue={allenamento?.data ?? oggi} /></label>
          <label className="campo">Durata (minuti)
            <input id="durata_min" name="durata_min" type="number" min={1} max={600} inputMode="numeric"
              defaultValue={allenamento ? allenamento.durata_min ?? "" : DURATA_PREDEFINITA} />
          </label>
          <label className="campo tutta">Titolo (facoltativo)
            <input id="titolo" name="titolo" maxLength={120} defaultValue={allenamento?.titolo ?? ""} placeholder="Es. Preparazione regionale, lavoro sulle uscite" />
          </label>
        </div>
        <div className="stack-s">
          <h3>Argomenti</h3>
          <div className="seg">
            {ARGOMENTI.map((a) => (
              <button key={a.chiave} type="button" className="opt" aria-pressed={argomenti.includes(a.chiave)} onClick={() => cambiaArgomento(a.chiave)}>{a.nome}</button>
            ))}
          </div>
        </div>
        <label className="campo">Cosa abbiamo fatto
          <textarea id="descrizione" name="descrizione" rows={9} defaultValue={allenamento?.descrizione ?? ""}
            placeholder={"Es.\nRiscaldamento 15 min: corsa e mobilità articolare\nKihon: kizami + gyaku-zuki in avanzamento, 5×10\nKumite: uscite laterali dopo l'attacco, a coppie\nDefaticamento e stretching"} />
        </label>
      </section>

      <section className="card">
        <div className="testata">
          <h3>Presenti · {presenti.size} di {atleti.length}</h3>
          <div className="bar">
            <button type="button" className="btn small" onClick={() => setPresenti(new Set(atleti.map((a) => a.id)))}>Tutti</button>
            <button type="button" className="btn small" onClick={() => setPresenti(new Set())}>Nessuno</button>
          </div>
        </div>
        {atleti.length ? (
          <div className="seg">
            {atleti.map((a) => (
              <button key={a.id} type="button" className="opt" aria-pressed={presenti.has(a.id)} onClick={() => cambiaPresente(a.id)}>{a.nome}</button>
            ))}
          </div>
        ) : (
          <p className="hint">Nessun atleta in elenco.</p>
        )}
      </section>

      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}
      <div className="bar">
        {allenamento && (
          <button type="button" className="btn danger" disabled={eliminando}
            onClick={() => (conferma ? avvia(() => eliminaAllenamento(allenamento.id)) : setConferma(true))}>
            {conferma ? "Conferma eliminazione" : "Elimina"}
          </button>
        )}
        <span className="grow" />
        <Link className="btn" href="/diario">Annulla</Link>
        <button className="btn primary" disabled={attesa}>{attesa ? "Salvo…" : "Salva allenamento"}</button>
      </div>
    </form>
  );
}
