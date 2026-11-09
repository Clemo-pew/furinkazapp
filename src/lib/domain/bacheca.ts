import type { Comunicazione } from "./tipi";

/** Ancora attuale: senza scadenza, o con scadenza da oggi in poi. */
export const attiva = (c: Pick<Comunicazione, "scade_il">, oggi: string) => !c.scade_il || c.scade_il >= oggi;

/** Ordine della bacheca: prima le fissate, poi le più recenti. */
export function ordinaBacheca(lista: Comunicazione[]) {
  return [...lista].sort((a, b) => Number(b.in_evidenza) - Number(a.in_evidenza) || b.created_at.localeCompare(a.created_at));
}

/**
 * Cosa mostrare nella home: tutte le comunicazioni in evidenza ancora attive,
 * più le ultime non in evidenza dei 7 giorni precedenti (al massimo `max` in totale).
 */
export function perLaHome(lista: Comunicazione[], oggi: string, max = 4) {
  const settimanaFa = new Date(`${oggi}T00:00:00Z`);
  settimanaFa.setUTCDate(settimanaFa.getUTCDate() - 7);
  const limite = settimanaFa.toISOString();
  return ordinaBacheca(lista.filter((c) => attiva(c, oggi) && (c.in_evidenza || c.created_at >= limite))).slice(0, max);
}

/** Separa le comunicazioni attuali da quelle scadute. */
export function dividiBacheca(lista: Comunicazione[], oggi: string) {
  const ordinata = ordinaBacheca(lista);
  return { attuali: ordinata.filter((c) => attiva(c, oggi)), passate: ordinata.filter((c) => !attiva(c, oggi)) };
}
