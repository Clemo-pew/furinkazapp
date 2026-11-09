import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { leggiComunicazione } from "@/lib/data/query";
import { FormComunicazione } from "../FormComunicazione";

export const metadata: Metadata = { title: "Modifica comunicazione" };

export default async function ModificaComunicazione({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await contestoStaff();
  const com = await leggiComunicazione(id);
  if (!com || com.dojo_id !== c.dojo.id) notFound();
  return (
    <>
      <h1>Modifica comunicazione</h1>
      <FormComunicazione comunicazione={com} />
    </>
  );
}
