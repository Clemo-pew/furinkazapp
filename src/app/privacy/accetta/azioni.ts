"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { contesto } from "@/lib/data/contesto";
import { supabaseServer } from "@/lib/supabase/server";
import { PRIVACY_VERSIONE } from "@/lib/privacy";

export type Esito = { errore?: string } | undefined;

export async function accettaPrivacy(_: Esito, form: FormData): Promise<Esito> {
  const c = await contesto();
  if (form.get("letto") !== "on") return { errore: "Per usare l'app devi confermare di aver letto l'informativa." };
  const accettatoDa = form.get("accettato_da") === "genitore" ? "genitore" : "interessato";
  const nomeGenitore = String(form.get("nome_genitore") ?? "").trim();
  if (accettatoDa === "genitore" && nomeGenitore.length < 2) return { errore: "Scrivi nome e cognome del genitore o tutore." };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("consensi_privacy").upsert({
    user_id: c.userId,
    dojo_id: c.dojo.id,
    versione: PRIVACY_VERSIONE,
    letto: true,
    // il consenso ai dati sulla salute riguarda solo chi ha una scheda atleta
    consenso_salute: Boolean(c.atletaId) && form.get("consenso_salute") === "on",
    accettato_da: accettatoDa,
    nome_genitore: accettatoDa === "genitore" ? nomeGenitore : null,
    accettato_il: new Date().toISOString(),
  });
  if (error) return { errore: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}
