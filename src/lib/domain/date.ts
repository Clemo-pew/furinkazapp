const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MESI_LUNGHI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** "2026-10" o "2026-10-01" → "ott 26" */
export function etichettaMese(m: string) {
  const [y, mm] = m.split("-");
  return `${MESI[Number(mm) - 1]} ${y.slice(2)}`;
}
/** "2026-10" → "ottobre 2026" */
export function meseEsteso(m: string) {
  const [y, mm] = m.split("-");
  return `${MESI_LUNGHI[Number(mm) - 1]} ${y}`;
}
/** Data di oggi nel fuso italiano, formato AAAA-MM-GG. */
export function oggi() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
}
export const meseCorrente = () => oggi().slice(0, 7);
/** "2026-10" → "2026-10-01" (formato della colonna misure.mese) */
export const primoDelMese = (m: string) => `${m.slice(0, 7)}-01`;
/** "2026-10-20" → "20/10/2026" */
export const dataIt = (d: string) => d.split("-").reverse().join("/");
export const eta = (anno: number | null) => (anno ? Number(oggi().slice(0, 4)) - anno : null);
