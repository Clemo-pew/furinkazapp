"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { kataValido } from "@/lib/domain/kata";

/** Aggiorna l'elenco dei kata conosciuti da un atleta (staff). */
export async function salvaKataConosciuti(atletaId: string, lista: { kata: string; dal: string | null }[]): Promise<{ errore?: string }> {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const { data: atleta } = await supabase.from("atleti").select("id, dojo_id").eq("id", atletaId).maybeSingle();
  if (!atleta || atleta.dojo_id !== c.dojo.id) return { errore: "Atleta non trovato." };

  const righe = lista
    .filter((k) => kataValido(k.kata))
    .map((k) => ({
      atleta_id: atletaId,
      dojo_id: c.dojo.id,
      kata: k.kata,
      dal: k.dal && /^\d{4}-\d{2}-\d{2}$/.test(k.dal) ? k.dal : null,
    }));

  const chiavi = righe.map((r) => r.kata);
  let rimuovi = supabase.from("kata_conosciuti").delete().eq("atleta_id", atletaId);
  if (chiavi.length) rimuovi = rimuovi.not("kata", "in", `(${chiavi.join(",")})`);
  const { error: e1 } = await rimuovi;
  if (e1) {
    if (/kata_conosciuti/.test(e1.message) && /does not exist|Could not find/i.test(e1.message))
      return { errore: "Manca la tabella dei kata: esegui supabase/migrations/0005_kata.sql nel SQL Editor di Supabase." };
    return { errore: e1.message };
  }
  if (righe.length) {
    const { error: e2 } = await supabase.from("kata_conosciuti").upsert(righe, { onConflict: "atleta_id,kata" });
    if (e2) return { errore: e2.message };
  }
  revalidatePath(`/atleti/${atletaId}`);
  revalidatePath("/valutazioni");
  return {};
}
