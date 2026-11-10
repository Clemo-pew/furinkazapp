import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { TITOLARE } from "@/lib/privacy";
import { Logo } from "@/components/Logo";
import { FormConsenso } from "./FormConsenso";

export const metadata: Metadata = { title: "Privacy" };

/** Accettazione dell'informativa (al primo accesso o dopo un aggiornamento) e modifica delle proprie scelte. */
export default async function AccettaPrivacy() {
  const c = await contesto();
  const gia = c.privacy && c.privacy.il; // già accettata questa versione (il = null se la tabella non esiste ancora)
  return (
    <main className="wrap accesso">
      <div className="card" style={{ width: "min(560px, 100%)" }}>
        <Logo altezza={34} />
        <div className="stack-s">
          <h1>{gia ? "Le tue scelte sulla privacy" : "Prima di iniziare"}</h1>
          <p>
            {TITOLARE.denominazione || c.dojo.nome} usa FurinkazApp per seguire la preparazione degli atleti.
            Nell&apos;app ci sono dati come misure fisiche, valutazioni e incontri: chi può vedere cosa è spiegato
            nell&apos;<Link href="/privacy" target="_blank">informativa completa</Link>.
          </p>
          {gia && <p className="ok">Accettata il {new Date(c.privacy!.il!).toLocaleDateString("it-IT")}.</p>}
        </div>
        <FormConsenso haScheda={Boolean(c.atletaId)} attuale={gia ? c.privacy : null} />
        {gia && <p className="hint"><Link href="/">← Torna all&apos;app</Link></p>}
      </div>
    </main>
  );
}
