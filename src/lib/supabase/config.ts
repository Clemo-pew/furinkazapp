// Accetta sia la vecchia "anon key" sia la nuova "publishable key" di Supabase.
const URL_GREZZO = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();

/**
 * Riporta l'indirizzo alla forma corretta https://<progetto>.supabase.co,
 * anche se è stato incollato con un percorso in più (es. /rest/v1/), una barra finale
 * o come indirizzo della dashboard (supabase.com/dashboard/project/<progetto>).
 */
export function normalizzaUrlSupabase(grezzo: string): string {
  if (!grezzo) return "";
  const conProtocollo = /^https?:\/\//i.test(grezzo) ? grezzo : `https://${grezzo}`;
  try {
    const u = new URL(conProtocollo);
    const dashboard = u.pathname.match(/\/project\/([a-z0-9]{10,})/i);
    if (/(^|\.)supabase\.com$/i.test(u.hostname) && dashboard) return `https://${dashboard[1]}.supabase.co`;
    return u.origin;
  } catch {
    return grezzo.replace(/\/+$/, "");
  }
}

export const SUPABASE_URL = normalizzaUrlSupabase(URL_GREZZO);
export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();
export const supabaseConfigurato = Boolean(SUPABASE_URL && SUPABASE_KEY);
