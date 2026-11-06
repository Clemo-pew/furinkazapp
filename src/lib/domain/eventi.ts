import type { Evento } from "./tipi";

// Tipi di evento. La chiave è salvata nel database (eventi.tipo):
// per aggiungerne uno basta una riga qui; non rinominare chiavi già usate.
export const TIPI_EVENTO = [
  { chiave: "gara", nome: "Gara", colore: "var(--aka)" },
  { chiave: "stage", nome: "Stage / seminario", colore: "var(--ao)" },
  { chiave: "esame", nome: "Esame di grado", colore: "var(--gold)" },
  { chiave: "allenamento", nome: "Allenamento speciale", colore: "var(--good)" },
  { chiave: "riunione", nome: "Riunione", colore: "var(--muted)" },
  { chiave: "altro", nome: "Altro", colore: "var(--brand)" },
] as const;

export type TipoEvento = (typeof TIPI_EVENTO)[number]["chiave"];
export const tipoEventoValido = (t: string): t is TipoEvento => TIPI_EVENTO.some((x) => x.chiave === t);
export const infoTipo = (t: string) => TIPI_EVENTO.find((x) => x.chiave === t) ?? TIPI_EVENTO[TIPI_EVENTO.length - 1];

/** Quanti giorni prima dell'evento compare il promemoria nella home. */
export const PREAVVISO_EVENTO_GIORNI = 14;

const utc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const GIORNO = 86_400_000;

export const fineEvento = (e: Pick<Evento, "data_inizio" | "data_fine">) => e.data_fine ?? e.data_inizio;

/** Giorni da oggi all'inizio dell'evento (0 = oggi, negativo = già iniziato). */
export const giorniAllEvento = (e: Pick<Evento, "data_inizio">, oggi: string) => Math.round((utc(e.data_inizio) - utc(oggi)) / GIORNO);

/** Eventi non ancora finiti, dal più vicino. */
export function eventiFuturi(eventi: Evento[], oggi: string) {
  return eventi.filter((e) => fineEvento(e) >= oggi).sort((a, b) => a.data_inizio.localeCompare(b.data_inizio) || (a.ora ?? "").localeCompare(b.ora ?? ""));
}

/** Eventi da ricordare nella home: in corso oggi o che iniziano entro il preavviso. */
export function promemoria(eventi: Evento[], oggi: string, giorni = PREAVVISO_EVENTO_GIORNI) {
  return eventiFuturi(eventi, oggi).filter((e) => giorniAllEvento(e, oggi) <= giorni);
}

/** "Oggi", "Domani", "Tra 5 giorni", "In corso". */
export function quandoEvento(e: Pick<Evento, "data_inizio" | "data_fine">, oggi: string) {
  const g = giorniAllEvento(e, oggi);
  if (g < 0) return "In corso";
  if (g === 0) return "Oggi";
  if (g === 1) return "Domani";
  return `Tra ${g} giorni`;
}

/** L'evento occupa questo giorno? (vale anche per eventi su più giorni) */
export const eventoNelGiorno = (e: Pick<Evento, "data_inizio" | "data_fine">, giorno: string) =>
  e.data_inizio <= giorno && fineEvento(e) >= giorno;

/**
 * Griglia del calendario di un mese (AAAA-MM): settimane da lunedì a domenica,
 * con i giorni del mese prima e dopo per completare le righe.
 */
export function grigliaMese(mese: string) {
  const primo = utc(`${mese}-01`);
  const dow = (new Date(primo).getUTCDay() + 6) % 7; // 0 = lunedì
  const inizio = primo - dow * GIORNO;
  const mesePross = new Date(primo);
  mesePross.setUTCMonth(mesePross.getUTCMonth() + 1);
  const ultimo = mesePross.getTime() - GIORNO;
  const settimane: { data: string; delMese: boolean }[][] = [];
  for (let t = inizio; t <= ultimo || settimane.at(-1)?.length !== 7; t += GIORNO) {
    if (!settimane.length || settimane.at(-1)!.length === 7) settimane.push([]);
    const d = iso(t);
    settimane.at(-1)!.push({ data: d, delMese: d.startsWith(mese) });
  }
  return settimane;
}

/** Mese precedente o successivo: spostaMese("2026-01", -1) = "2025-12". */
export function spostaMese(mese: string, delta: number) {
  const d = new Date(Date.UTC(+mese.slice(0, 4), +mese.slice(5, 7) - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

const GIORNI_BREVI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const breve = (d: string) => {
  const t = new Date(utc(d));
  return `${GIORNI_BREVI[t.getUTCDay()]} ${t.getUTCDate()} ${MESI_BREVI[t.getUTCMonth()]}`;
};

/** "sab 15 nov · 09:30" oppure "sab 15 – dom 16 nov". */
export function dateEvento(e: Pick<Evento, "data_inizio" | "data_fine" | "ora">) {
  const fine = fineEvento(e);
  const testo = fine === e.data_inizio ? breve(e.data_inizio) : `${breve(e.data_inizio)} – ${breve(fine)}`;
  return e.ora ? `${testo} · ${e.ora}` : testo;
}
