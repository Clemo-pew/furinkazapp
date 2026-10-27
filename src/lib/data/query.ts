import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Atleta, Incontro, Misura } from "@/lib/domain/tipi";

// Tutte le letture dal database passano da qui: se cambia lo schema,
// si aggiorna un solo file. I permessi (RLS) filtrano già cosa può vedere l'utente.

export async function elencoAtleti(dojoId: string, { archiviati = false } = {}): Promise<Atleta[]> {
  const supabase = await supabaseServer();
  let q = supabase.from("atleti").select("*").eq("dojo_id", dojoId).order("nome");
  if (!archiviati) q = q.eq("archiviato", false);
  const { data, error } = await q;
  if (error) throw error;
  return data as Atleta[];
}

export async function leggiAtleta(id: string): Promise<Atleta | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("atleti").select("*").eq("id", id).maybeSingle();
  return (data as Atleta) ?? null;
}

/** Misure di uno o più atleti, dalla più vecchia alla più recente. */
export async function misureDi(atletaIds: string[]): Promise<Misura[]> {
  if (!atletaIds.length) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("misure")
    .select("id, atleta_id, mese, valori, note")
    .in("atleta_id", atletaIds)
    .order("mese");
  if (error) throw error;
  return data as Misura[];
}

/** Incontri del dojo con i punti, dal più recente. Se indicato, solo quelli di un atleta. */
export async function elencoIncontri(dojoId: string, atletaId?: string): Promise<Incontro[]> {
  const supabase = await supabaseServer();
  let q = supabase
    .from("incontri")
    .select("id, data, tipo, aka_atleta_id, aka_nome, ao_atleta_id, ao_nome, note, punti(ordine, lato, tecnica, zona, parte, situazione, valore)")
    .eq("dojo_id", dojoId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (atletaId) q = q.or(`aka_atleta_id.eq.${atletaId},ao_atleta_id.eq.${atletaId}`);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Incontro[]).map((i) => ({ ...i, punti: [...(i.punti ?? [])].sort((a, b) => a.ordine - b.ordine) }));
}
