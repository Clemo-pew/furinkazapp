import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { leggiEvento } from "@/lib/data/query";
import { oggi } from "@/lib/domain/date";
import { FormEvento } from "../FormEvento";

export const metadata: Metadata = { title: "Modifica evento" };

export default async function ModificaEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await contestoStaff();
  const evento = await leggiEvento(id);
  if (!evento || evento.dojo_id !== c.dojo.id) notFound();
  return (
    <>
      <h1>Modifica evento</h1>
      <FormEvento evento={evento} dataPredefinita={oggi()} />
    </>
  );
}
