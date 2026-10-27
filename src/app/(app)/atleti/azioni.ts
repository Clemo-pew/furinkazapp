"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";

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

  const supabase = await supabaseServer();
  const { data, error } = id
    ? await supabase.from("atleti").update(dati).eq("id", id).select("id").single()
    : await supabase.from("atleti").insert({ ...dati, dojo_id: c.dojo.id }).select("id").single();
  if (error) return { errore: error.message };

  revalidatePath("/", "layout");
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
