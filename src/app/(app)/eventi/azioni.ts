"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { tipoEventoValido } from "@/lib/domain/eventi";

export type Esito = { errore?: string } | undefined;

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function salvaEvento(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const id = String(form.get("id") ?? "");
  const testo = (k: string) => String(form.get(k) ?? "").trim();
  const dati = {
    titolo: testo("titolo"),
    tipo: testo("tipo") || "altro",
    data_inizio: testo("data_inizio"),
    data_fine: testo("data_fine") || null,
    ora: testo("ora") || null,
    luogo: testo("luogo") || null,
    descrizione: testo("descrizione") || null,
    link: testo("link") || null,
  };
  if (!dati.titolo) return { errore: "Scrivi il nome dell'evento." };
  if (!tipoEventoValido(dati.tipo)) return { errore: "Tipo di evento non valido." };
  if (!RE_DATA.test(dati.data_inizio)) return { errore: "Indica la data dell'evento." };
  if (dati.data_fine && (!RE_DATA.test(dati.data_fine) || dati.data_fine < dati.data_inizio)) return { errore: "La data di fine non può essere prima dell'inizio." };
  if (dati.data_fine === dati.data_inizio) dati.data_fine = null;
  if (dati.ora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dati.ora)) return { errore: "Ora non valida." };
  if (dati.link && !/^https?:\/\//i.test(dati.link)) dati.link = `https://${dati.link}`;

  const supabase = await supabaseServer();
  const { error } = id
    ? await supabase.from("eventi").update(dati).eq("id", id).eq("dojo_id", c.dojo.id)
    : await supabase.from("eventi").insert({ ...dati, dojo_id: c.dojo.id });
  if (error) {
    if (/eventi/.test(error.message) && /does not exist|Could not find/i.test(error.message))
      return { errore: "Manca la tabella degli eventi: esegui supabase/migrations/0010_eventi.sql nel SQL Editor di Supabase." };
    return { errore: error.message };
  }
  revalidatePath("/eventi");
  revalidatePath("/");
  redirect(`/eventi?mese=${dati.data_inizio.slice(0, 7)}`);
}

export async function eliminaEvento(id: string) {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("eventi").delete().eq("id", id).eq("dojo_id", c.dojo.id);
  if (error) throw new Error(error.message);
  revalidatePath("/eventi");
  revalidatePath("/");
  redirect("/eventi");
}
