"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Esito = { errore?: string } | undefined;

export async function creaDojo(_: Esito, form: FormData): Promise<Esito> {
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return { errore: "Scrivi il nome della società." };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("crea_dojo", { p_nome: nome });
  if (error) return { errore: error.message };
  redirect("/squadra");
}

export async function usaCodice(_: Esito, form: FormData): Promise<Esito> {
  const codice = String(form.get("codice") ?? "").trim();
  if (!codice) return { errore: "Inserisci il codice." };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("accetta_invito", { p_codice: codice });
  if (error) return { errore: error.message };
  redirect("/");
}
