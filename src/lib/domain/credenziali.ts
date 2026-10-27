// Gli atleti possono entrare con un semplice nome utente (es. "luca.ferrara").
// Supabase richiede un'email: il nome utente viene trasformato in un indirizzo
// interno che non riceve posta (l'app non invia email).
export const DOMINIO_UTENTI = "atleti.furinkazapp.local";

const RE_NOME_UTENTE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

/** "Luca.Ferrara" → "luca.ferrara@atleti.furinkazapp.local"; un'email resta com'è. */
export function emailDaLogin(login: string): string {
  const s = login.trim().toLowerCase();
  return s.includes("@") ? s : `${s}@${DOMINIO_UTENTI}`;
}

/** Cosa mostrare all'allenatore: il nome utente se interno, altrimenti l'email. */
export function loginDaEmail(email: string | undefined | null): string {
  if (!email) return "";
  return email.endsWith(`@${DOMINIO_UTENTI}`) ? email.slice(0, -DOMINIO_UTENTI.length - 1) : email;
}

/** Controlla il nome utente o l'email scelti dall'allenatore. Restituisce un errore o null. */
export function erroreLogin(login: string): string | null {
  const s = login.trim().toLowerCase();
  if (s.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Email non valida.";
  return RE_NOME_UTENTE.test(s)
    ? null
    : "Il nome utente deve avere da 3 a 40 caratteri: lettere minuscole, numeri, punto, trattino o trattino basso.";
}

/** Proposta di nome utente dal nome dell'atleta: "Luca Ferrara" → "luca.ferrara". */
export function proponiNomeUtente(nome: string): string {
  return nome
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

const PAROLE = ["kata", "kumite", "tigre", "fiamma", "vento", "foresta", "montagna", "dojo", "kiai", "shuto", "geri", "zuki"];

/** Password facile da comunicare a voce: parola + 4 cifre (es. "tigre-4821"). */
export function generaPassword(): string {
  const b = new Uint32Array(2);
  crypto.getRandomValues(b);
  return `${PAROLE[b[0] % PAROLE.length]}-${String(b[1] % 10000).padStart(4, "0")}`;
}

export const MIN_PASSWORD = 8;
