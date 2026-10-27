import type { Allenamento } from "./tipi";

// Argomenti di un allenamento. La chiave è salvata nel database (allenamenti.argomenti):
// per aggiungerne uno basta una riga qui; non rinominare chiavi già usate.
export const ARGOMENTI = [
  { chiave: "kihon", nome: "Kihon" },
  { chiave: "kata", nome: "Kata" },
  { chiave: "kumite", nome: "Kumite" },
  { chiave: "tecnica", nome: "Tecnica" },
  { chiave: "tattica", nome: "Tattica" },
  { chiave: "atletica", nome: "Preparazione atletica" },
  { chiave: "mobilita", nome: "Mobilità e stretching" },
  { chiave: "gara", nome: "Simulazione gara" },
] as const;

export const nomeArgomento = (k: string) => ARGOMENTI.find((a) => a.chiave === k)?.nome ?? k;

export const DURATA_PREDEFINITA = 90;

const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
/** "2026-10-27" → "martedì 27" */
export function giornoSettimana(data: string) {
  const [y, m, d] = data.split("-").map(Number);
  return `${GIORNI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}`;
}

/** "90" → "1 h 30 min" */
export function formatoDurata(min: number | null | undefined) {
  if (!min) return null;
  const h = Math.floor(min / 60), r = min % 60;
  return h ? `${h} h${r ? ` ${r} min` : ""}` : `${r} min`;
}

/** Presenze di un atleta: totale e negli ultimi `giorni` giorni rispetto a `oggi`. */
export function presenzeAtleta(atletaId: string, allenamenti: Allenamento[], oggi: string, giorni = 30) {
  const limite = new Date(`${oggi}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - giorni);
  const da = limite.toISOString().slice(0, 10);
  const recenti = allenamenti.filter((a) => a.data > da && a.data <= oggi);
  return {
    totale: allenamenti.filter((a) => a.presenti.includes(atletaId)).length,
    recenti: recenti.filter((a) => a.presenti.includes(atletaId)).length,
    recentiSvolti: recenti.length,
  };
}

/** Raggruppa gli allenamenti per mese (AAAA-MM), mantenendo l'ordine. */
export function perMese(allenamenti: Allenamento[]) {
  const gruppi = new Map<string, Allenamento[]>();
  for (const a of allenamenti) {
    const m = a.data.slice(0, 7);
    gruppi.set(m, [...(gruppi.get(m) ?? []), a]);
  }
  return [...gruppi.entries()];
}
