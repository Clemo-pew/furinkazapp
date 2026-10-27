import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { leggiAtleta } from "@/lib/data/query";
import { FormAtleta } from "../../FormAtleta";

export const metadata: Metadata = { title: "Modifica atleta" };

export default async function ModificaAtleta({ params }: { params: Promise<{ id: string }> }) {
  await contestoStaff();
  const atleta = await leggiAtleta((await params).id);
  if (!atleta) notFound();
  return (
    <>
      <h1>Modifica {atleta.nome}</h1>
      <FormAtleta atleta={atleta} />
    </>
  );
}
