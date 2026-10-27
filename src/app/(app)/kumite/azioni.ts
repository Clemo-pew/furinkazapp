"use server";
import { revalidatePath } from "next/cache";
import { contestoStaff } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { puntiPer, TECNICHE } from "@/lib/domain/kumite";
import type { Lato, Parte, Situazione, Zona } from "@/lib/domain/tipi";

export interface NuovoIncontro {
  data: string;
  tipo: "allenamento" | "gara";
  aka: { atletaId: string | null; nome: string };
  ao: { atletaId: string | null; nome: string };
  note: string;
  punti: { lato: Lato; tecnica: string; zona: Zona; parte: Parte; situazione: Situazione }[];
}

export async function salvaIncontro(inc: NuovoIncontro): Promise<{ errore?: string; id?: string }> {
  const c = await contestoStaff();
  if (!inc.aka.nome.trim() || !inc.ao.nome.trim()) return { errore: "Indica entrambi gli atleti." };
  if (inc.aka.atletaId && inc.aka.atletaId === inc.ao.atletaId) return { errore: "AKA e AO devono essere atleti diversi." };
  for (const p of inc.punti) if (!(p.tecnica in TECNICHE)) return { errore: `Tecnica sconosciuta: ${p.tecnica}` };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("salva_incontro", {
    p: {
      dojo_id: c.dojo.id,
      data: inc.data,
      tipo: inc.tipo,
      aka_atleta_id: inc.aka.atletaId,
      aka_nome: inc.aka.nome.trim(),
      ao_atleta_id: inc.ao.atletaId,
      ao_nome: inc.ao.nome.trim(),
      note: inc.note.trim() || null,
      // il punteggio è sempre ricalcolato qui, non preso dal browser
      punti: inc.punti.map((p) => ({ ...p, valore: puntiPer(p.tecnica, p.zona) })),
    },
  });
  if (error) return { errore: error.message };
  revalidatePath("/", "layout");
  return { id: data as string };
}

export async function eliminaIncontro(id: string) {
  await contestoStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("incontri").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
