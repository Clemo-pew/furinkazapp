"use server";
import { revalidatePath } from "next/cache";
import { contesto, contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { MISURE } from "@/lib/domain/misure";
import { primoDelMese } from "@/lib/domain/date";

export type Esito = { errore?: string; ok?: boolean } | undefined;

/** Salva le misure di un mese. Lo staff per chiunque; un allievo solo per la propria scheda. */
export async function salvaMisure(_: Esito, form: FormData): Promise<Esito> {
  const c = await contesto();
  const atleta_id = String(form.get("atleta_id"));
  if (!c.staff && atleta_id !== c.atletaId) return { errore: "Puoi inserire solo le tue misure." };
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
  if (error) {
    if (/row-level security/i.test(error.message))
      return { errore: c.staff ? error.message : "Per inserire le tue misure serve un aggiornamento del database: avvisa l'allenatore (migrazione 0008)." };
    return { errore: error.message };
  }

  revalidatePath("/misure");
  revalidatePath(`/atleti/${atleta_id}`);
  revalidatePath("/squadra");
  return { ok: true };
}

/** Elimina una rilevazione mensile inserita per errore. Solo amministratore. */
export async function eliminaMisure(atletaId: string, mese: string): Promise<{ errore?: string }> {
  const c = await contestoStaff();
  if (c.ruolo !== "admin") return { errore: "Solo l'amministratore può eliminare le misure." };
  if (!/^\d{4}-\d{2}(-01)?$/.test(mese)) return { errore: "Mese non valido." };
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("misure")
    .delete()
    .eq("dojo_id", c.dojo.id)
    .eq("atleta_id", atletaId)
    .eq("mese", primoDelMese(mese));
  if (error) return { errore: error.message };
  revalidatePath("/misure");
  revalidatePath(`/atleti/${atletaId}`);
  revalidatePath("/squadra");
  return {};
}
