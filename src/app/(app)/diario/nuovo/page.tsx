import type { Metadata } from "next";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti } from "@/lib/data/query";
import { oggi } from "@/lib/domain/date";
import { FormAllenamento } from "../FormAllenamento";

export const metadata: Metadata = { title: "Nuovo allenamento" };

export default async function NuovoAllenamento() {
  const c = await contestoStaff();
  const atleti = await elencoAtleti(c.dojo.id);
  return (
    <>
      <h1>Nuovo allenamento</h1>
      <FormAllenamento atleti={atleti.map((a) => ({ id: a.id, nome: a.nome }))} oggi={oggi()} />
    </>
  );
}
