import type { Metadata } from "next";
import { FormAccesso } from "./FormAccesso";

export const metadata: Metadata = { title: "Accedi" };

export default async function PaginaAccesso({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <main className="wrap accesso">
      <div className="card">
        <div className="logo"><i aria-hidden="true" />Registro Dojo</div>
        <p className="hint">Misure fisiche e analisi del kumite dei tuoi atleti.</p>
        {errore && <p className="errore">Il link di conferma non è valido o è scaduto. Accedi o registrati di nuovo.</p>}
        <FormAccesso />
      </div>
    </main>
  );
}
