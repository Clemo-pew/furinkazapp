"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { kataValido } from "@/lib/domain/kata";
import { idDaLinkYoutube } from "@/lib/domain/kataVideo";

export type Esito = { errore?: string; ok?: boolean } | undefined;

const mancaTabella = (m: string) => /kata_video/.test(m) && /does not exist|Could not find/i.test(m);
const MSG_MIGRAZIONE = "Per cambiare i video esegui supabase/migrations/0007_kata_video.sql nel SQL Editor di Supabase.";

/** Imposta il video di un kata incollando un link YouTube (staff). */
export async function impostaVideoKata(kata: string, _: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  if (!kataValido(kata)) return { errore: "Kata sconosciuto." };
  const id = idDaLinkYoutube(String(form.get("link") ?? ""));
  if (!id) return { errore: "Link non riconosciuto: incolla l'indirizzo di un video YouTube (watch, youtu.be o shorts)." };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("kata_video").upsert({ dojo_id: c.dojo.id, kata, youtube_id: id, updated_at: new Date().toISOString() });
  if (error) return { errore: mancaTabella(error.message) ? MSG_MIGRAZIONE : error.message };
  revalidatePath("/kata");
  return { ok: true };
}

/** Torna al video predefinito (o a nessun video) per un kata (staff). */
export async function ripristinaVideoKata(kata: string): Promise<{ errore?: string }> {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("kata_video").delete().eq("dojo_id", c.dojo.id).eq("kata", kata);
  if (error) return { errore: mancaTabella(error.message) ? MSG_MIGRAZIONE : error.message };
  revalidatePath("/kata");
  return {};
}
