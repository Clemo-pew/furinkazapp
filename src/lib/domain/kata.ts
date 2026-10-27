import type { Valutazione } from "./tipi";

// Kata dello stile Shotokan, nell'ordine in cui di solito si imparano.
// La chiave è salvata nel database (kata_conosciuti.kata e valutazioni.kata):
// per aggiungere un kata basta una riga qui; non rinominare le chiavi già usate.
export const GRUPPI_KATA = ["Heian", "Tekki", "Superiori"] as const;

export const KATA = [
  { chiave: "heian_shodan", nome: "Heian Shodan", gruppo: "Heian" },
  { chiave: "heian_nidan", nome: "Heian Nidan", gruppo: "Heian" },
  { chiave: "heian_sandan", nome: "Heian Sandan", gruppo: "Heian" },
  { chiave: "heian_yondan", nome: "Heian Yondan", gruppo: "Heian" },
  { chiave: "heian_godan", nome: "Heian Godan", gruppo: "Heian" },
  { chiave: "tekki_shodan", nome: "Tekki Shodan", gruppo: "Tekki" },
  { chiave: "tekki_nidan", nome: "Tekki Nidan", gruppo: "Tekki" },
  { chiave: "tekki_sandan", nome: "Tekki Sandan", gruppo: "Tekki" },
  { chiave: "bassai_dai", nome: "Bassai Dai", gruppo: "Superiori" },
  { chiave: "bassai_sho", nome: "Bassai Sho", gruppo: "Superiori" },
  { chiave: "kanku_dai", nome: "Kanku Dai", gruppo: "Superiori" },
  { chiave: "kanku_sho", nome: "Kanku Sho", gruppo: "Superiori" },
  { chiave: "enpi", nome: "Enpi", gruppo: "Superiori" },
  { chiave: "jion", nome: "Jion", gruppo: "Superiori" },
  { chiave: "jiin", nome: "Jiin", gruppo: "Superiori" },
  { chiave: "jitte", nome: "Jitte", gruppo: "Superiori" },
  { chiave: "hangetsu", nome: "Hangetsu", gruppo: "Superiori" },
  { chiave: "gankaku", nome: "Gankaku", gruppo: "Superiori" },
  { chiave: "chinte", nome: "Chinte", gruppo: "Superiori" },
  { chiave: "sochin", nome: "Sochin", gruppo: "Superiori" },
  { chiave: "nijushiho", nome: "Nijushiho", gruppo: "Superiori" },
  { chiave: "meikyo", nome: "Meikyo", gruppo: "Superiori" },
  { chiave: "wankan", nome: "Wankan", gruppo: "Superiori" },
  { chiave: "unsu", nome: "Unsu", gruppo: "Superiori" },
  { chiave: "gojushiho_sho", nome: "Gojushiho Sho", gruppo: "Superiori" },
  { chiave: "gojushiho_dai", nome: "Gojushiho Dai", gruppo: "Superiori" },
] as const satisfies readonly { chiave: string; nome: string; gruppo: (typeof GRUPPI_KATA)[number] }[];

const ORDINE = new Map<string, number>(KATA.map((k, i) => [k.chiave, i]));
const NOMI = new Map<string, string>(KATA.map((k) => [k.chiave, k.nome]));

export const kataValido = (k: string) => ORDINE.has(k);
export const nomeKata = (k: string) => NOMI.get(k) ?? k;
/** Ordina le chiavi secondo l'ordine di apprendimento. */
export const ordinaKata = (chiavi: string[]) =>
  [...chiavi].sort((a, b) => (ORDINE.get(a) ?? 999) - (ORDINE.get(b) ?? 999));

/** Storico dei voti di un kata, dal più vecchio al più recente. */
export function storicoKata(valutazioni: Valutazione[], kata: string) {
  return [...valutazioni]
    .sort((a, b) => a.mese.localeCompare(b.mese))
    .filter((v) => typeof v.kata?.[kata] === "number")
    .map((v) => ({ mese: v.mese, voto: v.kata[kata] }));
}

/** Media dei voti dei kata in una valutazione (arrotondata a un decimale). */
export function mediaKata(kata: Record<string, number> | undefined | null): number | null {
  const voti = Object.entries(kata ?? {}).filter(([k, v]) => kataValido(k) && typeof v === "number").map(([, v]) => v);
  return voti.length ? Math.round((voti.reduce((a, b) => a + b, 0) / voti.length) * 10) / 10 : null;
}
