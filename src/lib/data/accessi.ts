import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { adminConfigurato, supabaseAdmin } from "@/lib/supabase/admin";
import { loginDaEmail } from "@/lib/domain/credenziali";
import type { Ruolo } from "@/lib/domain/tipi";

export interface StatoAccesso {
  /** La chiave segreta è configurata su Vercel? */
  disponibile: boolean;
  collegato: boolean;
  /** Nome utente o email con cui l'atleta entra. */
  login: string | null;
  /** Allievo o Allievo+ (se collegato). */
  ruolo: Ruolo | null;
}

/**
 * Per ogni atleta collegato a un account: il nome utente o l'email con cui entra.
 * Da chiamare solo dopo aver verificato che l'utente è amministratore.
 */
export async function accessiAtleti(dojoId: string): Promise<Map<string, string | null>> {
  const supabase = await supabaseServer();
  const { data: membri } = await supabase.from("membri").select("user_id, atleta_id").eq("dojo_id", dojoId).not("atleta_id", "is", null);
  const mappa = new Map<string, string | null>();
  if (!membri?.length) return mappa;
  const emailPerUtente = new Map<string, string | undefined>();
  if (adminConfigurato) {
    const { data } = await supabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) emailPerUtente.set(u.id, u.email);
  }
  for (const m of membri) mappa.set(m.atleta_id as string, emailPerUtente.has(m.user_id) ? loginDaEmail(emailPerUtente.get(m.user_id)) : null);
  return mappa;
}

/** Stato dell'accesso all'app di un atleta. Da chiamare solo dopo aver verificato che l'utente è amministratore. */
export async function statoAccesso(dojoId: string, atletaId: string): Promise<StatoAccesso> {
  const supabase = await supabaseServer();
  const { data: membro } = await supabase.from("membri").select("user_id, ruolo").eq("dojo_id", dojoId).eq("atleta_id", atletaId).maybeSingle();
  if (!membro) return { disponibile: adminConfigurato, collegato: false, login: null, ruolo: null };
  const ruolo = membro.ruolo as Ruolo;
  if (!adminConfigurato) return { disponibile: false, collegato: true, login: null, ruolo };
  const { data } = await supabaseAdmin().auth.admin.getUserById(membro.user_id);
  return { disponibile: true, collegato: true, login: data.user ? loginDaEmail(data.user.email) : null, ruolo };
}
