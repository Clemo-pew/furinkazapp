import type { Misura } from "./tipi";

// Elenco delle misure fisiche. Sono salvate nel campo JSON misure.valori,
// quindi per aggiungere una misura basta aggiungere una riga qui:
// compare subito nel modulo mensile, nella scheda atleta e nel grafico.
export const MISURE = [
  { chiave: "peso", nome: "Peso", unita: "kg", passo: 0.1 },
  { chiave: "altezza", nome: "Altezza", unita: "cm", passo: 0.5 },
  { chiave: "grasso", nome: "Massa grassa", unita: "%", passo: 0.1 },
  { chiave: "vita", nome: "Vita", unita: "cm", passo: 0.5 },
  { chiave: "torace", nome: "Torace", unita: "cm", passo: 0.5 },
  { chiave: "braccio", nome: "Braccio", unita: "cm", passo: 0.5 },
  { chiave: "coscia", nome: "Coscia", unita: "cm", passo: 0.5 },
] as const;

export type ChiaveMisura = (typeof MISURE)[number]["chiave"];

export const misuraInfo = (chiave: string) => MISURE.find((m) => m.chiave === chiave) ?? MISURE[0];

/** Ultimo valore registrato di una misura prima della rilevazione indicata (esclusa). */
export function valorePrecedente(misure: Misura[], chiave: string, primaDi?: string): number | undefined {
  const ordinate = [...misure].sort((a, b) => b.mese.localeCompare(a.mese));
  for (const m of ordinate) {
    if (primaDi && m.mese >= primaDi) continue;
    if (typeof m.valori?.[chiave] === "number") return m.valori[chiave];
  }
  return undefined;
}

/** Valore attuale e variazione rispetto alla rilevazione precedente che contiene quella misura. */
export function ultimaVariazione(misure: Misura[], chiave: string) {
  const conValore = [...misure]
    .filter((m) => typeof m.valori?.[chiave] === "number")
    .sort((a, b) => a.mese.localeCompare(b.mese));
  const ultima = conValore.at(-1);
  const precedente = conValore.at(-2);
  return {
    valore: ultima?.valori[chiave],
    mese: ultima?.mese,
    delta: ultima && precedente ? ultima.valori[chiave] - precedente.valori[chiave] : undefined,
  };
}
