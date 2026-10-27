"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { MISURE } from "@/lib/domain/misure";
import { primoDelMese } from "@/lib/domain/date";

export type Esito = { errore?: string; ok?: boolean } | undefined;

export async function salvaMisure(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const atleta_id = String(form.get("atleta_id"));
  const mese = String(form.get("mese"));
  if (!/^\d{4}-\d{2}$/.test(mese)) return { errore: "Mese non valido." };

  const valori: Record<string, number> = {};
  for (const m of MISURE) {
    const grezzo = String(form.get(m.chiave) ?? "").replace(",", ".").trim();
    if (!grezzo) continue;
    const n = Number(grezzo);
    if (!Number.isFinite(n) || n < 0) return { errore: `${m.nome}: valore non valido.` };
    valori[m.chiave] = Math.round(n * 10) / 10;
  }
  if (!Object.keys(valori).length) return { errore: "Inserisci almeno un valore." };

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("misure")
    .upsert({ dojo_id: c.dojo.id, atleta_id, mese: primoDelMese(mese), valori }, { onConflict: "atleta_id,mese" });
  if (error) return { errore: error.message };

  revalidatePath("/misure");
  revalidatePath(`/atleti/${atleta_id}`);
  revalidatePath("/squadra");
  return { ok: true };
}
