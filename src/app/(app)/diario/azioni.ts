"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { ARGOMENTI } from "@/lib/domain/diario";

export type Esito = { errore?: string } | undefined;

const tabellaMancante = (m: string) => /allenamenti|salva_allenamento/.test(m) && /does not exist|Could not find/i.test(m);

export async function salvaAllenamento(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const data = String(form.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { errore: "Data non valida." };
  const durata = String(form.get("durata_min") ?? "").trim();
  if (durata && !(Number(durata) >= 1 && Number(durata) <= 600)) return { errore: "La durata va da 1 a 600 minuti." };
  const chiavi = new Set<string>(ARGOMENTI.map((a) => a.chiave));
  const argomenti = form.getAll("argomenti").map(String).filter((a) => chiavi.has(a));
  const descrizione = String(form.get("descrizione") ?? "").trim();
  if (!descrizione && !argomenti.length) return { errore: "Scrivi cosa avete fatto o scegli almeno un argomento." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_allenamento", {
    p: {
      id: String(form.get("id") ?? ""),
      dojo_id: c.dojo.id,
      data,
      durata_min: durata ? String(Math.round(Number(durata))) : "",
      argomenti,
      titolo: String(form.get("titolo") ?? "").trim(),
      descrizione,
      presenti: form.getAll("presenti").map(String),
    },
  });
  if (error) {
    if (tabellaMancante(error.message))
      return { errore: "Manca il diario nel database: esegui supabase/migrations/0004_diario_allenamenti.sql nel SQL Editor di Supabase." };
    return { errore: error.message };
  }
  revalidatePath("/diario");
  revalidatePath("/", "layout");
  redirect("/diario");
}

export async function eliminaAllenamento(id: string) {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("allenamenti").delete().eq("id", id).eq("dojo_id", c.dojo.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/diario");
}
