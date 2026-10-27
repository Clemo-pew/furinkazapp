import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { adminConfigurato, supabaseAdmin } from "@/lib/supabase/admin";
import { loginDaEmail } from "@/lib/domain/credenziali";

export interface StatoAccesso {
  /** La chiave segreta è configurata su Vercel? */
  disponibile: boolean;
  collegato: boolean;
  /** Nome utente o email con cui l'atleta entra. */
  login: string | null;
}

/** Stato dell'accesso all'app di un atleta. Da chiamare solo dopo aver verificato che l'utente è amministratore. */
export async function statoAccesso(dojoId: string, atletaId: string): Promise<StatoAccesso> {
  const supabase = await supabaseServer();
  const { data: membro } = await supabase.from("membri").select("user_id").eq("dojo_id", dojoId).eq("atleta_id", atletaId).maybeSingle();
  if (!membro) return { disponibile: adminConfigurato, collegato: false, login: null };
  if (!adminConfigurato) return { disponibile: false, collegato: true, login: null };
  const { data } = await supabaseAdmin().auth.admin.getUserById(membro.user_id);
  return { disponibile: true, collegato: true, login: data.user ? loginDaEmail(data.user.email) : null };
}
