"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const MESSAGGI: Record<string, string> = {
  "Invalid login credentials": "Email o password non corretti.",
  "Email not confirmed": "Account non confermato: l'amministratore deve disattivare la conferma email in Supabase.",
  "User already registered": "Esiste già un account con questa email. Accedi.",
};
const traduci = (m: string) => MESSAGGI[m] ?? m;

export function FormAccesso() {
  const router = useRouter();
  const [modo, setModo] = useState<"accedi" | "registrati">("accedi");
  const [errore, setErrore] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [attesa, setAttesa] = useState(false);

  async function invia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setErrore(null); setInfo(null); setAttesa(true);
    const supabase = supabaseBrowser();
    try {
      if (modo === "accedi") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setErrore(traduci(error.message));
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { nome: String(f.get("nome")).trim() }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) return setErrore(traduci(error.message));
        if (data.session) { router.replace("/"); router.refresh(); }
        // Succede solo se in Supabase è rimasta attiva la conferma email (vedi README, punto 4).
        else setInfo("Account creato, ma Supabase richiede la conferma email. Chiedi all'amministratore di disattivarla.");
      }
    } finally {
      setAttesa(false);
    }
  }

  return (
    <form onSubmit={invia} className="stack">
      <div className="seg" role="tablist">
        <button type="button" className="opt" aria-pressed={modo === "accedi"} onClick={() => setModo("accedi")}>Accedi</button>
        <button type="button" className="opt" aria-pressed={modo === "registrati"} onClick={() => setModo("registrati")}>Crea account</button>
      </div>
      {modo === "registrati" && (
        <label className="campo">Nome e cognome<input id="nome" name="nome" required autoComplete="name" /></label>
      )}
      <label className="campo">Email<input id="email" name="email" type="email" required autoComplete="email" /></label>
      <label className="campo">Password
        <input id="password" name="password" type="password" required minLength={8}
          autoComplete={modo === "accedi" ? "current-password" : "new-password"} />
      </label>
      {errore && <p className="errore" role="alert">{errore}</p>}
      {info && <p className="ok" role="status">{info}</p>}
      <button className="btn primary" disabled={attesa}>{attesa ? "Attendi…" : modo === "accedi" ? "Accedi" : "Crea account"}</button>
      {modo === "registrati" && (
        <p className="hint">Sei un atleta o un istruttore? Crea l&apos;account, poi inserisci il codice invito che ti ha dato l&apos;allenatore.</p>
      )}
    </form>
  );
}
