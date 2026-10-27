import Link from "next/link";

export default function NonTrovato() {
  return (
    <main className="wrap accesso">
      <div className="card">
        <h1>Pagina non trovata</h1>
        <p className="hint">La pagina non esiste oppure non hai i permessi per vederla.</p>
        <Link className="btn" href="/">Torna all&apos;inizio</Link>
      </div>
    </main>
  );
}
