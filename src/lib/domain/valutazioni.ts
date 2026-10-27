import type { Valutazione } from "./tipi";

// Voci della valutazione tecnica dell'allenatore. Sono salvate nel campo JSON valutazioni.valori:
// per aggiungere una voce basta una riga qui (compare nel modulo, nel radar e nella media).
// Non rinominare le chiavi già usate.
export const VOCI_VALUTAZIONE = [
  { chiave: "velocita", nome: "Velocità", breve: "Velocità" },
  { chiave: "tecnica", nome: "Tecnica", breve: "Tecnica" },
  { chiave: "costituzione", nome: "Costituzione", breve: "Costituz." },
  { chiave: "tattica", nome: "Tattica", breve: "Tattica" },
  { chiave: "calci", nome: "Abilità con i calci", breve: "Calci" },
  { chiave: "pugni", nome: "Abilità con i pugni", breve: "Pugni" },
] as const;

/** Scala dei punteggi. */
export const SCALA = { min: 1, max: 10 } as const;

export const valido = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= SCALA.min && v <= SCALA.max;

/** Media delle voci compilate, arrotondata a un decimale; null se nessuna voce. */
export function media(valori: Record<string, number> | undefined | null): number | null {
  if (!valori) return null;
  const n = VOCI_VALUTAZIONE.map((v) => valori[v.chiave]).filter(valido);
  return n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : null;
}

/** Ultima valutazione e quella precedente (in ordine di mese). */
export function ultimeDue(valutazioni: Valutazione[]) {
  const ordinate = [...valutazioni].sort((a, b) => a.mese.localeCompare(b.mese));
  return { ultima: ordinate.at(-1), precedente: ordinate.at(-2) };
}
