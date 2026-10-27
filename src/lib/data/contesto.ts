import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import type { Dojo, Ruolo } from "@/lib/domain/tipi";

export interface Contesto {
  userId: string;
  email: string | undefined;
  nomeUtente: string | null;
  dojo: Dojo;
  ruolo: Ruolo;
  /** Scheda collegata, se l'utente è un atleta. */
  atletaId: string | null;
  staff: boolean;
  /** Tutti i dojo dell'utente (per un futuro selettore di società). */
  dojos: { dojo: Dojo; ruolo: Ruolo }[];
}

/** Cookie con il dojo scelto, se l'utente ne ha più di uno. */
export const COOKIE_DOJO = "dojo_attivo";

/**
 * Chi è l'utente e in quale dojo sta lavorando. Una sola lettura per richiesta.
 * Se non ha ancora un dojo, lo manda alla pagina di benvenuto.
 */
export const contesto = cache(async (): Promise<Contesto> => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const [{ data: membri }, { data: profilo }] = await Promise.all([
    supabase.from("membri").select("ruolo, atleta_id, dojos(id, nome)").eq("user_id", user.id).order("created_at"),
    supabase.from("profili").select("nome").eq("id", user.id).maybeSingle(),
  ]);

  const lista = (membri ?? [])
    .filter((m) => m.dojos)
    .map((m) => ({ dojo: m.dojos as unknown as Dojo, ruolo: m.ruolo as Ruolo, atletaId: m.atleta_id as string | null }));
  if (!lista.length) redirect("/benvenuto");

  const scelto = (await cookies()).get(COOKIE_DOJO)?.value;
  const attivo = lista.find((m) => m.dojo.id === scelto) ?? lista[0];

  return {
    userId: user.id,
    email: user.email,
    nomeUtente: profilo?.nome ?? null,
    dojo: attivo.dojo,
    ruolo: attivo.ruolo,
    atletaId: attivo.atletaId,
    staff: attivo.ruolo === "admin" || attivo.ruolo === "istruttore",
    dojos: lista.map(({ dojo, ruolo }) => ({ dojo, ruolo })),
  };
});

/** Per le pagine riservate ad allenatori e istruttori. */
export async function contestoStaff() {
  const c = await contesto();
  if (!c.staff) redirect(c.atletaId ? `/atleti/${c.atletaId}` : "/");
  return c;
}
