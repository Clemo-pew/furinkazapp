import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Chiave segreta di Supabase: scavalca i permessi, quindi si usa SOLO sul server
// e solo dopo aver verificato che chi chiama è amministratore del dojo.
// Su Vercel va in una variabile SENZA il prefisso NEXT_PUBLIC_.
const CHIAVE_SEGRETA = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "").trim();

export const adminConfigurato = Boolean(SUPABASE_URL && CHIAVE_SEGRETA);

export function supabaseAdmin() {
  if (!adminConfigurato) throw new Error("Manca la variabile SUPABASE_SERVICE_ROLE_KEY su Vercel.");
  return createClient(SUPABASE_URL, CHIAVE_SEGRETA, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
