"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { tipoValido } from "@/lib/domain/certificato";

export type Esito = { errore?: string } | undefined;

export async function salvaAtleta(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const id = String(form.get("id") ?? "");
  const anno = Number(form.get("anno_nascita"));
  const dati = {
    nome: String(form.get("nome") ?? "").trim(),
    sesso: String(form.get("sesso")) === "F" ? "F" : "M",
    anno_nascita: anno || null,
    cintura: Number(form.get("cintura") ?? 0),
    note: String(form.get("note") ?? "").trim() || null,
    archiviato: form.get("archiviato") === "on",
  };
  if (!dati.nome) return { errore: "Il nome è obbligatorio." };

  // Certificato medico: tipo e scadenza vanno insieme; entrambi vuoti = nessun certificato.
  const tipo = String(form.get("cert_tipo") ?? "");
  const scadenza = String(form.get("cert_scadenza") ?? "");
  if (Boolean(tipo) !== Boolean(scadenza)) return { errore: "Certificato medico: indica sia il tipo sia la data di scadenza (o lascia vuoti entrambi)." };
  if (tipo && !tipoValido(tipo)) return { errore: "Tipo di certificato non valido." };
  if (scadenza && !/^\d{4}-\d{2}-\d{2}$/.test(scadenza)) return { errore: "Data di scadenza non valida." };

  const supabase = await supabaseServer();
  const { data, error } = id
    ? await supabase.from("atleti").update(dati).eq("id", id).select("id").single()
    : await supabase.from("atleti").insert({ ...dati, dojo_id: c.dojo.id }).select("id").single();
  if (error) return { errore: error.message };

  const { error: errCert } = tipo
    ? await supabase.from("certificati_medici").upsert({ atleta_id: data.id, dojo_id: c.dojo.id, tipo, scadenza })
    : await supabase.from("certificati_medici").delete().eq("atleta_id", data.id);
  revalidatePath("/", "layout");
  // L'atleta è già salvato: se il certificato non va, si torna alla modifica con l'avviso (senza duplicare l'atleta).
  if (errCert && (tipo || !/does not exist|Could not find/i.test(errCert.message))) redirect(`/atleti/${data.id}/modifica?errore=certificato`);
  redirect(`/atleti/${data.id}`);
}

export async function eliminaAtleta(id: string) {
  await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("atleti").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/squadra");
}
