import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti, leggiAllenamento } from "@/lib/data/query";
import { dataIt, oggi } from "@/lib/domain/date";
import { FormAllenamento } from "../FormAllenamento";

export const metadata: Metadata = { title: "Modifica allenamento" };

export default async function ModificaAllenamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await contestoStaff();
  const [allenamento, atleti] = await Promise.all([leggiAllenamento(id), elencoAtleti(c.dojo.id, { archiviati: true })]);
  if (!allenamento || allenamento.dojo_id !== c.dojo.id) notFound();
  // atleti attivi + eventuali archiviati che erano presenti quel giorno
  const elenco = atleti.filter((a) => !a.archiviato || allenamento.presenti.includes(a.id));
  return (
    <>
      <h1>Allenamento del {dataIt(allenamento.data)}</h1>
      <FormAllenamento allenamento={allenamento} atleti={elenco.map((a) => ({ id: a.id, nome: a.nome }))} oggi={oggi()} />
    </>
  );
}
