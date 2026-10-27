"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { isAllievo, ruoloValido } from "@/lib/domain/ruoli";

export type Esito = { errore?: string; ok?: string } | undefined;

export async function creaInvito(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const ruolo = String(form.get("ruolo"));
  const atleta_id = String(form.get("atleta_id") ?? "") || null;
  if (!ruoloValido(ruolo)) return { errore: "Ruolo non valido." };
  const allievo = isAllievo(ruolo);
  if (allievo && !atleta_id) return { errore: "Scegli la scheda dell'atleta da collegare." };
  if (ruolo !== "atleta" && c.ruolo !== "admin") return { errore: "Solo l'amministratore può invitare istruttori o Allievi+." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("inviti")
    .insert({ dojo_id: c.dojo.id, ruolo, atleta_id: allievo ? atleta_id : null })
    .select("codice")
    .single();
  if (error) return { errore: error.message };
  revalidatePath("/impostazioni");
  return { ok: data.codice };
}

export async function eliminaInvito(codice: string) {
  await contestoStaff();
  const supabase = await supabaseServer();
  await supabase.from("inviti").delete().eq("codice", codice);
  revalidatePath("/impostazioni");
}

export async function rimuoviMembro(userId: string) {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("membri").delete().eq("dojo_id", c.dojo.id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/impostazioni");
}

export async function rinominaDojo(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return { errore: "Il nome non può essere vuoto." };
  const supabase = await supabaseServer();
  const { error, count } = await supabase.from("dojos").update({ nome }, { count: "exact" }).eq("id", c.dojo.id);
  if (error) return { errore: error.message };
  if (!count) return { errore: "Solo l'amministratore può cambiare il nome." };
  revalidatePath("/", "layout");
  return { ok: "Nome aggiornato" };
}


/** L'amministratore cambia il ruolo di un'altra persona (mai il proprio: così resta sempre un amministratore). */
export async function cambiaRuolo(userId: string, _: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  if (c.ruolo !== "admin") return { errore: "Solo l'amministratore può cambiare i ruoli." };
  if (userId === c.userId) return { errore: "Non puoi cambiare il tuo ruolo." };
  const ruolo = String(form.get("ruolo"));
  if (!ruoloValido(ruolo)) return { errore: "Ruolo non valido." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("membri")
    .update({ ruolo })
    .eq("dojo_id", c.dojo.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) {
    if (/membri_check|check constraint/i.test(error.message))
      return { errore: "Per diventare Allievo o Allievo+ la persona deve essere collegata a una scheda atleta." };
    return { errore: error.message };
  }
  if (!data?.length) return { errore: "Modifica non consentita." };
  revalidatePath("/", "layout");
  return { ok: "Ruolo aggiornato" };
}
