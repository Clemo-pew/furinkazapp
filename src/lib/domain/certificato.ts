// Certificato medico sportivo: tipo e scadenza.
export const TIPI_CERTIFICATO = [
  { chiave: "agonistico", nome: "Agonistico" },
  { chiave: "non_agonistico", nome: "Non agonistico" },
] as const;

export type TipoCertificato = (typeof TIPI_CERTIFICATO)[number]["chiave"];
export const tipoValido = (t: string): t is TipoCertificato => TIPI_CERTIFICATO.some((x) => x.chiave === t);
export const nomeTipo = (t: string) => TIPI_CERTIFICATO.find((x) => x.chiave === t)?.nome ?? t;

/** Giorni di preavviso: entro questo margine il certificato è "in scadenza". */
export const PREAVVISO_GIORNI = 30;

export type StatoCertificato = "valido" | "in_scadenza" | "scaduto" | "mancante";

const giorno = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));

/** Giorni dalla data di oggi alla scadenza (negativi se già scaduto). Il giorno di scadenza è ancora valido. */
export function giorniAllaScadenza(scadenza: string, oggi: string) {
  return Math.round((giorno(scadenza) - giorno(oggi)) / 86_400_000);
}

export function statoCertificato(scadenza: string | null | undefined, oggi: string): StatoCertificato {
  if (!scadenza) return "mancante";
  const g = giorniAllaScadenza(scadenza, oggi);
  if (g < 0) return "scaduto";
  return g <= PREAVVISO_GIORNI ? "in_scadenza" : "valido";
}

/** Frase breve per lo stato: "Scade tra 12 giorni", "Scaduto da 3 giorni"… */
export function descriviScadenza(scadenza: string, oggi: string) {
  const g = giorniAllaScadenza(scadenza, oggi);
  if (g === 0) return "Scade oggi";
  if (g === 1) return "Scade domani";
  if (g > 1) return `Scade tra ${g} giorni`;
  if (g === -1) return "Scaduto ieri";
  return `Scaduto da ${-g} giorni`;
}
