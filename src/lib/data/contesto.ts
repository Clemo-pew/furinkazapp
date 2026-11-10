import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import type { Dojo, Ruolo } from "@/lib/domain/tipi";
import { isStaff, vedeValutazioni } from "@/lib/domain/ruoli";
import { PRIVACY_VERSIONE } from "@/lib/privacy";

export interface Contesto {
  userId: string;
  email: string | undefined;
  nomeUtente: string | null;
  dojo: Dojo;
  ruolo: Ruolo;
  /** Scheda collegata, se l'utente è un atleta. */
  atletaId: string | null;
  staff: boolean;
  /** Può vedere i voti delle valutazioni (staff e Allievo+). */
  vedeValutazioni: boolean;
  /**
   * Accettazione dell'informativa attuale: `null` se non ancora accettata.
   * Se la tabella dei consensi non esiste ancora (migrazione 0013) vale come accettata, per non bloccare l'app.
   */
  privacy: { consensoSalute: boolean; accettatoDa: "interessato" | "genitore"; nomeGenitore: string | null; il: string | null } | null;
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
  // Verifica veloce del token (vedi middleware.ts).
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) redirect("/accedi");
  const user = { id: claims.sub, email: claims.email as string | undefined };

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

  const { data: consenso, error: errConsenso } = await supabase
    .from("consensi_privacy")
    .select("consenso_salute, accettato_da, nome_genitore, accettato_il")
    .eq("user_id", user.id).eq("dojo_id", attivo.dojo.id).eq("versione", PRIVACY_VERSIONE)
    .maybeSingle();
  const privacy = errConsenso
    ? { consensoSalute: true, accettatoDa: "interessato" as const, nomeGenitore: null, il: null }
    : consenso
      ? { consensoSalute: consenso.consenso_salute as boolean, accettatoDa: consenso.accettato_da as "interessato" | "genitore", nomeGenitore: consenso.nome_genitore as string | null, il: consenso.accettato_il as string }
      : null;

  return {
    userId: user.id,
    email: user.email,
    nomeUtente: profilo?.nome ?? null,
    dojo: attivo.dojo,
    ruolo: attivo.ruolo,
    atletaId: attivo.atletaId,
    staff: isStaff(attivo.ruolo),
    vedeValutazioni: vedeValutazioni(attivo.ruolo),
    privacy,
    dojos: lista.map(({ dojo, ruolo }) => ({ dojo, ruolo })),
  };
});

/** Per le azioni riservate all'amministratore (es. creare gli accessi degli atleti). */
export async function contestoAdmin() {
  const c = await contesto();
  if (c.ruolo !== "admin") throw new Error("Solo l'amministratore può farlo.");
  return c;
}

/** Per le pagine riservate ad allenatori e istruttori. */
export async function contestoStaff() {
  const c = await contesto();
  if (!c.staff) redirect(c.atletaId ? `/atleti/${c.atletaId}` : "/");
  return c;
}
