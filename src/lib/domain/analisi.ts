import { nomeTecnica, PARTI, risultato, SITUAZIONI, ZONE } from "./kumite";
import type { Incontro, Lato, Punto, Situazione } from "./tipi";

export interface StatisticheKumite {
  incontri: number;
  vinti: number;
  pari: number;
  persi: number;
  puntiFatti: number;
  puntiSubiti: number;
  fatti: Punto[];
  subiti: Punto[];
}

export const latoDi = (inc: Incontro, atletaId: string): Lato | null =>
  inc.aka_atleta_id === atletaId ? "aka" : inc.ao_atleta_id === atletaId ? "ao" : null;

export function statisticheKumite(atletaId: string, incontri: Incontro[]): StatisticheKumite {
  const s: StatisticheKumite = { incontri: 0, vinti: 0, pari: 0, persi: 0, puntiFatti: 0, puntiSubiti: 0, fatti: [], subiti: [] };
  for (const inc of incontri) {
    const io = latoDi(inc, atletaId);
    if (!io) continue;
    s.incontri++;
    const r = risultato(inc.punti);
    if (r.vincitore === io) s.vinti++;
    else if (r.vincitore) s.persi++;
    else s.pari++;
    for (const p of inc.punti) (p.lato === io ? s.fatti : s.subiti).push(p);
  }
  s.puntiFatti = s.fatti.reduce((a, p) => a + p.valore, 0);
  s.puntiSubiti = s.subiti.reduce((a, p) => a + p.valore, 0);
  return s;
}

/** Conta gli elementi per chiave, in ordine decrescente. */
export function contaPer<T>(lista: T[], chiave: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const x of lista) m.set(chiave(x), (m.get(chiave(x)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const perc = (n: number, t: number) => Math.round((n / t) * 100);

/** Sotto questa soglia di punti subiti non si trae nessuna conclusione. */
export const MINIMO_PUNTI_ANALISI = 4;

const CONSIGLI: Record<Situazione, string> = {
  attacco: "Quando attacca resta scoperto: lavorare su distanza e copertura durante l'entrata.",
  contrattacco: "Dopo il proprio attacco non rientra in guardia: lavorare su uscita e copertura.",
  anticipo: "Viene anticipato mentre parte: lavorare su preparazione dell'attacco, finte e cambi di ritmo.",
};

export interface Debolezze {
  totale: number;
  tecnica: { nome: string; percentuale: number };
  zona?: { nome: string; percentuale: number };
  situazione: { chiave: Situazione; nome: string; percentuale: number; consiglio: string };
}

/** Dove l'atleta subisce più punti: tecnica, zona/lato del corpo, situazione. */
export function analizzaDebolezze(subiti: Punto[]): Debolezze | null {
  const t = subiti.length;
  if (t < MINIMO_PUNTI_ANALISI) return null;
  const [tk, tn] = contaPer(subiti, (p) => p.tecnica)[0];
  const zp = contaPer(subiti.filter((p) => p.zona !== "terra"), (p) => `${p.zona}_${p.parte}`)[0];
  const [sk, sn] = contaPer(subiti, (p) => p.situazione)[0] as [Situazione, number];
  return {
    totale: t,
    tecnica: { nome: nomeTecnica(tk), percentuale: perc(tn, t) },
    zona: zp
      ? (() => {
          const [z, pt] = zp[0].split("_") as [keyof typeof ZONE, keyof typeof PARTI];
          return { nome: `${ZONE[z]} ${PARTI[pt].toLowerCase()}`, percentuale: perc(zp[1], t) };
        })()
      : undefined,
    situazione: { chiave: sk, nome: SITUAZIONI[sk], percentuale: perc(sn, t), consiglio: CONSIGLI[sk] },
  };
}

/** Riassunto breve per la tabella squadra: tecnica + zona più subita. */
export function debolezzaPrincipale(subiti: Punto[]): string | null {
  if (subiti.length < MINIMO_PUNTI_ANALISI) return null;
  const [k, n] = contaPer(subiti, (p) => `${p.tecnica}|${p.zona}`)[0];
  const [t, z] = k.split("|") as [string, keyof typeof ZONE];
  return `${nomeTecnica(t)}${z === "terra" ? "" : " " + ZONE[z].toLowerCase()} · ${perc(n, subiti.length)}%`;
}

/** Conteggio dei punti subiti per area del corpo, per la mappa. */
export function mappaColpi(subiti: Punto[]) {
  const c: Record<string, number> = {};
  for (const p of subiti) {
    const k = p.zona === "terra" ? "terra" : `${p.zona}_${p.parte}`;
    c[k] = (c[k] ?? 0) + 1;
  }
  return c;
}
