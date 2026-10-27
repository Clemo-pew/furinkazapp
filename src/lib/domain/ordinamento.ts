import type { Atleta } from "./tipi";

// Ordinamento dell'elenco atleti (pagina Squadra).
export const CRITERI = [
  { chiave: "nome", nome: "Nome", versoPredefinito: "asc" },
  { chiave: "cognome", nome: "Cognome", versoPredefinito: "asc" },
  { chiave: "cintura", nome: "Cintura", versoPredefinito: "desc" }, // dalla più alta
  { chiave: "eta", nome: "Età", versoPredefinito: "asc" }, // dal più giovane
] as const;

export type Criterio = (typeof CRITERI)[number]["chiave"];
export type Verso = "asc" | "desc";

export const criterioValido = (c: string | undefined): c is Criterio => CRITERI.some((x) => x.chiave === c);
export const versoPredefinito = (c: Criterio): Verso => CRITERI.find((x) => x.chiave === c)!.versoPredefinito;

// Particelle che fanno parte del cognome: "Luca De Rosa" → cognome "De Rosa".
const PARTICELLE = new Set(["de", "di", "da", "del", "della", "dello", "dei", "degli", "delle", "dal", "dalla", "lo", "la", "le", "li", "van", "von", "mc"]);

/**
 * Cognome ricavato dal nome completo: l'ultima parola, più le eventuali particelle che la precedono.
 * Il nome è salvato in un unico campo "Nome e cognome", quindi è una stima: funziona con la forma "Nome Cognome".
 */
export function cognomeDi(nomeCompleto: string): string {
  const parti = nomeCompleto.trim().split(/\s+/);
  if (parti.length < 2) return parti[0] ?? "";
  let i = parti.length - 1;
  while (i > 1 && PARTICELLE.has(parti[i - 1].toLowerCase().replace(/['’]$/, ""))) i--;
  return parti.slice(i).join(" ");
}

const confronta = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });

/** Restituisce una copia ordinata. A parità, ordina per nome. Età e cintura mancanti vanno in fondo. */
export function ordinaAtleti(atleti: Atleta[], criterio: Criterio, verso: Verso): Atleta[] {
  const segno = verso === "asc" ? 1 : -1;
  return [...atleti].sort((a, b) => {
    let r = 0;
    if (criterio === "nome") r = confronta(a.nome, b.nome) * segno;
    else if (criterio === "cognome") r = confronta(cognomeDi(a.nome), cognomeDi(b.nome)) * segno;
    else if (criterio === "cintura") r = (a.cintura - b.cintura) * segno;
    else if (criterio === "eta") {
      if (a.anno_nascita == null || b.anno_nascita == null) r = (a.anno_nascita == null ? 1 : 0) - (b.anno_nascita == null ? 1 : 0);
      else r = (b.anno_nascita - a.anno_nascita) * segno; // anno più recente = più giovane
    }
    return r || confronta(a.nome, b.nome);
  });
}
