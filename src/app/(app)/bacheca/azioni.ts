"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";

export type Esito = { errore?: string } | undefined;

export async function salvaComunicazione(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const id = String(form.get("id") ?? "");
  const titolo = String(form.get("titolo") ?? "").trim();
  const testo = String(form.get("testo") ?? "").trim();
  const scade_il = String(form.get("scade_il") ?? "") || null;
  if (!titolo) return { errore: "Scrivi un titolo." };
  if (scade_il && !/^\d{4}-\d{2}-\d{2}$/.test(scade_il)) return { errore: "Data non valida." };
  const dati = { titolo, testo, scade_il, in_evidenza: form.get("in_evidenza") === "on" };

  const supabase = await supabaseServer();
  const { error } = id
    ? await supabase.from("comunicazioni").update(dati).eq("id", id).eq("dojo_id", c.dojo.id)
    : await supabase.from("comunicazioni").insert({ ...dati, dojo_id: c.dojo.id, autore_nome: c.nomeUtente });
  if (error) {
    if (/comunicazioni/.test(error.message) && /does not exist|Could not find/i.test(error.message))
      return { errore: "Manca la bacheca nel database: esegui supabase/migrations/0011_bacheca.sql nel SQL Editor di Supabase." };
    return { errore: error.message };
  }
  revalidatePath("/bacheca");
  revalidatePath("/");
  redirect("/bacheca");
}

export async function eliminaComunicazione(id: string) {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("comunicazioni").delete().eq("id", id).eq("dojo_id", c.dojo.id);
  if (error) throw new Error(error.message);
  revalidatePath("/bacheca");
  revalidatePath("/");
  redirect("/bacheca");
}

/** Fissa o toglie dall'evidenza con un tocco, senza aprire il modulo. */
export async function cambiaEvidenza(id: string, in_evidenza: boolean) {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  await supabase.from("comunicazioni").update({ in_evidenza }).eq("id", id).eq("dojo_id", c.dojo.id);
  revalidatePath("/bacheca");
  revalidatePath("/");
}
