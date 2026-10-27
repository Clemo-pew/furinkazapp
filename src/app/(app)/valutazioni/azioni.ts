"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { SCALA, VOCI_VALUTAZIONE } from "@/lib/domain/valutazioni";
import { primoDelMese } from "@/lib/domain/date";

export type Esito = { errore?: string; ok?: boolean } | undefined;

export async function salvaValutazione(_: Esito, form: FormData): Promise<Esito> {
  const c = await contestoStaff();
  const atleta_id = String(form.get("atleta_id"));
  const mese = String(form.get("mese"));
  if (!/^\d{4}-\d{2}$/.test(mese)) return { errore: "Mese non valido." };

  const valori: Record<string, number> = {};
  for (const v of VOCI_VALUTAZIONE) {
    const grezzo = String(form.get(v.chiave) ?? "").replace(",", ".").trim();
    if (!grezzo) continue;
    const n = Number(grezzo);
    if (!Number.isFinite(n) || n < SCALA.min || n > SCALA.max) return { errore: `${v.nome}: il voto va da ${SCALA.min} a ${SCALA.max}.` };
    valori[v.chiave] = Math.round(n * 2) / 2; // ammessi i mezzi voti
  }
  if (!Object.keys(valori).length) return { errore: "Inserisci almeno un voto." };
  const note = String(form.get("note") ?? "").trim() || null;

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("valutazioni")
    .upsert({ dojo_id: c.dojo.id, atleta_id, mese: primoDelMese(mese), valori, note }, { onConflict: "atleta_id,mese" });
  if (error) {
    if (/relation .*valutazioni.* does not exist|Could not find the table/i.test(error.message))
      return { errore: "Manca la tabella valutazioni: esegui supabase/migrations/0002_valutazioni.sql nel SQL Editor di Supabase." };
    return { errore: error.message };
  }

  revalidatePath("/valutazioni");
  revalidatePath(`/atleti/${atleta_id}`);
  revalidatePath("/squadra");
  return { ok: true };
}

/** Elimina una valutazione mensile inserita per errore. Solo amministratore. */
export async function eliminaValutazione(atletaId: string, mese: string): Promise<{ errore?: string }> {
  const c = await contestoStaff();
  if (c.ruolo !== "admin") return { errore: "Solo l'amministratore può eliminare le valutazioni." };
  if (!/^\d{4}-\d{2}(-01)?$/.test(mese)) return { errore: "Mese non valido." };
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("valutazioni")
    .delete()
    .eq("dojo_id", c.dojo.id)
    .eq("atleta_id", atletaId)
    .eq("mese", primoDelMese(mese));
  if (error) return { errore: error.message };
  revalidatePath("/valutazioni");
  revalidatePath(`/atleti/${atletaId}`);
  revalidatePath("/squadra");
  return {};
}
