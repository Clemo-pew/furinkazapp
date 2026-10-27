import type { Metadata } from "next";
import Link from "next/link";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti } from "@/lib/data/query";
import { oggi } from "@/lib/domain/date";
import { Registrazione } from "./Registrazione";

export const metadata: Metadata = { title: "Nuovo incontro" };

export default async function NuovoIncontro() {
  const c = await contestoStaff();
  const atleti = await elencoAtleti(c.dojo.id);
  if (atleti.length < 1) {
    return (
      <div className="list"><div className="empty">
        <b>Prima aggiungi gli atleti.</b>
        <Link className="btn" href="/atleti/nuovo">Aggiungi atleta</Link>
      </div></div>
    );
  }
  return <Registrazione atleti={atleti.map((a) => ({ id: a.id, nome: a.nome }))} oggi={oggi()} />;
}
