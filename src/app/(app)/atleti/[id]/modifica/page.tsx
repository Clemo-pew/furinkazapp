import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { certificatiMedici, leggiAtleta, noteAtleta } from "@/lib/data/query";
import { FormAtleta } from "../../FormAtleta";

export const metadata: Metadata = { title: "Modifica atleta" };

export default async function ModificaAtleta({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ errore?: string }> }) {
  const c = await contestoStaff();
  const { id } = await params;
  const [atleta, certificati] = await Promise.all([leggiAtleta(id), certificatiMedici(c.dojo.id, id)]);
  if (!atleta) notFound();
  atleta.note = await noteAtleta(id, atleta.note);
  const { errore } = await searchParams;
  return (
    <>
      <h1>Modifica {atleta.nome}</h1>
      {errore === "certificato" && (
        <p className="errore" role="alert">
          I dati dell&apos;atleta sono salvati, ma il certificato medico no. Se non l&apos;hai ancora fatto, esegui
          supabase/migrations/0009_certificati_medici.sql nel SQL Editor di Supabase e riprova.
        </p>
      )}
      <FormAtleta atleta={atleta} certificato={certificati[0]} />
    </>
  );
}
