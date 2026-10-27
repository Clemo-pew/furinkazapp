import type { Lato, Parte, Punto, Situazione, Zona } from "./tipi";

// Tecniche registrabili. La chiave è salvata nel database (punti.tecnica):
// per aggiungere una tecnica basta una riga nuova; non rinominare chiavi già usate.
//   tipo "zuki"  = tecniche di braccio → Yuko (1)
//   tipo "geri"  = calci → Waza-ari (2) a chudan, Ippon (3) a jodan
//   tipo "nage"  = atterramento con finalizzazione → Ippon (3)
export const TECNICHE = {
  kizami: { nome: "Kizami-zuki", tipo: "zuki" },
  gyaku: { nome: "Gyaku-zuki", tipo: "zuki" },
  uraken: { nome: "Uraken-uchi", tipo: "zuki" },
  mae: { nome: "Mae-geri", tipo: "geri" },
  mawashi: { nome: "Mawashi-geri", tipo: "geri" },
  ura: { nome: "Ura-mawashi-geri", tipo: "geri" },
  ushiro: { nome: "Ushiro-geri", tipo: "geri" },
  nage: { nome: "Spazzata / proiezione", tipo: "nage" },
} as const satisfies Record<string, { nome: string; tipo: "zuki" | "geri" | "nage" }>;

export type ChiaveTecnica = keyof typeof TECNICHE;

export const ZONE: Record<Zona, string> = { jodan: "Jodan", chudan: "Chudan", terra: "A terra" };
export const PARTI: Record<Parte, string> = { sx: "Sinistro", c: "Centro", dx: "Destro" };
export const SITUAZIONI: Record<Situazione, string> = {
  attacco: "In attacco",
  contrattacco: "Contrattacco",
  anticipo: "Anticipo (sen no sen)",
};
export const NOMI_PUNTEGGIO: Record<number, string> = { 1: "Yuko", 2: "Waza-ari", 3: "Ippon" };

export const nomeTecnica = (k: string) => (TECNICHE as Record<string, { nome: string }>)[k]?.nome ?? k;
export const tipoTecnica = (k: string) =>
  (TECNICHE as Record<string, { tipo: string }>)[k]?.tipo ?? "zuki";

/** Punteggio WKF per tecnica e zona. */
export function puntiPer(tecnica: string, zona: Zona): number {
  const tipo = tipoTecnica(tecnica);
  if (tipo === "zuki") return 1;
  if (tipo === "nage") return 3;
  return zona === "jodan" ? 3 : 2;
}

export interface Risultato {
  aka: number;
  ao: number;
  /** Chi ha segnato per primo (vantaggio del primo punto). */
  senshu: Lato | null;
  vincitore: Lato | null;
  perSenshu: boolean;
}

export function risultato(punti: Pick<Punto, "lato" | "valore" | "ordine">[]): Risultato {
  const ordinati = [...punti].sort((a, b) => a.ordine - b.ordine);
  const aka = ordinati.filter((p) => p.lato === "aka").reduce((s, p) => s + p.valore, 0);
  const ao = ordinati.filter((p) => p.lato === "ao").reduce((s, p) => s + p.valore, 0);
  const senshu = ordinati[0]?.lato ?? null;
  let vincitore: Lato | null = aka > ao ? "aka" : ao > aka ? "ao" : null;
  const perSenshu = vincitore === null && aka > 0 && senshu !== null;
  if (perSenshu) vincitore = senshu;
  return { aka, ao, senshu, vincitore, perSenshu };
}
