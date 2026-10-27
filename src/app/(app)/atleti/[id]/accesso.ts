"use server";
import { revalidatePath } from "next/cache";
import { contestoAdmin } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emailDaLogin, erroreLogin, loginDaEmail, MIN_PASSWORD } from "@/lib/domain/credenziali";

// Gestione dell'accesso all'app di un atleta, fatta dall'amministratore.
// Ogni azione verifica prima il ruolo e che l'atleta sia del suo dojo;
// solo dopo usa la chiave segreta di Supabase.

export type Esito = { errore?: string; credenziali?: { login: string; password: string }; ok?: string } | undefined;

/** Atleta del dojo dell'amministratore (letto con i suoi permessi) e l'eventuale account collegato. */
async function verifica(atletaId: string) {
  const c = await contestoAdmin();
  const supabase = await supabaseServer();
  const { data: atleta } = await supabase.from("atleti").select("id, nome, dojo_id").eq("id", atletaId).maybeSingle();
  if (!atleta || atleta.dojo_id !== c.dojo.id) throw new Error("Atleta non trovato.");
  const { data: membro } = await supabase.from("membri").select("user_id").eq("dojo_id", c.dojo.id).eq("atleta_id", atletaId).maybeSingle();
  return { c, atleta, userId: (membro?.user_id as string | undefined) ?? null };
}

function controllaPassword(p: string) {
  return p.length >= MIN_PASSWORD ? null : `La password deve avere almeno ${MIN_PASSWORD} caratteri.`;
}

export async function creaAccesso(atletaId: string, _: Esito, form: FormData): Promise<Esito> {
  try {
    const { c, atleta, userId } = await verifica(atletaId);
    if (userId) return { errore: "Questo atleta ha già un accesso." };
    const login = String(form.get("login") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const ruolo = String(form.get("ruolo")) === "atleta_plus" ? "atleta_plus" : "atleta";
    const errore = erroreLogin(login) ?? controllaPassword(password);
    if (errore) return { errore };

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: emailDaLogin(login),
      password,
      email_confirm: true, // nessuna email di conferma
      user_metadata: { nome: atleta.nome },
    });
    if (error || !data.user) {
      const giaUsato = /already|registered|exists/i.test(error?.message ?? "");
      return { errore: giaUsato ? "Questo nome utente o email è già usato: scegline un altro." : `Supabase: ${error?.message}` };
    }

    const { error: errMembro } = await admin.from("membri").insert({
      dojo_id: c.dojo.id, user_id: data.user.id, ruolo, atleta_id: atleta.id,
    });
    if (errMembro) {
      await admin.auth.admin.deleteUser(data.user.id); // annulla: niente account orfani
      return { errore: `Non è stato possibile collegare l'account: ${errMembro.message}` };
    }

    revalidatePath(`/atleti/${atletaId}`);
    revalidatePath("/impostazioni");
    return { credenziali: { login: loginDaEmail(data.user.email), password } };
  } catch (e) {
    return { errore: (e as Error).message };
  }
}

export async function reimpostaPassword(atletaId: string, _: Esito, form: FormData): Promise<Esito> {
  try {
    const { userId } = await verifica(atletaId);
    if (!userId) return { errore: "Questo atleta non ha ancora un accesso." };
    const password = String(form.get("password") ?? "");
    const errore = controllaPassword(password);
    if (errore) return { errore };
    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { errore: `Supabase: ${error.message}` };
    return { credenziali: { login: loginDaEmail(data.user?.email), password } };
  } catch (e) {
    return { errore: (e as Error).message };
  }
}

export async function rimuoviAccesso(atletaId: string): Promise<Esito> {
  try {
    const { c, userId } = await verifica(atletaId);
    if (!userId) return { ok: "Nessun accesso da rimuovere." };
    const admin = supabaseAdmin();
    // Se la stessa persona fa parte anche di altri dojo, si toglie solo il collegamento a questo.
    const { count } = await admin.from("membri").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) > 1) {
      await admin.from("membri").delete().eq("dojo_id", c.dojo.id).eq("user_id", userId);
    } else {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return { errore: `Supabase: ${error.message}` };
    }
    revalidatePath(`/atleti/${atletaId}`);
    revalidatePath("/impostazioni");
    return { ok: "Accesso rimosso. Misure, valutazioni e incontri dell'atleta restano." };
  } catch (e) {
    return { errore: (e as Error).message };
  }
}
