import type { Metadata } from "next";
import { Segno } from "@/components/Logo";
import { Kanji } from "@/components/Kanji";
import { FormAccesso } from "./FormAccesso";

export const metadata: Metadata = { title: "Accedi" };

export default async function PaginaAccesso({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <main className="wrap accesso">
      <div className="card">
        <div className="vetrina">
          <Segno altezza={110} />
          <span className="logo">Furinkaz<span className="logo-app">App</span></span>
          <Kanji altezza={26} className="kanji" />
          <p className="hint">Misure fisiche e analisi del kumite dei tuoi atleti.</p>
        </div>
        {errore && <p className="errore">Il link non è valido o è scaduto. Accedi di nuovo.</p>}
        <FormAccesso />
      </div>
    </main>
  );
}
