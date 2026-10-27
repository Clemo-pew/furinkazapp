import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Allenamento, Atleta, Incontro, KataConosciuto, Misura, Valutazione } from "@/lib/domain/tipi";

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

/**
 * Legge le valutazioni con un filtro. Se la colonna dei kata non esiste ancora
 * (migrazione 0005 non eseguita) rilegge senza, così il resto dell'app funziona.
 */
async function leggiValutazioni(filtro: (q: any) => any): Promise<Valutazione[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const supabase = await supabaseServer();
  const prova = async (campi: string) => filtro(supabase.from("valutazioni").select(campi)).order("mese");
  let { data, error } = await prova("id, atleta_id, mese, valori, kata, note");
  if (error && /kata/.test(error.message)) ({ data, error } = await prova("id, atleta_id, mese, valori, note"));
  if (error) throw error;
  return (data as Valutazione[]).map((v) => ({ ...v, kata: v.kata ?? {} }));
}

/** Valutazioni tecniche di uno o più atleti, dalla più vecchia alla più recente. */
export async function valutazioniDi(atletaIds: string[]): Promise<Valutazione[]> {
  if (!atletaIds.length) return [];
  return leggiValutazioni((q) => q.in("atleta_id", atletaIds));
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

/** Tutte le misure del dojo (per le pagine che le leggono insieme agli atleti, in parallelo). */
export async function misureDelDojo(dojoId: string): Promise<Misura[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("misure").select("id, atleta_id, mese, valori, note").eq("dojo_id", dojoId).order("mese");
  if (error) throw error;
  return data as Misura[];
}

/** Tutte le valutazioni del dojo (vedi misureDelDojo). */
export async function valutazioniDelDojo(dojoId: string): Promise<Valutazione[]> {
  return leggiValutazioni((q) => q.eq("dojo_id", dojoId));
}

type RigaAllenamento = Omit<Allenamento, "presenti"> & { presenze: { atleta_id: string }[] | null };
const CAMPI_ALLENAMENTO = "id, data, durata_min, argomenti, titolo, descrizione, presenze(atleta_id)";
const daRiga = (r: RigaAllenamento): Allenamento => {
  const { presenze, ...resto } = r;
  return { ...resto, presenti: (presenze ?? []).map((p) => p.atleta_id) };
};

/** Diario degli allenamenti del dojo, dal più recente. */
export async function elencoAllenamenti(dojoId: string): Promise<Allenamento[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("allenamenti")
    .select(CAMPI_ALLENAMENTO)
    .eq("dojo_id", dojoId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RigaAllenamento[]).map(daRiga);
}

export async function leggiAllenamento(id: string): Promise<(Allenamento & { dojo_id: string }) | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("allenamenti").select(`dojo_id, ${CAMPI_ALLENAMENTO}`).eq("id", id).maybeSingle();
  if (!data) return null;
  const r = data as unknown as RigaAllenamento & { dojo_id: string };
  return { ...daRiga(r), dojo_id: r.dojo_id };
}

/** Kata conosciuti dagli atleti del dojo (o di un solo atleta). Vuoto se la tabella non esiste ancora. */
export async function kataConosciuti(dojoId: string, atletaId?: string): Promise<KataConosciuto[]> {
  const supabase = await supabaseServer();
  let q = supabase.from("kata_conosciuti").select("atleta_id, kata, dal").eq("dojo_id", dojoId);
  if (atletaId) q = q.eq("atleta_id", atletaId);
  const { data, error } = await q;
  if (error) return [];
  return data as KataConosciuto[];
}

/** Video dei kata scelti dal dojo (kata → ID YouTube). Vuoto se la tabella non esiste ancora. */
export async function videoKataDelDojo(dojoId: string): Promise<Record<string, string>> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("kata_video").select("kata, youtube_id").eq("dojo_id", dojoId);
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.kata as string, r.youtube_id as string]));
}
